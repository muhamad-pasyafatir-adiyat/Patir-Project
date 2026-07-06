from PIL import Image

def process_logo(img_path):
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    
    # Find bounding box of the circular logo
    # The logo is a white circle with blue text on a dark gray bg.
    # We look for pixels that are not dark gray (e.g., r+g+b > 250)
    left = width
    right = 0
    top = height
    bottom = 0
    
    pixels = img.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if (r + g + b) > 150: # Not the dark background
                if x < left: left = x
                if x > right: right = x
                if y < top: top = y
                if y > bottom: bottom = y

    # Add a small margin
    margin = 5
    left = max(0, left - margin)
    top = max(0, top - margin)
    right = min(width, right + margin)
    bottom = min(height, bottom + margin)
    
    # Crop it
    cropped = img.crop((left, top, right, bottom))
    
    # It will auto-crop gracefully. We save as PNG to ensure quality.
    out_path = img_path.replace(".jpeg", ".png")
    cropped.save(out_path, "PNG")
    print("Done")

if __name__ == "__main__":
    process_logo("public/img/logo.jpeg")
