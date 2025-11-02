// Options page functionality

document.addEventListener('DOMContentLoaded', async () => {
  // Get all form elements
  const conversionDirectionSelect = document.getElementById('conversionDirection');
  const preferredMetricLengthSelect = document.getElementById('preferredMetricLength');
  const precisionInput = document.getElementById('precision');
  const displayModeSelect = document.getElementById('displayMode');
  const convertTablesCheckbox = document.getElementById('convertTables');
  const convertInlineTextCheckbox = document.getElementById('convertInlineText');
  const highlightConversionsCheckbox = document.getElementById('highlightConversions');
  const enabledCheckbox = document.getElementById('enabled');
  const resetBtn = document.getElementById('resetBtn');
  const saveMessage = document.getElementById('saveMessage');

  // Load current preferences
  await loadPreferences();

  // Reset button click handler
  resetBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      await StorageManager.resetPreferences();
      await loadPreferences();
      showSaveMessage();
    }
  });

  // Auto-save on change for better UX
  const autoSaveElements = [
    conversionDirectionSelect,
    preferredMetricLengthSelect,
    precisionInput,
    displayModeSelect,
    convertTablesCheckbox,
    convertInlineTextCheckbox,
    highlightConversionsCheckbox,
    enabledCheckbox
  ];

  autoSaveElements.forEach(element => {
    element.addEventListener('change', async () => {
      await savePreferences();
      showSaveMessage();
    });
  });

  async function loadPreferences() {
    const preferences = await StorageManager.getPreferences();

    conversionDirectionSelect.value = preferences.conversionDirection;
    preferredMetricLengthSelect.value = preferences.preferredMetricLength;
    precisionInput.value = preferences.precision;
    displayModeSelect.value = preferences.displayMode;
    convertTablesCheckbox.checked = preferences.convertTables;
    convertInlineTextCheckbox.checked = preferences.convertInlineText;
    highlightConversionsCheckbox.checked = preferences.highlightConversions;
    enabledCheckbox.checked = preferences.enabled;
  }

  async function savePreferences() {
    const preferences = {
      conversionDirection: conversionDirectionSelect.value,
      preferredMetricLength: preferredMetricLengthSelect.value,
      precision: parseInt(precisionInput.value),
      displayMode: displayModeSelect.value,
      convertTables: convertTablesCheckbox.checked,
      convertInlineText: convertInlineTextCheckbox.checked,
      highlightConversions: highlightConversionsCheckbox.checked,
      enabled: enabledCheckbox.checked
    };

    await StorageManager.savePreferences(preferences);
  }

  function showSaveMessage() {
    saveMessage.classList.remove('hidden');
    setTimeout(() => {
      saveMessage.classList.add('hidden');
    }, 2000);
  }
});
