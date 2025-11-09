// Handle settings toggle
document.addEventListener('DOMContentLoaded', function() {
  const toggles = document.querySelectorAll('input[type="checkbox"]');
  
  toggles.forEach(toggle => {
    // Load saved state
    const key = toggle.parentElement.previousElementSibling.textContent;
    chrome.storage.sync.get([key], (result) => {
      toggle.checked = result[key] !== false;
    });
    
    // Save state when toggled
    toggle.addEventListener('change', function() {
      const key = this.parentElement.previousElementSibling.textContent;
      chrome.storage.sync.set({ [key]: this.checked });
    });
  });
});