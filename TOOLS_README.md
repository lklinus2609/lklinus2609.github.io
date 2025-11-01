# Cycloidal Gear Generator - Tools Page

## Overview

Interactive web-based tool for generating cycloidal gear profiles. **100% client-side** - no backend server required!

## Features

- ✅ **Pure JavaScript** - runs entirely in the browser
- ✅ **Live Preview** - Canvas-based visualization
- ✅ **DXF Export** - Download CAD-ready files
- ✅ **Calculated Parameters** - Real-time gear geometry calculations
- ✅ **Static Hosting** - Works on GitHub Pages, Netlify, etc.

## Files

```
Portfolio/
├── tools.html                          # Main tools page
├── assets/
│   ├── css/
│   │   └── tools.css                   # Tools page styling
│   └── js/
│       ├── cycloidal-gear.js           # Gear math & DXF generation
│       └── tools.js                    # UI logic and handlers
└── index.html                          # Updated with Tools link
```

## How to Use

### For Users:

1. Open `tools.html` in any modern browser (Chrome, Firefox, Safari, Edge)
2. Adjust the input parameters:
   - **Roller Diameter**: Diameter of each roller pin
   - **Number of Rollers**: Total roller pins (min 3)
   - **Outer Diameter**: Target outer diameter of cycloidal disc
   - **Input Shaft Diameter**: Center shaft hole diameter
   - **Cycloidal Modulus**: Ratio parameter (typically 0.1-0.3)
3. Click "Generate Preview" to visualize
4. Click "Download DXF" to get CAD file

### For Deployment:

**Static hosting (GitHub Pages, Netlify, Vercel):**
```bash
# Just push and deploy - no build step needed!
git add .
git commit -m "Add cycloidal gear generator"
git push origin main
```

The tool will work immediately on any static hosting platform.

## Technical Details

### Cycloidal Gear Mathematics

The generator implements the cycloidal disc profile equation:

```javascript
x = l_rol * sin(θ) + r_roll * sin(θ + ξ)
y = l_rol * cos(θ) + r_roll * cos(θ + ξ)

where:
- l_rol = e * cos(N * θ) + sqrt((r_roll + r_wave)² - (e * sin(N * θ))²)
- ξ = atan2(e * N * sin(N * θ), s_rol)
- N = number of rollers + 1 (cavity number)
- e = cycloidal modulus * roller diameter (eccentricity)
```

### DXF Format

Exports AutoCAD DXF R2010 format with layers:
- `Cycloidal_Ring_Gear` - Main gear profile (polyline)
- `Separator_Outer` & `Separator_Inner` - Separator circles
- `Rollers` - Roller pin holes
- `Wave_Generator` - Wave generator circle
- `Input_Shaft` - Center shaft hole

### Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (uses ES6+)

## Legacy Flask Backend

The Flask backend (`app.py`) is no longer needed for the tools page but is kept for reference:

```bash
# If you want to run the Flask version (optional):
pip install -r requirements.txt
python app.py
```

**Note**: The client-side version is recommended for deployment.

## License

Part of Linus Kim's Portfolio
© 2025 Linus Kim
