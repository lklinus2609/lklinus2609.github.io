// Unit conversion logic with engineering precision

const UnitConverter = {
  // Conversion factors
  conversions: {
    // Length conversions to mm (base unit for metric)
    inches: {
      toMM: (val) => val * 25.4,
      toCM: (val) => val * 2.54,
      toM: (val) => val * 0.0254
    },
    feet: {
      toMM: (val) => val * 304.8,
      toCM: (val) => val * 30.48,
      toM: (val) => val * 0.3048
    },
    yards: {
      toMM: (val) => val * 914.4,
      toCM: (val) => val * 91.44,
      toM: (val) => val * 0.9144
    },
    miles: {
      toMM: (val) => val * 1609344,
      toCM: (val) => val * 160934.4,
      toM: (val) => val * 1609.344,
      toKM: (val) => val * 1.609344
    },

    // Metric to imperial
    millimeters: {
      toInches: (val) => val / 25.4,
      toFeet: (val) => val / 304.8
    },
    centimeters: {
      toInches: (val) => val / 2.54,
      toFeet: (val) => val / 30.48
    },
    meters: {
      toInches: (val) => val / 0.0254,
      toFeet: (val) => val / 0.3048,
      toYards: (val) => val / 0.9144
    },
    kilometers: {
      toMiles: (val) => val / 1.609344,
      toFeet: (val) => val / 0.0003048
    },

    // Weight conversions
    pounds: {
      toKG: (val) => val * 0.453592,
      toG: (val) => val * 453.592
    },
    ounces: {
      toG: (val) => val * 28.3495,
      toKG: (val) => val * 0.0283495
    },
    kilograms: {
      toLBS: (val) => val / 0.453592
    },
    grams: {
      toLBS: (val) => val / 453.592,
      toOZ: (val) => val / 28.3495
    }
  },

  // Convert a value from one unit to another based on user preferences
  convert(value, fromUnit, preferences) {
    if (!value || !fromUnit) return null;

    const conversionMap = this.conversions[fromUnit];
    if (!conversionMap) return null;

    // Determine target unit based on source unit and preferences
    const result = {
      originalValue: value,
      originalUnit: fromUnit,
      conversions: []
    };

    // Imperial to Metric conversions
    if (['inches', 'feet', 'yards', 'miles'].includes(fromUnit)) {
      if (fromUnit === 'miles') {
        // For miles, prefer kilometers
        result.conversions.push({
          value: this.round(conversionMap.toKM(value), preferences.precision),
          unit: 'kilometers',
          display: 'km'
        });
      } else if (fromUnit === 'feet' || fromUnit === 'yards') {
        // For feet/yards, prefer meters unless user prefers cm/mm
        if (preferences.preferredMetricLength === 'millimeters') {
          result.conversions.push({
            value: this.round(conversionMap.toMM(value), preferences.precision),
            unit: 'millimeters',
            display: 'mm'
          });
        } else if (preferences.preferredMetricLength === 'centimeters') {
          result.conversions.push({
            value: this.round(conversionMap.toCM(value), preferences.precision),
            unit: 'centimeters',
            display: 'cm'
          });
        } else {
          result.conversions.push({
            value: this.round(conversionMap.toM(value), preferences.precision),
            unit: 'meters',
            display: 'm'
          });
        }
      } else {
        // For inches, use preferred metric length unit
        if (preferences.preferredMetricLength === 'millimeters') {
          result.conversions.push({
            value: this.round(conversionMap.toMM(value), preferences.precision),
            unit: 'millimeters',
            display: 'mm'
          });
        } else if (preferences.preferredMetricLength === 'centimeters') {
          result.conversions.push({
            value: this.round(conversionMap.toCM(value), preferences.precision),
            unit: 'centimeters',
            display: 'cm'
          });
        } else {
          result.conversions.push({
            value: this.round(conversionMap.toM(value), preferences.precision),
            unit: 'meters',
            display: 'm'
          });
        }
      }
    }

    // Metric to Imperial conversions
    if (['millimeters', 'centimeters', 'meters', 'kilometers'].includes(fromUnit)) {
      if (fromUnit === 'kilometers') {
        result.conversions.push({
          value: this.round(conversionMap.toMiles(value), preferences.precision),
          unit: 'miles',
          display: 'miles'
        });
      } else {
        // For mm/cm/m, convert to inches by default
        result.conversions.push({
          value: this.round(conversionMap.toInches(value), preferences.precision),
          unit: 'inches',
          display: 'in'
        });

        // Also add feet if the value is large enough
        if (value > 300 && fromUnit === 'millimeters') { // > ~1 foot
          result.conversions.push({
            value: this.round(conversionMap.toFeet(value), preferences.precision),
            unit: 'feet',
            display: 'ft'
          });
        }
      }
    }

    // Weight conversions
    if (['pounds', 'ounces'].includes(fromUnit)) {
      if (fromUnit === 'pounds') {
        result.conversions.push({
          value: this.round(conversionMap.toKG(value), preferences.precision),
          unit: 'kilograms',
          display: 'kg'
        });
      } else {
        result.conversions.push({
          value: this.round(conversionMap.toG(value), preferences.precision),
          unit: 'grams',
          display: 'g'
        });
      }
    }

    if (['kilograms', 'grams'].includes(fromUnit)) {
      if (fromUnit === 'kilograms') {
        result.conversions.push({
          value: this.round(conversionMap.toLBS(value), preferences.precision),
          unit: 'pounds',
          display: 'lbs'
        });
      } else {
        result.conversions.push({
          value: this.round(conversionMap.toOZ(value), preferences.precision),
          unit: 'ounces',
          display: 'oz'
        });
      }
    }

    return result;
  },

  // Round to specified precision
  round(value, precision = 2) {
    const multiplier = Math.pow(10, precision);
    return Math.round(value * multiplier) / multiplier;
  },

  // Format conversion for display
  formatConversion(conversion, displayMode = 'inline') {
    if (!conversion || !conversion.conversions || conversion.conversions.length === 0) {
      return null;
    }

    const primary = conversion.conversions[0];

    switch (displayMode) {
      case 'inline':
        // "5 inches [127mm]"
        return `[${primary.value}${primary.display}]`;

      case 'replace':
        // "127mm (was 5 inches)"
        return `${primary.value}${primary.display}`;

      case 'tooltip':
        // Just the conversion value for tooltip
        return `${primary.value}${primary.display}`;

      default:
        return `[${primary.value}${primary.display}]`;
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnitConverter;
}
