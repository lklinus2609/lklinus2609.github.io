// Unit detection patterns and utilities

const UnitDetector = {
  // Comprehensive unit patterns
  patterns: {
    // Metric length units (check these FIRST - more specific patterns before generic ones)
    kilometers: {
      regex: /(\d+(?:\.\d+)?)\s*(?:kilometers?|kilometres?|km\.?)\b/gi,
      unit: 'kilometers',
      type: 'length',
      priority: 1
    },
    millimeters: {
      regex: /(\d+(?:\.\d+)?)\s*(?:millimeters?|millimetres?|mm\.?)\b/gi,
      unit: 'millimeters',
      type: 'length',
      priority: 1
    },
    centimeters: {
      regex: /(\d+(?:\.\d+)?)\s*(?:centimeters?|centimetres?|cm\.?)\b/gi,
      unit: 'centimeters',
      type: 'length',
      priority: 1
    },
    meters: {
      regex: /(\d+(?:\.\d+)?)\s*(?:meters?|metres?|m\.?)\b/gi,
      unit: 'meters',
      type: 'length',
      priority: 2
    },

    // Imperial length units
    inches: {
      regex: /(\d+(?:[\s-]+\d+\s*[\/⁄]\s*\d+|[\s-]+[⅛¼⅜½⅝¾⅞⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅐]|\.\d+|\s*[\/⁄]\s*\d+|[⅛¼⅜½⅝¾⅞⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅐])?)\s*(?:inches?|in\.?|")/gi,
      unit: 'inches',
      type: 'length',
      priority: 1
    },
    feet: {
      regex: /(\d+(?:[\s-]+\d+\s*[\/⁄]\s*\d+|[\s-]+[⅛¼⅜½⅝¾⅞⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅐]|\.\d+|\s*[\/⁄]\s*\d+|[⅛¼⅜½⅝¾⅞⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅐])?)\s*(?:feet|foot|ft\.?|')/gi,
      unit: 'feet',
      type: 'length',
      priority: 1
    },
    yards: {
      regex: /(\d+(?:\.\d+)?)\s*(?:yards?|yds?\.?)\b/gi,
      unit: 'yards',
      type: 'length',
      priority: 1
    },
    miles: {
      regex: /(\d+(?:\.\d+)?)\s*(?:miles?|mi\.?)\b/gi,
      unit: 'miles',
      type: 'length',
      priority: 1
    },

    // Metric weight units (specific before generic)
    kilograms: {
      regex: /(\d+(?:\.\d+)?)\s*(?:kilograms?|kgs?\.?)\b/gi,
      unit: 'kilograms',
      type: 'weight',
      priority: 1
    },
    grams: {
      regex: /(\d+(?:\.\d+)?)\s*(?:grams?)\b/gi,
      unit: 'grams',
      type: 'weight',
      priority: 2
    },

    // Imperial weight units
    pounds: {
      regex: /(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?\.?)\b/gi,
      unit: 'pounds',
      type: 'weight',
      priority: 1
    },
    ounces: {
      regex: /(\d+(?:\.\d+)?)\s*(?:ounces?|oz\.?)\b/gi,
      unit: 'ounces',
      type: 'weight',
      priority: 1
    }
  },

  // Extract unit from column header text
  extractUnitFromHeader(headerText) {
    if (!headerText) return null;

    const text = headerText.toLowerCase().trim();

    // Common header patterns: "Length (inches)", "Width [mm]", "Height - cm", "Diameter, in"
    const headerPatterns = [
      /\(([^)]+)\)/,  // (inches)
      /\[([^\]]+)\]/,  // [mm]
      /-\s*([a-z"'.]+)$/,  // - inches
      /,\s*([a-z"'.]+)$/   // , mm
    ];

    for (const pattern of headerPatterns) {
      const match = text.match(pattern);
      if (match) {
        const unitStr = match[1].trim();
        return this.normalizeUnit(unitStr);
      }
    }

    // Check if the entire header is just a unit
    const normalizedUnit = this.normalizeUnit(text);
    if (normalizedUnit) return normalizedUnit;

    return null;
  },

  // Normalize various unit representations to standard form
  normalizeUnit(unitStr) {
    const normalized = unitStr.toLowerCase().trim();

    const unitMap = {
      // Inches
      'in': 'inches',
      'in.': 'inches',
      '"': 'inches',
      'inch': 'inches',
      'inches': 'inches',

      // Feet
      'ft': 'feet',
      'ft.': 'feet',
      "'": 'feet',
      'foot': 'feet',
      'feet': 'feet',

      // Yards
      'yd': 'yards',
      'yd.': 'yards',
      'yds': 'yards',
      'yard': 'yards',
      'yards': 'yards',

      // Miles
      'mi': 'miles',
      'mi.': 'miles',
      'mile': 'miles',
      'miles': 'miles',

      // Millimeters
      'mm': 'millimeters',
      'mm.': 'millimeters',
      'millimeter': 'millimeters',
      'millimeters': 'millimeters',
      'millimetre': 'millimeters',
      'millimetres': 'millimeters',

      // Centimeters
      'cm': 'centimeters',
      'cm.': 'centimeters',
      'centimeter': 'centimeters',
      'centimeters': 'centimeters',
      'centimetre': 'centimeters',
      'centimetres': 'centimeters',

      // Meters
      'm': 'meters',
      'm.': 'meters',
      'meter': 'meters',
      'meters': 'meters',
      'metre': 'meters',
      'metres': 'meters',

      // Kilometers
      'km': 'kilometers',
      'km.': 'kilometers',
      'kilometer': 'kilometers',
      'kilometers': 'kilometers',
      'kilometre': 'kilometers',
      'kilometres': 'kilometers',

      // Pounds
      'lb': 'pounds',
      'lb.': 'pounds',
      'lbs': 'pounds',
      'lbs.': 'pounds',
      'pound': 'pounds',
      'pounds': 'pounds',

      // Ounces
      'oz': 'ounces',
      'oz.': 'ounces',
      'ounce': 'ounces',
      'ounces': 'ounces',

      // Grams
      'g': 'grams',
      'g.': 'grams',
      'gram': 'grams',
      'grams': 'grams',

      // Kilograms
      'kg': 'kilograms',
      'kg.': 'kilograms',
      'kgs': 'kilograms',
      'kilogram': 'kilograms',
      'kilograms': 'kilograms'
    };

    return unitMap[normalized] || null;
  },

  // Parse fractional measurements (e.g., "3/4", "1 1/2", "1-1/8")
  parseFraction(fractionStr) {
    fractionStr = fractionStr.trim();

    // Handle Unicode vulgar fractions (⅛, ¼, ½, ¾, ⅜, ⅝, ⅞, etc.)
    const vulgarFractions = {
      '⅛': 1/8, '¼': 1/4, '⅜': 3/8, '½': 1/2, '⅝': 5/8, '¾': 3/4, '⅞': 7/8,
      '⅑': 1/9, '⅒': 1/10, '⅓': 1/3, '⅔': 2/3, '⅕': 1/5, '⅖': 2/5, '⅗': 3/5, '⅘': 4/5, '⅙': 1/6, '⅚': 5/6, '⅐': 1/7
    };

    // Check for whole number + vulgar fraction (e.g., "1 ⅛")
    const vulgarMixedMatch = fractionStr.match(/^(\d+)\s+([⅛¼⅜½⅝¾⅞⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅐])$/);
    if (vulgarMixedMatch) {
      const whole = parseFloat(vulgarMixedMatch[1]);
      const fraction = vulgarFractions[vulgarMixedMatch[2]];
      return whole + fraction;
    }

    // Check for just vulgar fraction (e.g., "⅛")
    if (vulgarFractions[fractionStr]) {
      return vulgarFractions[fractionStr];
    }

    // Handle mixed numbers with space or hyphen (e.g., "1 1/2" or "1-1/2")
    // Support both regular slash / and Unicode fraction slash ⁄
    const mixedMatch = fractionStr.match(/^(\d+)[\s-]+(\d+)\s*[\/⁄]\s*(\d+)$/);
    if (mixedMatch) {
      const whole = parseFloat(mixedMatch[1]);
      const numerator = parseFloat(mixedMatch[2]);
      const denominator = parseFloat(mixedMatch[3]);
      return whole + (numerator / denominator);
    }

    // Handle simple fractions (e.g., "3/4" or "3⁄4")
    const fractionMatch = fractionStr.match(/^(\d+)\s*[\/⁄]\s*(\d+)$/);
    if (fractionMatch) {
      const numerator = parseFloat(fractionMatch[1]);
      const denominator = parseFloat(fractionMatch[2]);
      return numerator / denominator;
    }

    // Handle decimals
    return parseFloat(fractionStr);
  },

  // Detect all units in a text string
  detectUnits(text) {
    const detections = [];

    for (const [name, config] of Object.entries(this.patterns)) {
      const regex = new RegExp(config.regex.source, config.regex.flags);
      let match;

      while ((match = regex.exec(text)) !== null) {
        const value = this.parseFraction(match[1]);

        detections.push({
          fullMatch: match[0],
          value: value,
          unit: config.unit,
          type: config.type,
          start: match.index,
          end: match.index + match[0].length,
          priority: config.priority || 1
        });
      }
    }

    // Sort by position in text
    detections.sort((a, b) => a.start - b.start);

    // Remove overlapping detections (prefer longer matches and higher priority)
    const filtered = [];
    for (let i = 0; i < detections.length; i++) {
      const current = detections[i];
      let isOverlapped = false;

      // Check if this detection overlaps with any already-added detection
      for (const added of filtered) {
        const overlaps = !(current.end <= added.start || current.start >= added.end);

        if (overlaps) {
          // Keep the longer match, or if same length, keep higher priority
          const currentLength = current.end - current.start;
          const addedLength = added.end - added.start;

          if (currentLength > addedLength) {
            // Remove the shorter one and add current
            const index = filtered.indexOf(added);
            filtered.splice(index, 1);
            break;
          } else if (currentLength === addedLength && current.priority < added.priority) {
            // Same length but current has higher priority (lower number = higher priority)
            const index = filtered.indexOf(added);
            filtered.splice(index, 1);
            break;
          } else {
            // Keep the existing one, skip current
            isOverlapped = true;
            break;
          }
        }
      }

      if (!isOverlapped) {
        filtered.push(current);
      }
    }

    // Sort again by position
    filtered.sort((a, b) => a.start - b.start);

    return filtered;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnitDetector;
}
