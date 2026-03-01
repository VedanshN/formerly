document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generateBtn");
  const promptInput = document.getElementById("prompt");
  const statusDiv = document.getElementById("status");

  generateBtn.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    generateBtn.disabled = true;
    statusDiv.textContent = "Asking AI for form structure...";
    statusDiv.style.color = "#555";

    try {
      // Send message to background script
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
});
