import matplotlib.pyplot as plt
import numpy as np
import ezdxf

from ezdxf.math import Vec3, global_bspline_interpolation

# Parameters (You can adjust these as needed)
roller_diameter = 1  # mm
rollers_num = 10
cycloid_outer_diameter = 8 # mm (will be ignored if lower then minimum)
input_shaft_diameter = 1  # mm
cycloidal_modulus = 0.2

# Function to plot cycloidal points
def cycloid_points(ecc, roll_r, wave_gen_r, rollers_num, cav_num, res = 500):
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

# export to DXF
def export_to_dxf(filename, ecc, roll_r, wave_gen_r, rollers_num, cav_num, cy_r, input_shaft_diameter):
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

    # Save the DXF file
    doc.saveas(filename)
    print(f"DXF file saved as: {filename}")

# Calculate some additional parameters
ecc = cycloidal_modulus * roller_diameter  # Eccentricity (Cycloidal Modulus * Roller Diameter)
cav_num = rollers_num + 1 # Number of Cycloids (Rollers num + 1)
cy_r_min = (1.1 * roller_diameter) / np.sin(np.pi / cav_num) + 2 * ecc # Minimum outer Cycloid radius
cy_r = max(cycloid_outer_diameter / 2, cy_r_min)  # Outer Cycloid Radius
wave_gen_r = (cy_r - 2 * ecc) - roller_diameter  # Wave Generator Radius
roll_r = roller_diameter / 2  # Roller Radius

# Export to DXF
export_to_dxf('cycloidal_gear.dxf', ecc, roll_r, wave_gen_r, rollers_num, cav_num, cy_r, input_shaft_diameter)

# Create a plot
fig, ax = plt.subplots(figsize=(8, 8))
ax.set_aspect('equal')
ax.set_xlim(-cy_r - 10, cy_r + 10)
ax.set_ylim(-cy_r - 10, cy_r + 10)
ax.set_title("Wave Gear with Rollers, Separator, and Wave Generator")

# Plot Cycloidal Ring Gear
cycloid = cycloid_points(ecc, roll_r, wave_gen_r, rollers_num, cav_num)
ax.plot(cycloid[:, 0], cycloid[:, 1], label='Cycloidal Ring Gear', color='blue')

# Plot Separator
sep_width = 2.2 * ecc
sep_middle_radius = wave_gen_r + roll_r
sep_outer_radius = sep_middle_radius + sep_width / 2
sep_inner_radius = sep_middle_radius - sep_width / 2
draw_circle(ax, (0, 0), sep_outer_radius, fill=False, linestyle='--', color='green', label='Separator')
draw_circle(ax, (0, 0), sep_inner_radius, fill=False, linestyle='--', color='green')

# Plot Rollers
plot_rols(ax, cy_r, wave_gen_r, roll_r, ecc, rollers_num, rollers_num + 1)

# Plot Wave Generator Diameter with Eccentricity
draw_circle(ax, (0, ecc), wave_gen_r, fill=False, linestyle='-.', color='red', label='Wave Generator')

# Plot Input Shaft Hole
draw_circle(ax, (0, 0), input_shaft_diameter / 2, fill=False, color='purple', linestyle=':', label='Input Shaft')

# Show legend
ax.legend(loc='upper right')

# Display the plot
plt.show()