// Load polyfill — only needed in Chrome's service worker context.
// In Firefox, it's already loaded via background.scripts in the manifest.
if (typeof importScripts !== "undefined") {
  try {
    importScripts("js/browser-polyfill.js");
  } catch (e) {
    console.error("Polyfill import failed", e);
  }
}

// Detect browser environment
const IS_FIREFOX = typeof browser !== "undefined" && 
  navigator.userAgent.includes("Firefox");

// Simple in-memory token cache for Firefox (Chrome caches automatically)
let _firefoxToken = null;

// Google OAuth Client IDs
// Chrome uses the Extension-type Client ID (matched against Extension ID in Google Cloud).
// Firefox requires a Web Application-type Client ID with the redirect URL added as an authorized redirect URI.
// To get your Firefox redirect URL: open about:debugging → Inspect your extension → run browser.identity.getRedirectURL() in the console.
const GOOGLE_CLIENT_ID_CHROME  = "721197352862-3gqq00qkjt21pds2bbtkp4u7go6qf6cn.apps.googleusercontent.com";
const GOOGLE_CLIENT_ID_FIREFOX = "721197352862-n3uisqfshh7n79g9anudr873pi6pudev.apps.googleusercontent.com";

const GOOGLE_CLIENT_ID = IS_FIREFOX ? GOOGLE_CLIENT_ID_FIREFOX : GOOGLE_CLIENT_ID_CHROME;
const SCOPES = "https://www.googleapis.com/auth/forms.body";
const REDIRECT_URL = browser.identity.getRedirectURL();

async function getTokenChrome(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message || "Auth failed"));
      } else {
        resolve(token);
      }
    });
  });
}

async function getTokenFirefox(interactive) {
  // Return cached token if present
  if (_firefoxToken) return _firefoxToken;
  if (!interactive) throw new Error("Not authenticated");

  const authUrl =
    `https://accounts.google.com/o/oauth2/auth` +
    `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&response_type=token` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URL)}` +
    `&scope=${encodeURIComponent(SCOPES)}`;

  const redirectResult = await browser.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true,
  });

  // Parse the access_token from the redirect URL hash fragment
  const url = new URL(redirectResult);
  const params = new URLSearchParams(url.hash.slice(1)); // remove the '#'
  const token = params.get("access_token");
  if (!token) throw new Error("No access token in redirect response");

  _firefoxToken = token;
  return token;
}

async function getToken(interactive = true) {
  return IS_FIREFOX ? getTokenFirefox(interactive) : getTokenChrome(interactive);
}

// Ensure the extension installs properly
browser.runtime.onInstalled.addListener(() => {
  console.log("Formerly extension installed via cross-browser polyfill.");
});

async function validateToken(token) {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`);
    if (res.ok) {
      return true;
    }
    // Token is invalid/expired
    if (IS_FIREFOX) {
      _firefoxToken = null;
    } else {
      await new Promise(resolve => chrome.identity.removeCachedAuthToken({ token }, resolve));
    }
  } catch (e) {
    console.warn("Token validation failed:", e);
  }
  return false;
}

// Listen for messages from the popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "check_auth") {
    getToken(false)
      .then(async (token) => {
        const isValid = await validateToken(token);
        sendResponse({ authenticated: isValid });
      })
      .catch(() => sendResponse({ authenticated: false }));
    return true;
  }

  if (message.action === "authenticate") {
    getToken(true)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }

  if (message.action === "generate_form") {
    handleGenerateForm(message.prompt)
      .then(result => sendResponse(result))
      .catch(error => {
        console.error("handleGenerateForm threw:", error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Return true to indicate we will send a response asynchronously
  }
});


async function handleGenerateForm(prompt) {
  try {
    // 1. Get OAuth token (should already be cached by the sign-in button)
    console.log("Getting OAuth token...");
    let token = await getToken(false);

    // 1b. Validate token locally before doing anything else
    const isValid = await validateToken(token);
    if (!isValid) {
      throw new Error("Authentication token is invalid or expired. Please sign in again.");
    }

    // 2. Send prompt to backend proxy to get generated JSON
    console.log("Sending prompt to backend proxy...");
    const response = await fetch("https://cnhraouen4vy98avav8nqy8rsm4c.vercel.app/api/generate-form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
    }

    const aiFormData = await response.json();
    console.log("Received form data from backend:", aiFormData);

    // 3. Create a blank Google Form via API
    console.log("Creating blank form...");
    const createRes = await fetch("https://forms.googleapis.com/v1/forms", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        info: { title: aiFormData.title || "Untitled Form" }
      })
    });

    // If the token expired *during* the backend request (rare but possible), handle it
    if (createRes.status === 401) {
       if (IS_FIREFOX) {
          _firefoxToken = null;
       } else {
          await new Promise(resolve => chrome.identity.removeCachedAuthToken({ token }, resolve));
       }
       throw new Error("Session expired during form generation. Please sign in again.");
    }


    if (!createRes.ok) throw new Error(`Forms API create error: ${createRes.status}`);
    const formMetadata = await createRes.json();
    const formId = formMetadata.formId;
    console.log("Created form with ID:", formId);

    // 4. Transform AI JSON into Google Forms batchUpdate requests
    const updates = buildBatchUpdates(aiFormData);
    
    // 5. Apply the updates to populate the form
    if (updates.length > 0) {
      console.log("Applying updates to form...");
      const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ requests: updates })
      });

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        throw new Error(`Forms API update error: ${updateRes.status} - ${errText}`);
      }
    }

    // 6. Open the newly created form in a new tab
    const editUrl = `https://docs.google.com/forms/d/${formId}/edit`;
    await browser.tabs.create({ url: editUrl });

    return { success: true };
  } catch (error) {
    console.error("Error generating form:", error);
    return { success: false, error: error.message };
  }
}

function buildBatchUpdates(aiData) {
  const requests = [];

  // ... (rest of buildBatchUpdates remains the same, included for completeness)
  if (aiData.description) {
    requests.push({
      updateFormInfo: {
        info: { description: aiData.description },
        updateMask: "description"
      }
    });
  }

  if (aiData.questions && aiData.questions.length > 0) {
    aiData.questions.forEach((q, index) => {
      let item = {
        title: q.title
      };

      // Add description if it's a section header
      if (q.description && q.type === "SECTION_HEADER") {
        item.description = q.description;
      }

      if (q.type === "SECTION_HEADER") {
        item.pageBreakItem = {};
      } else {
        item.questionItem = { question: {} };

        if (q.type === "SHORT_ANSWER") {
          item.questionItem.question.textQuestion = {};
        } else if (q.type === "PARAGRAPH") {
          item.questionItem.question.textQuestion = { paragraph: true };
        } else if (q.type === "SCALE") {
          item.questionItem.question.scaleQuestion = {
            low: q.scale?.low ?? 1,
            high: q.scale?.high ?? 5,
            lowLabel: q.scale?.lowLabel || "",
            highLabel: q.scale?.highLabel || ""
          };
        } else if (q.type === "MULTIPLE_CHOICE" || q.type === "CHECKBOXES" || q.type === "DROPDOWN") {
          const choiceQuestion = {
            type: q.type === "MULTIPLE_CHOICE" ? "RADIO" : q.type === "CHECKBOXES" ? "CHECKBOX" : "DROP_DOWN",
            options: (q.options || ["Option 1"]).map(opt => ({ value: opt }))
          };
          item.questionItem.question.choiceQuestion = choiceQuestion;
        } else {
          item.questionItem.question.textQuestion = {};
        }
      }

      requests.push({
        createItem: {
          item: item,
          location: { index: index }
        }
      });
    });
  }

  return requests;
}
