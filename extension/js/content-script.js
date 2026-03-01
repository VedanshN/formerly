console.log("Formerly content script loaded!");

browser.runtime.onMessage.addListener(async (message) => {
  if (message.action === "fill_form") {
    console.log("Received form data to fill:", message.formData);
    try {
      await buildForm(message.formData);
      return { success: true };
    } catch (e) {
      console.error("Error building form:", e);
      return { success: false, error: e.message };
    }
  }
});

async function buildForm(data) {
  console.log("Starting to build form...", data);
  // Wait a moment for UI to be fully ready if it just loaded
  await sleep(1000);

  // 1. Set Title (This tries to find the large form title input)
  // Note: Google Forms has an aria-label="Form title" on the textareas that hold the title
  const titleInputs = document.querySelectorAll('textarea[aria-label="Form title"], input[aria-label="Form title"]');
  if (titleInputs.length > 0 && data.title) {
    // The first one is usually the top-left document title, the second is the actual form title on the canvas
    const actualTitleInput = titleInputs.length > 1 ? titleInputs[1] : titleInputs[0];
    simulateTyping(actualTitleInput, data.title);
  }

  // 2. Set Description
  const descInput = document.querySelector('textarea[aria-label="Form description"]');
  if (descInput && data.description) {
    simulateTyping(descInput, data.description);
  }

  // 3. Questions
  // Google Forms DOM is complex and heavily obfuscated.
  // For this initial version, we will attempt to add new question blocks
  // and type in the Titles.
  
  if (data.questions && data.questions.length > 0) {
     for (let i = 0; i < data.questions.length; i++) {
        const questionData = data.questions[i];
        
        // Find "Add question" button (the tiny Plus icon on the right side menu)
        const addBtn = document.querySelector('[data-tooltip="Add question"], [aria-label="Add question"]');
        
        if (addBtn) {
           addBtn.click();
           await sleep(800); // Wait for the new question block to render
           
           // After clicking add, the new question title input is usually focused.
           const activeElement = document.activeElement;
           if (activeElement && activeElement.tagName === 'TEXTAREA') {
              simulateTyping(activeElement, questionData.title);
           }
           
           // NOTE: Changing question types (e.g. from Short Answer to Multiple Choice) 
           // and injecting the choices involves complex dropdown interactions in Google Forms.
           // This will require deeper DOM inspection locally to implement fully.
           console.log("Added question:", questionData.title);
        }
     }
  }
  
  console.log("Form building cycle complete!");
  alert("Formerly finished running! Check the console for the raw JSON data generated.");
}

function simulateTyping(element, text) {
  element.focus();
  element.value = text;
  
  // React/Angular often require these events to register the change
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
  element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.blur();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
