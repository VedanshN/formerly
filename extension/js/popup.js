document.addEventListener("DOMContentLoaded", async () => {
  const signinSection = document.getElementById("signin-section");
  const appSection = document.getElementById("app-section");
  const signinBtn = document.getElementById("signinBtn");
  const generateBtn = document.getElementById("generateBtn");
  const promptInput = document.getElementById("prompt");
  const statusDiv = document.getElementById("status");

  // Check auth status on load without triggering interactive prompt
  try {
    const response = await browser.runtime.sendMessage({ action: "check_auth" });
    if (response.authenticated) {
      showApp();
    } else {
      showSignIn();
    }
  } catch (err) {
    console.error("Auth check failed", err);
    showSignIn();
  }

  // Handle explicit sign in
  signinBtn.addEventListener("click", async () => {
    signinBtn.disabled = true;
    signinBtn.textContent = "Authenticating...";
    statusDiv.textContent = "";

    try {
      const response = await browser.runtime.sendMessage({ action: "authenticate" });
      if (response.success) {
        showApp();
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      statusDiv.textContent = "Auth failed: " + err.message;
      statusDiv.style.color = "red";
      signinBtn.disabled = false;
      signinBtn.textContent = "Sign In / Authorize";
    }
  });

  // Handle form generation
  generateBtn.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    generateBtn.disabled = true;
    statusDiv.textContent = "Asking AI for form structure...";
    statusDiv.style.color = "#555";

    try {
      const response = await browser.runtime.sendMessage({
        action: "generate_form",
        prompt: prompt
      });

      if (response && response.success) {
        statusDiv.textContent = "Success! Form generated.";
        statusDiv.style.color = "green";
      } else {
        statusDiv.textContent = "Error: " + (response ? response.error : "Unknown error");
        statusDiv.style.color = "red";
      }
    } catch (error) {
      console.error(error);
      statusDiv.textContent = "Error communicating with extension.";
      statusDiv.style.color = "red";
    } finally {
      generateBtn.disabled = false;
    }
  });

  function showApp() {
    signinSection.style.display = "none";
    appSection.style.display = "block";
    statusDiv.textContent = "";
  }

  function showSignIn() {
    signinSection.style.display = "block";
    appSection.style.display = "none";
  }
});
