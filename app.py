from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import matplotlib.pyplot as plt
import numpy as np
import ezdxf
from ezdxf.math import Vec3, global_bspline_interpolation
import io
import base64
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Function to plot cycloidal points
def cycloid_points(ecc, roll_r, wave_gen_r, rollers_num, cav_num, res=500):
    points = []
    for i in range(res):
        theta = (i / res) * 2 * np.pi

        s_rol = np.sqrt((roll_r + wave_gen_r) ** 2 - (ecc * np.sin(cav_num * theta)) ** 2)
        l_rol = ecc * np.cos(cav_num * theta) + s_rol
        xi = np.arctan2(ecc * cav_num * np.sin(cav_num * theta), s_rol)

        x = l_rol * np.sin(theta) + roll_r * np.sin(theta + xi)
        y = l_rol * np.cos(theta) + roll_r * np.cos(theta + xi)

        points.append((x, y))
    points.append(points[0])  # Close the loop

    return np.array(points)

# draw circle
def draw_circle(ax, center, radius, **kwargs):
    circle = plt.Circle(center, radius, **kwargs)
    ax.add_patch(circle)

# plot rollers
def plot_rols(ax, cy_r, wave_gen_r, roll_r, ecc, rollers_num, cav_num):
    R = cy_r - ecc
    theta = np.linspace(0, 2 * np.pi, rollers_num, endpoint=False)
    for t in theta:
        s_rol = np.sqrt((roll_r + wave_gen_r) ** 2 - (ecc * np.sin(cav_num * t)) ** 2)
        l_rol = ecc * np.cos(cav_num * t) + s_rol
        x = l_rol * np.sin(t)
        y = l_rol * np.cos(t)
        draw_circle(ax, (x, y), roll_r, fill=True, color='orange', alpha=0.7)

# export to DXF in memory
def create_dxf(ecc, roll_r, wave_gen_r, rollers_num, cav_num, cy_r, input_shaft_diameter):
    # Create a new DXF document
    doc = ezdxf.new('R2010')
    msp = doc.modelspace()

    # Add Cycloidal Ring Gear as a closed B-spline with proper interpolation
    cycloid_reduced = cycloid_points(ecc, roll_r, wave_gen_r, rollers_num, cav_num, res=1000)
    points_array = cycloid_reduced[:-1]  # Exclude duplicate closing point

    # Convert to Vec3 for B-spline interpolation
    points = [Vec3(p[0], p[1], 0) for p in points_array]

    # Add first point at the end to force closure
    points.append(points[0])

    # Create a periodic (closed) B-spline using global interpolation
    # degree=3 for cubic B-spline
    spline_data = global_bspline_interpolation(points, degree=3, method='chord')

    # Create the spline entity
    spline = msp.add_spline(dxfattribs={'layer': 'Cycloidal_Ring_Gear', 'color': 5})
    spline.apply_construction_tool(spline_data)

    # Add Separator circles
    sep_width = 2.2 * ecc
    sep_middle_radius = wave_gen_r + roll_r
    sep_outer_radius = sep_middle_radius + sep_width / 2
    sep_inner_radius = sep_middle_radius - sep_width / 2
    msp.add_circle((0, 0), sep_outer_radius, dxfattribs={'layer': 'Separator_Outer', 'color': 3})
    msp.add_circle((0, 0), sep_inner_radius, dxfattribs={'layer': 'Separator_Inner', 'color': 3})

    # Add Rollers
    theta = np.linspace(0, 2 * np.pi, rollers_num, endpoint=False)
    for t in theta:
        s_rol = np.sqrt((roll_r + wave_gen_r) ** 2 - (ecc * np.sin(cav_num * t)) ** 2)
        l_rol = ecc * np.cos(cav_num * t) + s_rol
        x = l_rol * np.sin(t)
        y = l_rol * np.cos(t)
        msp.add_circle((x, y), roll_r, dxfattribs={'layer': 'Rollers', 'color': 2})

    # Add Wave Generator
    msp.add_circle((0, ecc), wave_gen_r, dxfattribs={'layer': 'Wave_Generator', 'color': 1})

    # Add Input Shaft Hole
    msp.add_circle((0, 0), input_shaft_diameter / 2, dxfattribs={'layer': 'Input_Shaft', 'color': 6})

    # Save to BytesIO
    dxf_bytes = io.BytesIO()
    doc.write(dxf_bytes)
    dxf_bytes.seek(0)

    return dxf_bytes

# Generate preview image
def generate_preview(ecc, roll_r, wave_gen_r, rollers_num, cav_num, cy_r, input_shaft_diameter):
    # Create a plot
    fig, ax = plt.subplots(figsize=(6, 6), facecolor='#F9F7F4')
    ax.set_facecolor('#F9F7F4')
    ax.set_aspect('equal')
    ax.set_xlim(-cy_r - 2, cy_r + 2)
    ax.set_ylim(-cy_r - 2, cy_r + 2)
    ax.set_title("Cycloidal Gear Preview", fontsize=14, fontweight='bold', color='#333')

    # Plot Cycloidal Ring Gear
    cycloid = cycloid_points(ecc, roll_r, wave_gen_r, rollers_num, cav_num)
    ax.plot(cycloid[:, 0], cycloid[:, 1], label='Cycloidal Ring Gear', color='#2C5F8D', linewidth=2)

    # Plot Separator
    sep_width = 2.2 * ecc
    sep_middle_radius = wave_gen_r + roll_r
    sep_outer_radius = sep_middle_radius + sep_width / 2
    sep_inner_radius = sep_middle_radius - sep_width / 2
    draw_circle(ax, (0, 0), sep_outer_radius, fill=False, linestyle='--', color='#5C9447', label='Separator', linewidth=1.5)
    draw_circle(ax, (0, 0), sep_inner_radius, fill=False, linestyle='--', color='#5C9447', linewidth=1.5)

    # Plot Rollers
    plot_rols(ax, cy_r, wave_gen_r, roll_r, ecc, rollers_num, rollers_num + 1)

    # Plot Wave Generator Diameter with Eccentricity
    draw_circle(ax, (0, ecc), wave_gen_r, fill=False, linestyle='-.', color='#D9534F', label='Wave Generator', linewidth=1.5)

    # Plot Input Shaft Hole
    draw_circle(ax, (0, 0), input_shaft_diameter / 2, fill=False, color='#8E44AD', linestyle=':', label='Input Shaft', linewidth=1.5)

    # Show legend
    ax.legend(loc='upper right', fontsize=9, framealpha=0.9)
    ax.grid(True, alpha=0.2)

    # Convert to base64
    img_bytes = io.BytesIO()
    plt.savefig(img_bytes, format='png', dpi=150, bbox_inches='tight', facecolor='#F9F7F4')
    img_bytes.seek(0)
    img_base64 = base64.b64encode(img_bytes.read()).decode('utf-8')
    plt.close(fig)

    return img_base64

@app.route('/api/generate', methods=['POST'])
def generate_gear():
    try:
        data = request.json

        # Get parameters from request
        roller_diameter = float(data.get('roller_diameter', 0.8))
        rollers_num = int(data.get('rollers_num', 8))
        cycloid_outer_diameter = float(data.get('cycloid_outer_diameter', 8))
        input_shaft_diameter = float(data.get('input_shaft_diameter', 1))
        cycloidal_modulus = float(data.get('cycloidal_modulus', 0.2))

        # Validate inputs
        if roller_diameter <= 0 or rollers_num < 3 or cycloid_outer_diameter <= 0 or input_shaft_diameter <= 0 or cycloidal_modulus <= 0:
            return jsonify({'error': 'All parameters must be positive numbers. Rollers must be at least 3.'}), 400

        # Calculate derived parameters
        ecc = cycloidal_modulus * roller_diameter
        cav_num = rollers_num + 1
        cy_r_min = (1.1 * roller_diameter) / np.sin(np.pi / cav_num) + 2 * ecc
        cy_r = max(cycloid_outer_diameter / 2, cy_r_min)
        wave_gen_r = (cy_r - 2 * ecc) - roller_diameter
        roll_r = roller_diameter / 2

        # Check for valid geometry
        if wave_gen_r <= 0:
            return jsonify({'error': 'Invalid geometry: wave generator radius is negative. Try increasing outer diameter or decreasing modulus.'}), 400

        # Generate preview
        preview_base64 = generate_preview(ecc, roll_r, wave_gen_r, rollers_num, cav_num, cy_r, input_shaft_diameter)

        return jsonify({
            'success': True,
            'preview': f'data:image/png;base64,{preview_base64}',
            'calculated_params': {
                'eccentricity': round(ecc, 4),
                'cavity_number': cav_num,
                'actual_outer_diameter': round(cy_r * 2, 4),
                'wave_generator_radius': round(wave_gen_r, 4)
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download', methods=['POST'])
def download_dxf():
    try:
        data = request.json

        # Get parameters from request
        roller_diameter = float(data.get('roller_diameter', 0.8))
        rollers_num = int(data.get('rollers_num', 8))
        cycloid_outer_diameter = float(data.get('cycloid_outer_diameter', 8))
        input_shaft_diameter = float(data.get('input_shaft_diameter', 1))
        cycloidal_modulus = float(data.get('cycloidal_modulus', 0.2))

        # Calculate derived parameters
        ecc = cycloidal_modulus * roller_diameter
        cav_num = rollers_num + 1
        cy_r_min = (1.1 * roller_diameter) / np.sin(np.pi / cav_num) + 2 * ecc
        cy_r = max(cycloid_outer_diameter / 2, cy_r_min)
        wave_gen_r = (cy_r - 2 * ecc) - roller_diameter
        roll_r = roller_diameter / 2

        # Create DXF
        dxf_bytes = create_dxf(ecc, roll_r, wave_gen_r, rollers_num, cav_num, cy_r, input_shaft_diameter)

        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'cycloidal_gear_{timestamp}.dxf'

        return send_file(
            dxf_bytes,
            mimetype='application/dxf',
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
