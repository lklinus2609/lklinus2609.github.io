// Table parsing utilities for extracting units from headers

const TableParser = {
  // Parse a table and extract column-to-unit mappings
  parseTable(tableElement) {
    const columnUnits = new Map();

    // Find header rows
    const headerRows = this.findHeaderRows(tableElement);

    if (headerRows.length === 0) {
      return columnUnits;
    }

    // Parse headers to extract units
    headerRows.forEach(headerRow => {
      const headers = headerRow.querySelectorAll('th, td');

      headers.forEach((header, colIndex) => {
        // Handle colspan
        const colspan = parseInt(header.getAttribute('colspan')) || 1;
        const headerText = header.textContent;

        // Extract unit from header text
        const unit = UnitDetector.extractUnitFromHeader(headerText);

        if (unit) {
          // Map this unit to all columns covered by colspan
          for (let i = 0; i < colspan; i++) {
            const actualColIndex = this.getActualColumnIndex(header);
            if (actualColIndex !== null) {
              columnUnits.set(actualColIndex + i, unit);
            }
          }
        }
      });
    });

    return columnUnits;
  },

  // Find all header rows in a table (could be in thead or first rows of tbody)
  findHeaderRows(tableElement) {
    const headerRows = [];

    // Check for thead
    const thead = tableElement.querySelector('thead');
    if (thead) {
      const rows = thead.querySelectorAll('tr');
      headerRows.push(...rows);
    } else {
      // If no thead, check first few rows of table/tbody for th elements
      const tbody = tableElement.querySelector('tbody') || tableElement;
      const rows = tbody.querySelectorAll('tr');

      // Check first 3 rows max
      for (let i = 0; i < Math.min(3, rows.length); i++) {
        const row = rows[i];
        const hasHeaders = row.querySelector('th');

        if (hasHeaders) {
          headerRows.push(row);
        } else if (i === 0) {
          // Sometimes first row is headers even without th tags
          headerRows.push(row);
        } else {
          // Stop looking after first non-header row
          break;
        }
      }
    }

    return headerRows;
  },

  // Get the actual column index accounting for previous rowspan/colspan
  getActualColumnIndex(cell) {
    const row = cell.parentElement;
    if (!row) return null;

    let columnIndex = 0;
    const cells = Array.from(row.children);

    for (let i = 0; i < cells.length; i++) {
      if (cells[i] === cell) {
        return columnIndex;
      }

      const colspan = parseInt(cells[i].getAttribute('colspan')) || 1;
      columnIndex += colspan;
    }

    return null;
  },

  // Get all data rows (excluding headers)
  getDataRows(tableElement) {
    const allRows = [];
    const headerRows = this.findHeaderRows(tableElement);
    const headerRowSet = new Set(headerRows);

    // Get tbody or use table directly
    const tbody = tableElement.querySelector('tbody') || tableElement;
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
      // Skip if this is a header row
      if (!headerRowSet.has(row)) {
        // Skip rows that are entirely th elements
        const ths = row.querySelectorAll('th');
        const tds = row.querySelectorAll('td');

        if (tds.length > 0) {
          allRows.push(row);
        }
      }
    });

    return allRows;
  },

  // Get cell at specific column index
  getCellAtColumn(row, columnIndex) {
    let currentIndex = 0;
    const cells = row.querySelectorAll('td, th');

    for (const cell of cells) {
      const colspan = parseInt(cell.getAttribute('colspan')) || 1;

      if (currentIndex <= columnIndex && columnIndex < currentIndex + colspan) {
        return cell;
      }

      currentIndex += colspan;
    }

    return null;
  },

  // Check if a cell contains a numeric value
  isNumericCell(cell) {
    const text = cell.textContent.trim();

    // Check if it's a number (possibly with commas, decimals, or fractions)
    const numericPattern = /^-?\d+([,.]?\d+)*(\s*\/\s*\d+)?$/;
    return numericPattern.test(text);
  },

  // Extract numeric value from cell
  extractNumericValue(cell) {
    const text = cell.textContent.trim();

    // Remove commas
    const cleaned = text.replace(/,/g, '');

    // Handle fractions
    if (cleaned.includes('/')) {
      return UnitDetector.parseFraction(cleaned);
    }

    return parseFloat(cleaned);
  },

  // Process entire table with conversions
  processTable(tableElement, preferences) {
    const columnUnits = this.parseTable(tableElement);
    const dataRows = this.getDataRows(tableElement);
    const conversions = [];

    // Process each data row
    dataRows.forEach(row => {
      columnUnits.forEach((unit, colIndex) => {
        const cell = this.getCellAtColumn(row, colIndex);

        if (cell && this.isNumericCell(cell)) {
          const value = this.extractNumericValue(cell);

          if (!isNaN(value)) {
            const conversion = UnitConverter.convert(value, unit, preferences);

            if (conversion && conversion.conversions.length > 0) {
              conversions.push({
                cell: cell,
                conversion: conversion
              });
            }
          }
        }
      });
    });

    return conversions;
  },

  // Check if element is inside a table
  isInsideTable(element) {
    let current = element;
    while (current && current !== document.body) {
      if (current.tagName === 'TABLE') {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  },

  // Get the table element containing this element
  getContainingTable(element) {
    let current = element;
    while (current && current !== document.body) {
      if (current.tagName === 'TABLE') {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TableParser;
}
