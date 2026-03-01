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

    const formData = await response.json();
    console.log("Received form data from backend:", formData);

    // Send the data to the content script in the active tab
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      throw new Error("No active tab found");
    }

    // Optional: Only send if it's a Google Forms tab
    if (!tabs[0].url.includes("docs.google.com/forms")) {
      throw new Error("You must be on a Google Forms page (forms.new) to use this.");
    }

    // Ping the content script
    try {
      await browser.tabs.sendMessage(tabs[0].id, {
        action: "fill_form",
        formData: formData
      });
    } catch (e) {
        throw new Error("Could not reach content script. Try refreshing the Google Forms page.");
    }

    return { success: true };
  } catch (error) {
    console.error("Error generating form:", error);
    return { success: false, error: error.message };
  }
}
