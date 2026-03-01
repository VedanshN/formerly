// At the top of background.js
try {
  importScripts("js/browser-polyfill.js");
} catch (e) {
  console.error("Polyfill import failed", e);
}

// Ensure the extension installs properly
browser.runtime.onInstalled.addListener(() => {
  console.log("Formerly extension installed via cross-browser polyfill.");
});

// Listen for messages from the popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "check_auth") {
    // Check if we already have a cached token without triggering a popup
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      sendResponse({ authenticated: !!token });
    });
    return true;
  }

  if (message.action === "authenticate") {
    // Explicitly request auth with an interactive popup if necessary
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        sendResponse({ success: false, error: chrome.runtime.lastError?.message || "Authentication failed" });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
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
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (chrome.runtime.lastError || !token) {
          reject(new Error(chrome.runtime.lastError?.message || "Not authenticated. Please sign in first."));
        } else {
          resolve(token);
        }
      });
    });

    // 2. Send prompt to backend proxy to get generated JSON
    console.log("Sending prompt to backend proxy...");
    const response = await fetch("http://localhost:3000/api/generate-form", {
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
      const item = {
        title: q.title,
        questionItem: {
          question: {}
        }
      };

      if (q.type === "SHORT_ANSWER") {
        item.questionItem.question.textQuestion = {};
      } else if (q.type === "PARAGRAPH") {
        item.questionItem.question.textQuestion = { paragraph: true };
      } else if (q.type === "MULTIPLE_CHOICE" || q.type === "CHECKBOXES" || q.type === "DROPDOWN") {
        const choiceQuestion = {
          type: q.type === "MULTIPLE_CHOICE" ? "RADIO" : q.type === "CHECKBOXES" ? "CHECKBOX" : "DROP_DOWN",
          options: (q.options || ["Option 1"]).map(opt => ({ value: opt }))
        };
        item.questionItem.question.choiceQuestion = choiceQuestion;
      } else {
        item.questionItem.question.textQuestion = {};
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
