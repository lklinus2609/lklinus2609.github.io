// Main content script - scans and converts units on webpages

(async function() {
  'use strict';

  // Track processed elements to avoid duplicate conversions
  const PROCESSED_ATTR = 'data-unit-converter-processed';
  const PROCESSED_TABLE_ATTR = 'data-unit-converter-table-processed';

  // Current preferences
  let preferences = null;

  // Helper to get the appropriate CSS class for conversions
  function getConversionClass() {
    return preferences.highlightConversions
      ? 'unit-converter-converted'
      : 'unit-converter-converted-no-highlight';
  }

  // Helper to detect navigation/sidebar/filter elements (REMOVED - too aggressive)
  // McMaster sidebar needs conversions, so we don't exclude it anymore
  function isNavigationElement(element) {
    // Only exclude top-level navigation (header nav, footer nav)
    // Don't exclude sidebar filters or product lists
    let current = element;
    while (current && current !== document.body) {
      const tagName = current.tagName;
      const id = current.id;

      // Only exclude main header/footer navigation
      if (tagName === 'NAV' && current.parentElement === document.body) {
        return true;
      }

      // Exclude footer
      if (tagName === 'FOOTER') {
        return true;
      }

      // Exclude main menu/header
      if (id && (id === 'header' || id === 'footer' || id === 'main-nav')) {
        return true;
      }

      current = current.parentElement;
    }

    return false;
  }

  // Initialize
  async function init() {
    preferences = await StorageManager.getPreferences();
    console.log('[Unit Converter] Initialized with preferences:', preferences);

    if (preferences.enabled) {
      await scanAndConvert();
    } else {
      console.log('[Unit Converter] Extension is disabled');
    }

    // Listen for preference changes
    StorageManager.onPreferencesChanged(async (newPreferences) => {
      preferences = newPreferences;

      if (preferences.enabled) {
        // Re-scan page with new preferences
        await scanAndConvert();
      } else {
        // Remove all conversions
        removeAllConversions();
      }
    });

    // Watch for dynamic content
    observeDOMChanges();

    // Watch for tables entering viewport (for lazy-loaded content)
    observeTableVisibility();
  }

  // Main scanning and conversion function
  async function scanAndConvert() {
    // Process tables first (primary use case)
    if (preferences.convertTables) {
      await convertTables();
    }

    // Then process inline text (optional, can be slow on large pages)
    if (preferences.convertInlineText) {
      await convertInlineText();
    }
  }

  // Convert units in tables
  async function convertTables() {
    const tables = document.querySelectorAll('table');

    tables.forEach(table => {
      // Check if table already has conversions (for dynamically recreated tables)
      const hasConversions = table.querySelector('.unit-converter-converted, .unit-converter-converted-no-highlight');

      // Skip if already processed AND still has conversions
      if (table.hasAttribute(PROCESSED_TABLE_ATTR) && hasConversions) {
        return;
      }

      // If it was processed but lost conversions (recreated by McMaster), reprocess
      if (table.hasAttribute(PROCESSED_TABLE_ATTR) && !hasConversions) {
        table.removeAttribute(PROCESSED_TABLE_ATTR);
      }

      // Use the shared processTable function
      processTable(table);
    });
  }

  // Convert inline text (non-table content)
  async function convertInlineText() {
    // Get all text nodes in the document
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script, style, and other non-visible elements
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          // Skip if parent is already processed
          if (parent.hasAttribute(PROCESSED_ATTR)) {
            return NodeFilter.FILTER_REJECT;
          }

          // CRITICAL: Skip if already has conversion spans
          if (parent.querySelector('.unit-converter-converted, .unit-converter-converted-no-highlight')) {
            parent.setAttribute(PROCESSED_ATTR, 'true');
            return NodeFilter.FILTER_REJECT;
          }

          const tagName = parent.tagName;
          if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip if inside a table (handled separately)
          if (TableParser.isInsideTable(parent)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip navigation, sidebars, filters (common McMaster patterns)
          if (isNavigationElement(parent)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip if no text content
          if (!node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    // Process each text node with error handling
    textNodes.forEach((textNode, index) => {
      try {
        // Check if node is still valid and connected to DOM
        if (textNode.parentElement && document.contains(textNode)) {
          processTextNode(textNode);
        }
      } catch (error) {
        console.error('Error processing text node:', error);
        // Continue processing other nodes even if one fails
      }
    });
  }

  // Process a single text node for unit conversions
  function processTextNode(textNode) {
    const text = textNode.textContent;
    const detections = UnitDetector.detectUnits(text);

    if (detections.length === 0) {
      return;
    }

    // Filter detections based on conversion direction preference
    const relevantDetections = detections.filter(detection => {
      if (preferences.conversionDirection === 'both') {
        return true;
      } else if (preferences.conversionDirection === 'imperial-to-metric') {
        return ['inches', 'feet', 'yards', 'miles', 'pounds', 'ounces'].includes(detection.unit);
      } else if (preferences.conversionDirection === 'metric-to-imperial') {
        return ['millimeters', 'centimeters', 'meters', 'kilometers', 'grams', 'kilograms'].includes(detection.unit);
      }
      return true;
    });

    if (relevantDetections.length === 0) {
      return;
    }

    // Create document fragment with converted text
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    relevantDetections.forEach(detection => {
      // Add text before this detection
      if (detection.start > lastIndex) {
        const beforeText = text.substring(lastIndex, detection.start);
        fragment.appendChild(document.createTextNode(beforeText));
      }

      // Convert the detected unit
      const conversion = UnitConverter.convert(detection.value, detection.unit, preferences);

      if (conversion && conversion.conversions.length > 0) {
        // Create span for original text
        const originalSpan = document.createElement('span');
        originalSpan.textContent = detection.fullMatch;
        originalSpan.className = 'unit-converter-original';

        // Create span for conversion
        const conversionSpan = document.createElement('span');
        const formattedConversion = UnitConverter.formatConversion(conversion, preferences.displayMode);
        conversionSpan.textContent = ' ' + formattedConversion;
        conversionSpan.className = getConversionClass();
        conversionSpan.setAttribute('data-original', detection.fullMatch);

        if (preferences.displayMode === 'replace') {
          fragment.appendChild(conversionSpan);
        } else {
          fragment.appendChild(originalSpan);
          fragment.appendChild(conversionSpan);
        }
      } else {
        // No conversion available, keep original
        fragment.appendChild(document.createTextNode(detection.fullMatch));
      }

      lastIndex = detection.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    // Replace text node with fragment
    const parent = textNode.parentElement;
    if (parent) {
      parent.replaceChild(fragment, textNode);
      parent.setAttribute(PROCESSED_ATTR, 'true');
    }
  }

  // Apply conversion to table cell or other element
  function applyConversionToElement(element, conversion, isTableCell = false) {
    const formattedConversion = UnitConverter.formatConversion(conversion, preferences.displayMode);

    if (preferences.displayMode === 'replace') {
      element.setAttribute('data-original', element.textContent);
      element.textContent = formattedConversion;
      element.classList.add('unit-converter-replaced');
    } else if (preferences.displayMode === 'tooltip') {
      element.setAttribute('title', formattedConversion);
      element.classList.add('unit-converter-tooltip');
    } else {
      // Inline mode
      const conversionSpan = document.createElement('span');
      conversionSpan.textContent = ' ' + formattedConversion;
      conversionSpan.className = getConversionClass();
      element.appendChild(conversionSpan);
    }
  }

  // Remove all conversions from page
  function removeAllConversions() {
    // Remove converted spans (both highlighted and non-highlighted)
    document.querySelectorAll('.unit-converter-converted, .unit-converter-converted-no-highlight').forEach(el => el.remove());

    // Restore replaced elements
    document.querySelectorAll('.unit-converter-replaced').forEach(el => {
      const original = el.getAttribute('data-original');
      if (original) {
        el.textContent = original;
        el.removeAttribute('data-original');
      }
      el.classList.remove('unit-converter-replaced');
    });

    // Remove tooltip class
    document.querySelectorAll('.unit-converter-tooltip').forEach(el => {
      el.removeAttribute('title');
      el.classList.remove('unit-converter-tooltip');
    });

    // Clear processed tracking attributes
    document.querySelectorAll(`[${PROCESSED_ATTR}]`).forEach(el => {
      el.removeAttribute(PROCESSED_ATTR);
    });
    document.querySelectorAll(`[${PROCESSED_TABLE_ATTR}]`).forEach(el => {
      el.removeAttribute(PROCESSED_TABLE_ATTR);
    });

    // Clear observer tracking attributes (for proper re-observation)
    document.querySelectorAll('[data-observer-attached]').forEach(el => {
      el.removeAttribute('data-observer-attached');
    });
  }

  // Observe DOM changes for dynamic content
  function observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      if (!preferences.enabled) return;

      let hasNewTables = false;

      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Don't rescan if we added the nodes ourselves
          const hasConverterNodes = Array.from(mutation.addedNodes).some(node => {
            return node.classList && (
              node.classList.contains('unit-converter-converted') ||
              node.classList.contains('unit-converter-converted-no-highlight') ||
              node.classList.contains('unit-converter-original')
            );
          });

          if (hasConverterNodes) {
            return; // Skip our own changes
          }

          // Check if new tables were added (common with lazy loading)
          const addedTables = Array.from(mutation.addedNodes).some(node => {
            if (node.nodeType === 1) { // Element node
              return node.tagName === 'TABLE' || node.querySelector('table');
            }
            return false;
          });

          if (addedTables) {
            hasNewTables = true;
          }
        }
      });

      if (hasNewTables) {
        // Clear any pending scans
        clearTimeout(observeDOMChanges.timeout);
        // Short delay to batch multiple rapid changes
        observeDOMChanges.timeout = setTimeout(() => {
          // Attach IntersectionObserver to new tables
          if (observeTableVisibility.scanForNewTables) {
            observeTableVisibility.scanForNewTables();
          }
          // Then process all tables (including newly added ones)
          scanAndConvert();
        }, 100); // Much faster for table detection
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Watch for content being added to a specific table
  function observeTableContent(table) {
    // Skip if already observing this table's content
    if (table.dataset.contentObserverAttached) return;

    const contentObserver = new MutationObserver((mutations) => {
      if (!preferences.enabled) return;

      // Check if rows were added (virtual scrolling)
      const newRows = [];
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.tagName === 'TR' || node.tagName === 'TBODY') {
            // Row was added - collect it or its child rows
            if (node.tagName === 'TR') {
              newRows.push(node);
            } else if (node.tagName === 'TBODY') {
              node.querySelectorAll('tr').forEach(row => newRows.push(row));
            }
          }
        });
      });

      // Process newly added rows that need conversions
      if (newRows.length > 0) {
        console.log('[Unit Converter] Virtual scroll: processing', newRows.length, 'new rows');

        newRows.forEach(row => {
          const cells = row.querySelectorAll('td');
          cells.forEach(cell => {
            // Skip header cells (th elements)
            if (cell.tagName === 'TH') return;

            // Skip if already processed or has conversions
            if (cell.hasAttribute(PROCESSED_ATTR)) return;
            if (cell.querySelector('.unit-converter-converted, .unit-converter-converted-no-highlight')) {
              cell.setAttribute(PROCESSED_ATTR, 'true');
              return;
            }
            if (cell.querySelectorAll('img, svg, button, a').length > 0) return;

            // Skip cells with complex HTML structure (multiple non-text child nodes)
            const childElements = Array.from(cell.children);
            if (childElements.length > 5) return; // Allow McMaster's span-based fraction formatting (typically 3 spans)

            const text = cell.textContent.trim();
            if (!text || /^\d+(\.\d+)?$/.test(text)) return;

            // Skip cells that already contain bracket notation (pre-existing conversions)
            if (/\[.*?\]/.test(text)) return;

            const detections = UnitDetector.detectUnits(text);
            if (detections.length > 0) {
              const relevantDetections = detections.filter(detection => {
                if (preferences.conversionDirection === 'both') return true;
                if (preferences.conversionDirection === 'imperial-to-metric') {
                  return ['inches', 'feet', 'yards', 'miles', 'pounds', 'ounces'].includes(detection.unit);
                }
                if (preferences.conversionDirection === 'metric-to-imperial') {
                  return ['millimeters', 'centimeters', 'meters', 'kilometers', 'grams', 'kilograms'].includes(detection.unit);
                }
                return true;
              });

              if (relevantDetections.length > 0) {
                const detection = relevantDetections[0];
                const conversion = UnitConverter.convert(detection.value, detection.unit, preferences);

                if (conversion && conversion.conversions.length > 0) {
                  const formattedConversion = UnitConverter.formatConversion(conversion, 'inline');
                  const conversionSpan = document.createElement('span');
                  conversionSpan.textContent = ' ' + formattedConversion;
                  conversionSpan.className = getConversionClass();
                  cell.appendChild(conversionSpan);
                }

                cell.setAttribute(PROCESSED_ATTR, 'true');
              }
            }
          });
        });
      }
    });

    contentObserver.observe(table, {
      childList: true,
      subtree: true
    });

    table.dataset.contentObserverAttached = 'true';
  }

  // Observe when tables enter viewport (for lazy-loaded tables)
  function observeTableVisibility() {
    // Store observer instance for cleanup
    observeTableVisibility.intersectionObserver = new IntersectionObserver((entries) => {
      if (!preferences.enabled) return;

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const table = entry.target;
          const cellCount = table.querySelectorAll('td').length;

          console.log('[Unit Converter] Table entered viewport:', {
            hasProcessedAttr: table.hasAttribute(PROCESSED_TABLE_ATTR),
            hasConversions: !!table.querySelector('.unit-converter-converted, .unit-converter-converted-no-highlight'),
            cellCount: cellCount,
            isEmpty: cellCount === 0
          });

          // CRITICAL FIX: Always check if conversions exist when table enters viewport
          // McMaster dynamically recreates tables, losing conversions but keeping attributes
          const hasConversions = table.querySelector('.unit-converter-converted, .unit-converter-converted-no-highlight');

          // If table was processed but lost conversions, clear the attribute
          if (table.hasAttribute(PROCESSED_TABLE_ATTR) && !hasConversions) {
            console.log('[Unit Converter] Clearing stale attributes - table was recreated');
            table.removeAttribute(PROCESSED_TABLE_ATTR);
            // Also clear all cell processed attributes
            table.querySelectorAll(`[${PROCESSED_ATTR}]`).forEach(cell => {
              cell.removeAttribute(PROCESSED_ATTR);
            });
          }

          // Process if no conversions found
          if (!hasConversions) {
            // If table is empty, wait a bit for content to load
            if (cellCount === 0) {
              console.log('[Unit Converter] Table is empty, waiting for content...');
              setTimeout(() => {
                const newCellCount = table.querySelectorAll('td').length;
                console.log('[Unit Converter] Retry after delay - cells now:', newCellCount);
                if (newCellCount > 0) {
                  processTable(table);
                }
              }, 200); // Wait 200ms for content to load
            } else {
              console.log('[Unit Converter] Processing table...');
              processTable(table);
            }
          } else {
            console.log('[Unit Converter] Table already has conversions, skipping');
          }
        } else {
          console.log('[Unit Converter] Table exited viewport');
        }
      });
    }, {
      root: null, // viewport
      rootMargin: '100px', // Start processing slightly before table is visible
      threshold: 0.01 // Trigger when even 1% is visible
    });

    // Observe all existing tables and mark them for tracking
    const tables = document.querySelectorAll('table');
    console.log('[Unit Converter] Attaching IntersectionObserver to', tables.length, 'tables');
    tables.forEach(table => {
      observeTableVisibility.intersectionObserver.observe(table);
      table.dataset.observerAttached = 'true';

      // Also watch for content being added to this table
      observeTableContent(table);
    });

    // Store the existing observeDOMChanges observer to watch for new tables
    // Note: We rely on observeDOMChanges() for MutationObserver to avoid duplicates
    observeTableVisibility.scanForNewTables = () => {
      document.querySelectorAll('table').forEach(table => {
        // Only observe if not already observed
        if (!table.dataset.observerAttached) {
          console.log('[Unit Converter] Attaching observers to newly discovered table');
          observeTableVisibility.intersectionObserver.observe(table);
          table.dataset.observerAttached = 'true';
          // Also watch for content changes
          observeTableContent(table);
        }
      });
    };
  }

  // Process a single table
  function processTable(table) {
    console.log('[Unit Converter] processTable called');

    // Try header-based conversion first
    const conversions = TableParser.processTable(table, preferences);
    console.log('[Unit Converter] Header-based conversions found:', conversions.length);

    conversions.forEach(({ cell, conversion }) => {
      if (!cell.hasAttribute(PROCESSED_ATTR)) {
        applyConversionToElement(cell, conversion, true);
        cell.setAttribute(PROCESSED_ATTR, 'true');
      }
    });

    // FALLBACK: For tables without unit headers (like McMaster)
    const allCells = table.querySelectorAll('td');
    let fallbackConversions = 0;
    let cellsWithText = 0;
    let cellsChecked = 0;

    allCells.forEach(cell => {
      cellsChecked++;

      // Skip header cells (th elements)
      if (cell.tagName === 'TH') return;

      if (cell.hasAttribute(PROCESSED_ATTR)) return;
      if (cell.querySelector('.unit-converter-converted, .unit-converter-converted-no-highlight')) {
        cell.setAttribute(PROCESSED_ATTR, 'true');
        return;
      }
      if (cell.querySelectorAll('img, svg, button, a').length > 0) return;

      // Skip cells with complex HTML structure (multiple non-text child nodes)
      const childElements = Array.from(cell.children);
      if (childElements.length > 5) return; // Allow McMaster's span-based fraction formatting (typically 3 spans)

      const text = cell.textContent.trim();
      if (!text || /^\d+(\.\d+)?$/.test(text)) return;

      // Skip cells that already contain bracket notation (pre-existing conversions)
      if (/\[.*?\]/.test(text)) return;

      cellsWithText++;
      const detections = UnitDetector.detectUnits(text);
      if (detections.length > 0) {
        const relevantDetections = detections.filter(detection => {
          if (preferences.conversionDirection === 'both') return true;
          if (preferences.conversionDirection === 'imperial-to-metric') {
            return ['inches', 'feet', 'yards', 'miles', 'pounds', 'ounces'].includes(detection.unit);
          }
          if (preferences.conversionDirection === 'metric-to-imperial') {
            return ['millimeters', 'centimeters', 'meters', 'kilometers', 'grams', 'kilograms'].includes(detection.unit);
          }
          return true;
        });

        if (relevantDetections.length > 0) {
          const detection = relevantDetections[0];
          const conversion = UnitConverter.convert(detection.value, detection.unit, preferences);

          if (conversion && conversion.conversions.length > 0) {
            const formattedConversion = UnitConverter.formatConversion(conversion, 'inline');
            const conversionSpan = document.createElement('span');
            conversionSpan.textContent = ' ' + formattedConversion;
            conversionSpan.className = getConversionClass();
            cell.appendChild(conversionSpan);
            fallbackConversions++;
          }

          cell.setAttribute(PROCESSED_ATTR, 'true');
        }
      }
    });

    console.log('[Unit Converter] Table processing summary:', {
      cellsChecked,
      cellsWithText,
      fallbackConversions,
      totalConversions: conversions.length + fallbackConversions,
      isEmpty: cellsChecked === 0
    });

    // CRITICAL: Don't mark table as processed if it's empty (likely still loading)
    if (cellsChecked === 0) {
      console.log('[Unit Converter] Table is empty - will retry when content loads');
      return; // Don't mark as processed, allow retry
    }

    table.setAttribute(PROCESSED_TABLE_ATTR, 'true');
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggle') {
      preferences.enabled = message.enabled;
      StorageManager.savePreferences(preferences);

      if (preferences.enabled) {
        scanAndConvert();
      } else {
        removeAllConversions();
      }

      sendResponse({ success: true });
    } else if (message.action === 'rescan') {
      removeAllConversions();

      // Re-attach IntersectionObserver to all tables after cleanup
      if (observeTableVisibility.scanForNewTables) {
        observeTableVisibility.scanForNewTables();
      }

      scanAndConvert();
      sendResponse({ success: true });
    }
  });

  // Start the extension
  init();
})();
