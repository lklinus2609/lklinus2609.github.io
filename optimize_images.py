import os
from PIL import Image

IMAGE_DIR = r"C:\Users\linus\Desktop\Portfolio\images"
MAX_SIZE = (1920, 1080)

def optimize_images():
    print(f"Scanning {IMAGE_DIR}...")
    for filename in os.listdir(IMAGE_DIR):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            filepath = os.path.join(IMAGE_DIR, filename)
            try:
                with Image.open(filepath) as img:
                    # Resize if too large
                    if img.width > MAX_SIZE[0] or img.height > MAX_SIZE[1]:
                        img.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
                        print(f"Resized {filename}")

                    # Convert to WebP
                    webp_filename = os.path.splitext(filename)[0] + ".webp"
                    webp_filepath = os.path.join(IMAGE_DIR, webp_filename)
                    
                    # Save as WebP
                    img.save(webp_filepath, "WEBP", quality=85)
                    print(f"Converted {filename} to {webp_filename}")
                    
            except Exception as e:
                print(f"Failed to process {filename}: {e}")

if __name__ == "__main__":
    optimize_images()
