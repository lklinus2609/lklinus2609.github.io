/**
 * Tools Page - Client-Side Cycloidal Gear Generator
 * Pure JavaScript implementation with B-spline DXF generation
 */

// DOM Elements
const gearForm = document.getElementById('gear-form');
const downloadBtn = document.getElementById('download-btn');
const previewContainer = document.getElementById('preview-container');
const previewPlaceholder = document.getElementById('preview-placeholder');
const calculatedParams = document.getElementById('calculated-params');
const statusMessage = document.getElementById('status-message');

// Parameters display elements
const paramEcc = document.getElementById('param-ecc');
const paramCav = document.getElementById('param-cav');
const paramOuter = document.getElementById('param-outer');
const paramWave = document.getElementById('param-wave');

// Store current generator instance
let currentGenerator = null;
let previewCanvas = null;

// Initialize canvas
function initCanvas() {
    if (!previewCanvas) {
        previewCanvas = document.createElement('canvas');
        previewCanvas.id = 'preview-canvas';
        previewCanvas.width = 600;
        previewCanvas.height = 600;
        previewCanvas.style.width = '100%';
        previewCanvas.style.height = 'auto';
        previewCanvas.style.borderRadius = '12px';
        previewCanvas.style.display = 'none';
        previewContainer.appendChild(previewCanvas);
    }
    return previewCanvas;
}

// Show status message
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.style.display = 'block';

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
}

// Hide status message
function hideStatus() {
    statusMessage.style.display = 'none';
}

// Get form values
function getFormValues() {
    return {
        roller_diameter: parseFloat(document.getElementById('roller_diameter').value),
        rollers_num: parseInt(document.getElementById('rollers_num').value),
        cycloid_outer_diameter: parseFloat(document.getElementById('cycloid_outer_diameter').value),
        input_shaft_diameter: parseFloat(document.getElementById('input_shaft_diameter').value),
        cycloidal_modulus: parseFloat(document.getElementById('cycloidal_modulus').value)
    };
}

// Validate form inputs
function validateInputs(params) {
    const errors = [];

    if (isNaN(params.roller_diameter) || params.roller_diameter <= 0) {
        errors.push('Roller diameter must be a positive number');
    }
    if (isNaN(params.rollers_num) || params.rollers_num < 3) {
        errors.push('Number of rollers must be at least 3');
    }
    if (isNaN(params.cycloid_outer_diameter) || params.cycloid_outer_diameter <= 0) {
        errors.push('Outer diameter must be a positive number');
    }
    if (isNaN(params.input_shaft_diameter) || params.input_shaft_diameter <= 0) {
        errors.push('Input shaft diameter must be a positive number');
    }
    if (isNaN(params.cycloidal_modulus) || params.cycloidal_modulus <= 0 || params.cycloidal_modulus > 1) {
        errors.push('Cycloidal modulus must be between 0 and 1');
    }

    return errors;
}

// Update calculated parameters display
function updateCalculatedParams(params) {
    paramEcc.textContent = `${params.eccentricity} mm`;
    paramCav.textContent = params.cavity_number;
    paramOuter.textContent = `${params.actual_outer_diameter} mm`;
    paramWave.textContent = `${params.wave_generator_radius} mm`;
    calculatedParams.style.display = 'block';
}

// Generate preview
function generatePreview(params) {
    try {
        showStatus('Generating preview...', 'info');

        // Create gear generator instance
        currentGenerator = new CycloidalGearGenerator(params);

        // Validate geometry
        const validation = currentGenerator.validate();
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Initialize canvas if needed
        const canvas = initCanvas();

        // Draw preview
        currentGenerator.drawPreview(canvas);

        // Show canvas, hide placeholder
        canvas.style.display = 'block';
        previewPlaceholder.style.display = 'none';

        // Update calculated parameters
        const calcParams = currentGenerator.getCalculatedParams();
        updateCalculatedParams(calcParams);

        // Enable download button
        downloadBtn.disabled = false;

        showStatus('Preview generated successfully! Now using B-spline DXF generation.', 'success');

    } catch (error) {
        console.error('Error generating preview:', error);
        showStatus(`Error: ${error.message}`, 'error');
        downloadBtn.disabled = true;
        currentGenerator = null;
    }
}

// Download DXF file
function downloadDXF() {
    try {
        if (!currentGenerator) {
            throw new Error('Please generate a preview first');
        }

        showStatus('Generating DXF file with B-spline...', 'info');
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

        // Generate DXF content using B-spline interpolation
        const dxfContent = currentGenerator.generateDXF();

        // Create blob and download
        const blob = new Blob([dxfContent], { type: 'application/dxf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
        const filename = `cycloidal_gear_${timestamp}.dxf`;

        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showStatus(`DXF file downloaded: ${filename}`, 'success');
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download DXF';

    } catch (error) {
        console.error('Error downloading DXF:', error);
        showStatus(`Error: ${error.message}`, 'error');
        downloadBtn.disabled = currentGenerator ? false : true;
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download DXF';
    }
}

// Form submit handler
gearForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hideStatus();

    const params = getFormValues();

    // Validate inputs
    const errors = validateInputs(params);
    if (errors.length > 0) {
        showStatus(errors.join(', '), 'error');
        return;
    }

    generatePreview(params);
});

// Download button handler
downloadBtn.addEventListener('click', () => {
    downloadDXF();
});

// Add input validation on change
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', () => {
        hideStatus();
        // Reset download button when parameters change
        if (currentGenerator) {
            downloadBtn.disabled = true;
            currentGenerator = null;
        }
    });
});

// Auto-generate preview on load with default values
function autoGeneratePreview() {
    try {
        const params = getFormValues();
        const errors = validateInputs(params);
        if (errors.length === 0) {
            generatePreview(params);
        }
    } catch (error) {
        console.log('Could not auto-generate preview:', error.message);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Cycloidal Gear Generator initialized (Pure JavaScript with B-spline)');

    // Add smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Auto-generate preview with default values
    setTimeout(() => {
        autoGeneratePreview();
    }, 100);
});
