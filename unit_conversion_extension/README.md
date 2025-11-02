# Automatic Unit Converter - Browser Extension

Automatically converts units on webpages between imperial and metric systems, making an engineer's life easier!

## Features

### Automatic Detection & Conversion
- **Inline Text Conversion**: Detects and converts measurements in regular text
- **Smart Table Handling**: Intelligently parses table headers to understand units and converts cell values accordingly
- **Bidirectional**: Convert Imperial → Metric or Metric → Imperial (or both!)

### Supported Units

**Length:**
- Imperial: inches (in, "), feet (ft, '), yards (yd), miles (mi)
- Metric: millimeters (mm), centimeters (cm), meters (m), kilometers (km)

**Weight:**
- Imperial: pounds (lbs), ounces (oz)
- Metric: grams (g), kilograms (kg)

### Advanced Table Support
The extension can handle complex tables where units are only specified in the header row:

```
| Diameter (inches) | Length (mm) | Weight (lbs) |
|-------------------|-------------|--------------|
| 0.5               | 25.4        | 1.2          |
| 1.0               | 50.8        | 2.5          |
```

The extension automatically:
- Detects units from column headers
- Maps each column to its unit
- Converts values based on the column's unit
- Handles colspan and complex table structures

### Customizable Settings

**Conversion Preferences:**
- Choose conversion direction (Imperial → Metric, Metric → Imperial, or both)
- Set preferred metric length unit (mm, cm, or m)
- Configure decimal precision (0-6 places)

**Display Options:**
- **Inline**: Shows both original and converted values (e.g., "5 inches [127mm]")
- **Replace**: Replaces original with converted value (hover to see original)
- **Tooltip**: Shows conversion on hover

**Additional Options:**
- Enable/disable table conversion
- Toggle visual highlighting of converted values
- Quick enable/disable from popup

## Installation

### From Source (Development)

1. Clone or download this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `unit_conversion_extension` folder
6. The extension should now appear in your browser!

### Usage

1. Click the extension icon to toggle conversion on/off
2. Visit any webpage with measurements
3. The extension will automatically detect and convert units
4. Click the settings gear icon to customize preferences

## Project Structure

```
unit_conversion_extension/
├── manifest.json           # Extension configuration
├── content/
│   ├── content.js         # Main content script (webpage scanning)
│   └── content.css        # Styling for converted units
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Popup styling
│   └── popup.js           # Popup functionality
├── options/
│   ├── options.html       # Settings page UI
│   ├── options.css        # Settings page styling
│   └── options.js         # Settings page functionality
├── utils/
│   ├── unitDetector.js    # Unit detection patterns
│   ├── converter.js       # Conversion logic
│   ├── storage.js         # Preferences storage
│   └── tableParser.js     # Table parsing logic
└── icons/
    ├── icon16.png         # Extension icons
    ├── icon48.png
    └── icon128.png
```

## How It Works

1. **Page Load**: When a page loads, the content script is injected
2. **Scanning**: The script scans for:
   - Tables with unit headers
   - Inline text with measurement patterns
3. **Detection**: Regex patterns identify measurements and their units
4. **Conversion**: Values are converted based on user preferences
5. **Display**: Conversions are displayed according to selected mode
6. **Dynamic Content**: MutationObserver watches for new content

## Development

### Key Modules

- **unitDetector.js**: Comprehensive regex patterns for detecting units in text and headers
- **converter.js**: Conversion formulas with engineering precision
- **tableParser.js**: Intelligent table parsing that handles headers, colspan, and complex structures
- **content.js**: Main orchestrator that ties everything together

### Testing

Open `test.html` in your browser with the extension enabled to see various conversion scenarios.

## Browser Compatibility

- Chrome/Chromium (Manifest V3)
- Microsoft Edge
- Brave
- Other Chromium-based browsers

## Future Enhancements

- [ ] Temperature conversion (°F ↔ °C)
- [ ] Pressure units (PSI, bar, Pa)
- [ ] Torque units (ft-lbs, Nm)
- [ ] Area and volume units
- [ ] Custom unit definitions
- [ ] Whitelist/blacklist specific websites
- [ ] Keyboard shortcuts

## Version

1.0.0 - Initial Release

---

Made for engineers, by engineers! 🔧📐
