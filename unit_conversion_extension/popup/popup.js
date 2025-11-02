// Popup functionality

document.addEventListener('DOMContentLoaded', async () => {
  const enableToggle = document.getElementById('enableToggle');
  const statusText = document.getElementById('statusText');
  const rescanBtn = document.getElementById('rescanBtn');
  const settingsBtn = document.getElementById('settingsBtn');

  // Load current preferences
  const preferences = await StorageManager.getPreferences();
  enableToggle.checked = preferences.enabled;
  updateStatusText(preferences.enabled);

  // Toggle conversion on/off
  enableToggle.addEventListener('change', async () => {
    const enabled = enableToggle.checked;

    await StorageManager.setPreference('enabled', enabled);
    updateStatusText(enabled);

    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggle',
          enabled: enabled
        });
      }
    });
  });

  // Rescan page button
  rescanBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'rescan'
        }, (response) => {
          if (response && response.success) {
            // Visual feedback
            rescanBtn.textContent = 'Rescanned!';
            setTimeout(() => {
              rescanBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.65 2.35C12.2 0.9 10.21 0 8 0C3.58 0 0.01 3.58 0.01 8C0.01 12.42 3.58 16 8 16C11.73 16 14.84 13.45 15.73 10H13.65C12.83 12.33 10.61 14 8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C9.66 2 11.14 2.69 12.22 3.78L9 7H16V0L13.65 2.35Z" fill="currentColor"/>
                </svg>
                Rescan Page
              `;
            }, 1500);
          }
        });
      }
    });
  });

  // Open settings page
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  function updateStatusText(enabled) {
    statusText.textContent = enabled ? 'Enabled' : 'Disabled';
  }
});
