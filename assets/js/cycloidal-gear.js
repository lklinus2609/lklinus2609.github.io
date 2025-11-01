/**
 * Cycloidal Gear Generator - Pure JavaScript Implementation
 * Generates cycloidal gear profiles and exports to DXF format
 */

class CycloidalGearGenerator {
    constructor(params) {
        this.rollerDiameter = params.roller_diameter;
        this.rollersNum = params.rollers_num;
        this.cycloidOuterDiameter = params.cycloid_outer_diameter;
        this.inputShaftDiameter = params.input_shaft_diameter;
        this.cycloidalModulus = params.cycloidal_modulus;

        // Calculate derived parameters
        this.calculateDerivedParams();
    }

    calculateDerivedParams() {
        this.ecc = this.cycloidalModulus * this.rollerDiameter; // Eccentricity
        this.cavNum = this.rollersNum + 1; // Number of Cycloids
        this.cyRMin = (1.1 * this.rollerDiameter) / Math.sin(Math.PI / this.cavNum) + 2 * this.ecc;
        this.cyR = Math.max(this.cycloidOuterDiameter / 2, this.cyRMin); // Outer Cycloid Radius
        this.waveGenR = (this.cyR - 2 * this.ecc) - this.rollerDiameter; // Wave Generator Radius
        this.rollR = this.rollerDiameter / 2; // Roller Radius

        // Separator parameters
        this.sepWidth = 2.2 * this.ecc;
        this.sepMiddleRadius = this.waveGenR + this.rollR;
        this.sepOuterRadius = this.sepMiddleRadius + this.sepWidth / 2;
        this.sepInnerRadius = this.sepMiddleRadius - this.sepWidth / 2;
    }

    /**
     * Calculate cycloidal points
     */
    cycloidPoints(resolution = 500) {
        const points = [];

        for (let i = 0; i < resolution; i++) {
            const theta = (i / resolution) * 2 * Math.PI;

            const sRol = Math.sqrt(
                Math.pow(this.rollR + this.waveGenR, 2) -
                Math.pow(this.ecc * Math.sin(this.cavNum * theta), 2)
            );
            const lRol = this.ecc * Math.cos(this.cavNum * theta) + sRol;
            const xi = Math.atan2(
                this.ecc * this.cavNum * Math.sin(this.cavNum * theta),
                sRol
            );

            const x = lRol * Math.sin(theta) + this.rollR * Math.sin(theta + xi);
            const y = lRol * Math.cos(theta) + this.rollR * Math.cos(theta + xi);

            points.push({ x, y });
        }

        // Close the loop
        points.push({ x: points[0].x, y: points[0].y });

        return points;
    }

    /**
     * Calculate roller positions
     */
    getRollerPositions() {
        const positions = [];

        for (let i = 0; i < this.rollersNum; i++) {
            const t = (i / this.rollersNum) * 2 * Math.PI;

            const sRol = Math.sqrt(
                Math.pow(this.rollR + this.waveGenR, 2) -
                Math.pow(this.ecc * Math.sin(this.cavNum * t), 2)
            );
            const lRol = this.ecc * Math.cos(this.cavNum * t) + sRol;

            const x = lRol * Math.sin(t);
            const y = lRol * Math.cos(t);

            positions.push({ x, y, radius: this.rollR });
        }

        return positions;
    }

    /**
     * Get calculated parameters for display
     */
    getCalculatedParams() {
        return {
            eccentricity: parseFloat(this.ecc.toFixed(4)),
            cavity_number: this.cavNum,
            actual_outer_diameter: parseFloat((this.cyR * 2).toFixed(4)),
            wave_generator_radius: parseFloat(this.waveGenR.toFixed(4))
        };
    }

    /**
     * Validate geometry
     */
    validate() {
        if (this.waveGenR <= 0) {
            return {
                valid: false,
                error: 'Invalid geometry: wave generator radius is negative. Try increasing outer diameter or decreasing modulus.'
            };
        }
        return { valid: true };
    }

    /**
     * Draw preview on canvas
     */
    drawPreview(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#F9F7F4';
        ctx.fillRect(0, 0, width, height);

        // Calculate scale to fit
        const margin = 40;
        const maxDim = this.cyR * 2 + 4;
        const scale = Math.min((width - 2 * margin) / maxDim, (height - 2 * margin) / maxDim);

        // Center of canvas
        const centerX = width / 2;
        const centerY = height / 2;

        // Helper function to convert coordinates
        const toCanvas = (x, y) => ({
            x: centerX + x * scale,
            y: centerY - y * scale  // Flip Y axis
        });

        // Set line styles
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw Separator circles
        ctx.strokeStyle = '#5C9447';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ctx.arc(centerX, centerY, this.sepOuterRadius * scale, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, this.sepInnerRadius * scale, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.setLineDash([]);

        // Draw Wave Generator
        ctx.strokeStyle = '#D9534F';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([10, 5]);

        const waveGenCenter = toCanvas(0, this.ecc);
        ctx.beginPath();
        ctx.arc(waveGenCenter.x, waveGenCenter.y, this.waveGenR * scale, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.setLineDash([]);

        // Draw Input Shaft
        ctx.strokeStyle = '#8E44AD';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 3]);

        ctx.beginPath();
        ctx.arc(centerX, centerY, (this.inputShaftDiameter / 2) * scale, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.setLineDash([]);

        // Draw Rollers
        const rollers = this.getRollerPositions();
        ctx.fillStyle = 'rgba(255, 165, 0, 0.7)';
        ctx.strokeStyle = 'rgba(255, 140, 0, 1)';
        ctx.lineWidth = 1;

        rollers.forEach(roller => {
            const pos = toCanvas(roller.x, roller.y);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, roller.radius * scale, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        });

        // Draw Cycloidal Ring Gear
        const cycloidPath = this.cycloidPoints(500);
        ctx.strokeStyle = '#2C5F8D';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        const firstPoint = toCanvas(cycloidPath[0].x, cycloidPath[0].y);
        ctx.moveTo(firstPoint.x, firstPoint.y);

        for (let i = 1; i < cycloidPath.length; i++) {
            const point = toCanvas(cycloidPath[i].x, cycloidPath[i].y);
            ctx.lineTo(point.x, point.y);
        }

        ctx.stroke();

        // Draw legend
        this.drawLegend(ctx, margin);

        // Draw grid
        this.drawGrid(ctx, width, height, centerX, centerY, scale);
    }

    /**
     * Draw legend
     */
    drawLegend(ctx, margin) {
        const legendX = margin;
        const legendY = margin;
        const lineLength = 30;
        const lineSpacing = 25;

        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const items = [
            { color: '#2C5F8D', text: 'Cycloidal Ring', dash: [] },
            { color: '#5C9447', text: 'Separator', dash: [5, 5] },
            { color: '#D9534F', text: 'Wave Generator', dash: [10, 5] },
            { color: '#8E44AD', text: 'Input Shaft', dash: [2, 3] },
            { color: 'rgba(255, 165, 0, 0.7)', text: 'Rollers', dash: [], fill: true }
        ];

        items.forEach((item, i) => {
            const y = legendY + i * lineSpacing;

            if (item.fill) {
                ctx.fillStyle = item.color;
                ctx.beginPath();
                ctx.arc(legendX + 15, y, 6, 0, 2 * Math.PI);
                ctx.fill();
            } else {
                ctx.strokeStyle = item.color;
                ctx.lineWidth = 2;
                ctx.setLineDash(item.dash);
                ctx.beginPath();
                ctx.moveTo(legendX, y);
                ctx.lineTo(legendX + lineLength, y);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            ctx.fillStyle = '#333';
            ctx.fillText(item.text, legendX + lineLength + 10, y);
        });
    }

    /**
     * Draw subtle grid
     */
    drawGrid(ctx, width, height, centerX, centerY, scale) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 0.5;

        const gridSpacing = scale * 2; // 2mm grid

        // Vertical lines
        for (let x = centerX % gridSpacing; x < width; x += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = centerY % gridSpacing; y < height; y += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    /**
     * Generate DXF file content
     */
    generateDXF() {
        const dxf = new DXFWriter();

        // Add Cycloidal Ring Gear as polyline (high resolution)
        const cycloidPath = this.cycloidPoints(1000);
        dxf.addPolyline(cycloidPath, 'Cycloidal_Ring_Gear', 5, true);

        // Add Separator circles
        dxf.addCircle(0, 0, this.sepOuterRadius, 'Separator_Outer', 3);
        dxf.addCircle(0, 0, this.sepInnerRadius, 'Separator_Inner', 3);

        // Add Rollers
        const rollers = this.getRollerPositions();
        rollers.forEach((roller, i) => {
            dxf.addCircle(roller.x, roller.y, roller.radius, 'Rollers', 2);
        });

        // Add Wave Generator
        dxf.addCircle(0, this.ecc, this.waveGenR, 'Wave_Generator', 1);

        // Add Input Shaft
        dxf.addCircle(0, 0, this.inputShaftDiameter / 2, 'Input_Shaft', 6);

        return dxf.toString();
    }
}

/**
 * Simple DXF Writer Class
 * Generates DXF R2010 format files
 */
class DXFWriter {
    constructor() {
        this.entities = [];
        this.layers = new Set();
    }

    addCircle(cx, cy, radius, layer = '0', color = 7) {
        this.layers.add(layer);
        this.entities.push({
            type: 'CIRCLE',
            layer,
            color,
            cx,
            cy,
            radius
        });
    }

    addPolyline(points, layer = '0', color = 7, closed = false) {
        this.layers.add(layer);
        this.entities.push({
            type: 'LWPOLYLINE',
            layer,
            color,
            points,
            closed
        });
    }

    toString() {
        let dxf = '';

        // Header
        dxf += '0\nSECTION\n2\nHEADER\n';
        dxf += '9\n$ACADVER\n1\nAC1024\n'; // AutoCAD 2010
        dxf += '9\n$INSUNITS\n70\n4\n'; // Millimeters
        dxf += '0\nENDSEC\n';

        // Tables (Layers)
        dxf += '0\nSECTION\n2\nTABLES\n';
        dxf += '0\nTABLE\n2\nLAYER\n70\n' + this.layers.size + '\n';

        this.layers.forEach(layer => {
            dxf += '0\nLAYER\n2\n' + layer + '\n70\n0\n62\n7\n6\nContinuous\n';
        });

        dxf += '0\nENDTAB\n0\nENDSEC\n';

        // Entities
        dxf += '0\nSECTION\n2\nENTITIES\n';

        this.entities.forEach(entity => {
            if (entity.type === 'CIRCLE') {
                dxf += this.circleToString(entity);
            } else if (entity.type === 'LWPOLYLINE') {
                dxf += this.polylineToString(entity);
            }
        });

        dxf += '0\nENDSEC\n';

        // EOF
        dxf += '0\nEOF\n';

        return dxf;
    }

    circleToString(circle) {
        return `0
CIRCLE
8
${circle.layer}
62
${circle.color}
10
${circle.cx.toFixed(6)}
20
${circle.cy.toFixed(6)}
30
0.0
40
${circle.radius.toFixed(6)}
`;
    }

    polylineToString(polyline) {
        let dxf = `0
LWPOLYLINE
8
${polyline.layer}
62
${polyline.color}
90
${polyline.points.length}
70
${polyline.closed ? 1 : 0}
`;

        polyline.points.forEach(point => {
            dxf += `10
${point.x.toFixed(6)}
20
${point.y.toFixed(6)}
`;
        });

        return dxf;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CycloidalGearGenerator, DXFWriter };
}
