// Storage utilities for user preferences

const StorageManager = {
  // Default preferences
  defaultPreferences: {
    enabled: true,
    preferredMetricLength: 'millimeters', // millimeters, centimeters, or meters
    precision: 2, // decimal places
    displayMode: 'inline', // inline, replace, or tooltip
    conversionDirection: 'both', // imperial-to-metric, metric-to-imperial, or both
    convertTables: true, // Enable table conversion
    convertInlineText: true, // Enable inline text conversion
    highlightConversions: false // Highlight converted values
  },

  // Get user preferences from storage
  async getPreferences() {
    return new Promise((resolve) => {
      chrome.storage.sync.get('preferences', (result) => {
        const preferences = result.preferences || this.defaultPreferences;
        // Merge with defaults to ensure all keys exist
        resolve({ ...this.defaultPreferences, ...preferences });
      });
    });
  },

  // Save user preferences to storage
  async savePreferences(preferences) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ preferences }, () => {
        resolve(true);
      });
    });
  },

  // Reset to default preferences
  async resetPreferences() {
    return this.savePreferences(this.defaultPreferences);
  },

  // Get specific preference value
  async getPreference(key) {
    const preferences = await this.getPreferences();
    return preferences[key];
  },

  // Set specific preference value
  async setPreference(key, value) {
    const preferences = await this.getPreferences();
    preferences[key] = value;
    return this.savePreferences(preferences);
  },

  // Listen for preference changes
  onPreferencesChanged(callback) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.preferences) {
        callback(changes.preferences.newValue);
      }
    });
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
