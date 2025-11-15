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

        // Add Cycloidal Ring Gear as B-spline using verb-nurbs
        // Generate points (without duplicate - verb handles closure)
        const cycloidPath = this.cycloidPoints(1000);

        // Convert to verb format [[x, y], ...]
        const points = cycloidPath.slice(0, -1).map(p => [p.x, p.y]); // Remove duplicate closing point

        // Use verb-nurbs to create interpolated B-spline curve
        if (typeof verb !== 'undefined') {
            try {
                const curve = verb.geom.NurbsCurve.byPoints(points, 3); // degree 3 (cubic)
                const controlPoints = curve.controlPoints();
                const knots = curve.knots();
                const degree = curve.degree();

                dxf.addSpline(controlPoints, knots, degree, 'Cycloidal_Ring_Gear', 5, false);
            } catch(e) {
                console.warn('verb-nurbs failed, falling back to polyline:', e.message);
                dxf.addPolyline(cycloidPath, 'Cycloidal_Ring_Gear', 5, true);
            }
        } else {
            // Fallback to polyline if verb is not loaded
            console.warn('verb-nurbs not loaded, using polyline');
            dxf.addPolyline(cycloidPath, 'Cycloidal_Ring_Gear', 5, true);
        }

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
 * B-Spline Interpolation
 * Implements cubic B-spline interpolation similar to ezdxf's global_bspline_interpolation
 */
class BSplineInterpolation {
    /**
     * Create a cubic B-spline from interpolation points using chord parameterization
     * @param {Array} points - Array of {x, y} points
     * @param {number} degree - Degree of the spline (typically 3 for cubic)
     * @returns {Object} - {controlPoints, knots, degree}
     */
    static globalBSplineInterpolation(points, degree = 3) {
        const n = points.length - 1; // Number of intervals (points includes duplicate for closure)

        // Calculate parameters using chord length method
        const parameters = this.chordLengthParameterization(points);

        // Generate knot vector for cubic B-spline
        const knots = this.generateKnotVector(parameters, degree, n);

        // Solve for control points using matrix equation
        const controlPoints = this.solveControlPoints(points, parameters, knots, degree);

        return {
            controlPoints,
            knots,
            degree
        };
    }

    /**
     * Chord length parameterization
     */
    static chordLengthParameterization(points) {
        const n = points.length;
        const parameters = [0];
        let totalLength = 0;

        // Calculate chord lengths
        const chordLengths = [];
        for (let i = 1; i < n; i++) {
            const dx = points[i].x - points[i - 1].x;
            const dy = points[i].y - points[i - 1].y;
            const length = Math.sqrt(dx * dx + dy * dy);
            chordLengths.push(length);
            totalLength += length;
        }

        // Normalize to [0, 1]
        let accumulated = 0;
        for (let i = 0; i < chordLengths.length; i++) {
            accumulated += chordLengths[i];
            parameters.push(accumulated / totalLength);
        }

        return parameters;
    }

    /**
     * Generate knot vector for B-spline
     */
    static generateKnotVector(parameters, degree, n) {
        const m = n + degree + 1;
        const knots = [];

        // First degree+1 knots are 0
        for (let i = 0; i <= degree; i++) {
            knots.push(0);
        }

        // Middle knots using averaging
        for (let i = 1; i < n - degree + 1; i++) {
            let sum = 0;
            for (let j = i; j < i + degree; j++) {
                sum += parameters[j];
            }
            knots.push(sum / degree);
        }

        // Last degree+1 knots are 1
        for (let i = 0; i <= degree; i++) {
            knots.push(1);
        }

        return knots;
    }

    /**
     * Solve for control points using basis functions
     */
    static solveControlPoints(points, parameters, knots, degree) {
        const n = points.length - 1;

        // Build matrix A and solve Ax = B for x and y separately
        const matrixSize = n + 1;
        const A = Array(matrixSize).fill(0).map(() => Array(matrixSize).fill(0));
        const Bx = Array(matrixSize).fill(0);
        const By = Array(matrixSize).fill(0);

        // Fill matrix with basis function values
        const memo = {}; // Shared memoization cache
        for (let i = 0; i <= n; i++) {
            for (let j = 0; j <= n; j++) {
                A[i][j] = this.basisFunction(j, degree, parameters[i], knots, memo);
            }
            Bx[i] = points[i].x;
            By[i] = points[i].y;
        }

        // Solve linear system
        const controlX = this.solveLinearSystem(A, Bx);
        const controlY = this.solveLinearSystem(A, By);

        // Combine into control points
        const controlPoints = [];
        for (let i = 0; i < controlX.length; i++) {
            controlPoints.push({ x: controlX[i], y: controlY[i] });
        }

        return controlPoints;
    }

    /**
     * Cox-de Boor recursion formula for B-spline basis functions
     * Memoized version to avoid stack overflow
     */
    static basisFunction(i, p, u, knots, memo = {}) {
        const key = `${i}_${p}_${u}`;
        if (memo[key] !== undefined) return memo[key];

        if (p === 0) {
            const result = (u >= knots[i] && u < knots[i + 1]) ? 1.0 : 0.0;
            memo[key] = result;
            return result;
        }

        let left = 0.0;
        const denomLeft = knots[i + p] - knots[i];
        if (Math.abs(denomLeft) > 1e-10) {
            left = ((u - knots[i]) / denomLeft) * this.basisFunction(i, p - 1, u, knots, memo);
        }

        let right = 0.0;
        const denomRight = knots[i + p + 1] - knots[i + 1];
        if (Math.abs(denomRight) > 1e-10) {
            right = ((knots[i + p + 1] - u) / denomRight) * this.basisFunction(i + 1, p - 1, u, knots, memo);
        }

        const result = left + right;
        memo[key] = result;
        return result;
    }

    /**
     * Solve linear system Ax = b using Gaussian elimination with partial pivoting
     */
    static solveLinearSystem(A, b) {
        const n = b.length;
        const augmented = A.map((row, i) => [...row, b[i]]);

        // Forward elimination with partial pivoting
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = k;
                }
            }

            // Check for singular matrix
            if (Math.abs(augmented[maxRow][i]) < 1e-10) {
                console.error('Matrix is singular or nearly singular at row', i);
                return Array(n).fill(NaN);
            }

            // Swap rows
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

            // Eliminate column
            for (let k = i + 1; k < n; k++) {
                const factor = augmented[k][i] / augmented[i][i];
                for (let j = i; j <= n; j++) {
                    augmented[k][j] -= factor * augmented[i][j];
                }
            }
        }

        // Back substitution
        const x = Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            if (Math.abs(augmented[i][i]) < 1e-10) {
                console.error('Division by zero or nearly zero at row', i);
                return Array(n).fill(NaN);
            }
            x[i] = augmented[i][n];
            for (let j = i + 1; j < n; j++) {
                x[i] -= augmented[i][j] * x[j];
            }
            x[i] /= augmented[i][i];
        }

        return x;
    }
}

class DXFWriter {
    constructor() {
        this.entities = [];
        this.layers = new Set();
        this.handleCounter = 0x100; // Start entity handles at 256
    }

    /**
     * Format group code with proper right-alignment (3 characters)
     */
    gc(code) {
        return code.toString().padStart(3, ' ');
    }

    /**
     * Add line ending (Windows style \r\n for compatibility)
     */
    endl() {
        return '\n';
    }

    /**
     * Get next entity handle in hex format
     */
    nextHandle() {
        return (this.handleCounter++).toString(16).toUpperCase();
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

    addSpline(controlPoints, knots, degree, layer = '0', color = 7, closed = false) {
        this.layers.add(layer);
        this.entities.push({
            type: 'SPLINE',
            layer,
            color,
            controlPoints,
            knots,
            degree,
            closed
        });
    }

    toString() {
        let dxf = '';
        const gc = (code) => this.gc(code);
        const nl = this.endl();

        // Header
        dxf += `  0
SECTION
  2
HEADER
  9
$ACADVER
  1
AC1024
  9
$HANDSEED
  5
${this.nextHandle()}
  0
ENDSEC
`;

        // Classes
        dxf += `  0
SECTION
  2
CLASSES
  0
ENDSEC
`;

        // Tables
        dxf += `  0
SECTION
  2
TABLES
  0
TABLE
  2
LTYPE
  5
2
330
0
100
AcDbSymbolTable
 70
1
  0
LTYPE
  5
14
330
2
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
  2
Continuous
 70
0
  3
Solid line
 72
65
 73
0
 40
0.0
  0
ENDTAB
`;

        // LAYER table (Required - layers)
        const layerCount = this.layers.size + 1; // +1 for layer "0"
        dxf += `${gc(0)}${nl}TABLE${nl}${gc(2)}${nl}LAYER${nl}${gc(5)}${nl}1${nl}${gc(330)}${nl}0${nl}${gc(100)}${nl}AcDbSymbolTable${nl}${gc(70)}${nl}${layerCount}${nl}`;

        // Layer "0" (required base layer)
        dxf += `${gc(0)}${nl}LAYER${nl}${gc(5)}${nl}10${nl}${gc(330)}${nl}1${nl}${gc(100)}${nl}AcDbSymbolTableRecord${nl}${gc(100)}${nl}AcDbLayerTableRecord${nl}${gc(2)}${nl}0${nl}${gc(70)}${nl}0${nl}${gc(62)}${nl}7${nl}${gc(6)}${nl}Continuous${nl}`;

        // User layers
        let layerHandle = 0x20;
        this.layers.forEach(layer => {
            const handle = (layerHandle++).toString(16).toUpperCase();
            dxf += `${gc(0)}${nl}LAYER${nl}${gc(5)}${nl}${handle}${nl}${gc(330)}${nl}1${nl}${gc(100)}${nl}AcDbSymbolTableRecord${nl}${gc(100)}${nl}AcDbLayerTableRecord${nl}${gc(2)}${nl}${layer}${nl}${gc(70)}${nl}0${nl}${gc(62)}${nl}7${nl}${gc(6)}${nl}Continuous${nl}`;
        });

        dxf += `${gc(0)}${nl}ENDTAB${nl}`;

        dxf += `  0
TABLE
  2
STYLE
  5
5
330
0
100
AcDbSymbolTable
 70
1
  0
STYLE
  5
29
330
5
100
AcDbSymbolTableRecord
100
AcDbTextStyleTableRecord
  2
Standard
 70
0
 40
0.0
 41
1.0
 50
0.0
 71
0
 42
2.5
  3
txt
  4

  0
ENDTAB
  0
TABLE
  2
VIEW
  5
7
330
0
100
AcDbSymbolTable
 70
0
  0
ENDTAB
  0
TABLE
  2
UCS
  5
6
330
0
100
AcDbSymbolTable
 70
0
  0
ENDTAB
  0
TABLE
  2
APPID
  5
3
330
0
100
AcDbSymbolTable
 70
1
  0
APPID
  5
2A
330
3
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
  2
ACAD
 70
0
  0
ENDTAB
  0
TABLE
  2
BLOCK_RECORD
  5
9
330
0
100
AcDbSymbolTable
 70
2
  0
BLOCK_RECORD
  5
17
330
9
100
AcDbSymbolTableRecord
100
AcDbBlockTableRecord
  2
*Model_Space
 70
0
280
1
281
0
  0
BLOCK_RECORD
  5
1B
330
9
100
AcDbSymbolTableRecord
100
AcDbBlockTableRecord
  2
*Paper_Space
 70
0
280
1
281
0
  0
ENDTAB
  0
ENDSEC
`;

        // Blocks
        dxf += `  0
SECTION
  2
BLOCKS
  0
BLOCK
  5
18
330
17
100
AcDbEntity
  8
0
100
AcDbBlockBegin
  2
*Model_Space
 70
0
 10
0.0
 20
0.0
 30
0.0
  3
*Model_Space
  1

  0
ENDBLK
  5
19
330
17
100
AcDbEntity
  8
0
100
AcDbBlockEnd
  0
BLOCK
  5
1C
330
1B
100
AcDbEntity
  8
0
100
AcDbBlockBegin
  2
*Paper_Space
 70
0
 10
0.0
 20
0.0
 30
0.0
  3
*Paper_Space
  1

  0
ENDBLK
  5
1D
330
1B
100
AcDbEntity
  8
0
100
AcDbBlockEnd
  0
ENDSEC
`;

        // Entities
        dxf += `${gc(0)}${nl}SECTION${nl}${gc(2)}${nl}ENTITIES${nl}`;

        this.entities.forEach(entity => {
            if (entity.type === 'CIRCLE') {
                dxf += this.circleToString(entity);
            } else if (entity.type === 'LWPOLYLINE') {
                dxf += this.polylineToString(entity);
            } else if (entity.type === 'SPLINE') {
                dxf += this.splineToString(entity);
            }
        });

        dxf += `${gc(0)}${nl}ENDSEC${nl}`;

        // Objects
        dxf += `  0
SECTION
  2
OBJECTS
  0
DICTIONARY
  5
A
330
0
100
AcDbDictionary
281
1
  3
ACAD_GROUP
350
C
  0
DICTIONARY
  5
C
330
A
100
AcDbDictionary
281
1
  0
ENDSEC
`;

        // EOF
        dxf += `${gc(0)}${nl}EOF${nl}`;

        return dxf;
    }

    circleToString(circle) {
        const gc = (code) => this.gc(code);
        const nl = this.endl();
        const handle = this.nextHandle();
        return `${gc(0)}${nl}CIRCLE${nl}${gc(5)}${nl}${handle}${nl}${gc(100)}${nl}AcDbEntity${nl}${gc(8)}${nl}${circle.layer}${nl}${gc(62)}${nl}${circle.color}${nl}${gc(100)}${nl}AcDbCircle${nl}${gc(10)}${nl}${circle.cx.toFixed(6)}${nl}${gc(20)}${nl}${circle.cy.toFixed(6)}${nl}${gc(30)}${nl}0.0${nl}${gc(40)}${nl}${circle.radius.toFixed(6)}${nl}`;
    }

    polylineToString(polyline) {
        const gc = (code) => this.gc(code);
        const nl = this.endl();
        const handle = this.nextHandle();

        // Match ezdxf LWPOLYLINE format exactly
        let dxf = `${gc(0)}${nl}LWPOLYLINE${nl}${gc(5)}${nl}${handle}${nl}${gc(100)}${nl}AcDbEntity${nl}${gc(8)}${nl}${polyline.layer}${nl}${gc(62)}${nl}${polyline.color}${nl}${gc(100)}${nl}AcDbPolyline${nl}${gc(90)}${nl}${polyline.points.length}${nl}${gc(70)}${nl}${polyline.closed ? 1 : 0}${nl}`;

        polyline.points.forEach(point => {
            dxf += `${gc(10)}${nl}${point.x.toFixed(6)}${nl}${gc(20)}${nl}${point.y.toFixed(6)}${nl}`;
        });

        return dxf;
    }

    splineToString(spline) {
        const gc = (code) => this.gc(code);
        const nl = this.endl();
        const handle = this.nextHandle();

        // SPLINE entity format matching ezdxf output
        let dxf = `${gc(0)}${nl}SPLINE${nl}`;
        dxf += `${gc(5)}${nl}${handle}${nl}`;
        dxf += `${gc(330)}${nl}17${nl}`; // Owner handle (modelspace)
        dxf += `${gc(100)}${nl}AcDbEntity${nl}`;
        dxf += `${gc(8)}${nl}${spline.layer}${nl}`;
        dxf += `${gc(62)}${nl}${spline.color}${nl}`;
        dxf += `${gc(100)}${nl}AcDbSpline${nl}`;
        dxf += `${gc(70)}${nl}${spline.closed ? 1 : 0}${nl}`; // Spline flags (0=open, 1=closed)
        dxf += `${gc(71)}${nl}${spline.degree}${nl}`; // Degree
        dxf += `${gc(72)}${nl}${spline.knots.length}${nl}`; // Number of knots
        dxf += `${gc(73)}${nl}${spline.controlPoints.length}${nl}`; // Number of control points
        dxf += `${gc(74)}${nl}0${nl}`; // Number of fit points (0 for interpolation)

        // Write knot values
        spline.knots.forEach(knot => {
            dxf += `${gc(40)}${nl}${knot.toFixed(16)}${nl}`;
        });

        // Write control points
        spline.controlPoints.forEach(cp => {
            // verb-nurbs returns points as [x, y] or [x, y, z]
            const x = Array.isArray(cp) ? cp[0] : cp.x;
            const y = Array.isArray(cp) ? cp[1] : cp.y;
            const z = Array.isArray(cp) && cp.length > 2 ? cp[2] : 0;

            dxf += `${gc(10)}${nl}${x.toFixed(6)}${nl}`;
            dxf += `${gc(20)}${nl}${y.toFixed(6)}${nl}`;
            dxf += `${gc(30)}${nl}${z.toFixed(6)}${nl}`;
        });

        return dxf;
    }
}


// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CycloidalGearGenerator, DXFWriter };
}
