/**
 * Generate minimal tray icon PNGs using Electron's nativeImage.
 * Run via: npx electron scripts/generate-icons.js
 *
 * Creates 16x16 and 32x32 template icons (black silhouette for macOS template image),
 * plus colored active variants for flash feedback.
 */
const { app, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

app.dock?.hide();

app.whenReady().then(() => {
  const assetsDir = path.join(__dirname, '..', 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  // Draw a simple "camera/capture" icon — a filled rounded rect with a circle
  // Using raw pixel manipulation on nativeImage via createFromBuffer

  function createIcon(size, color) {
    // Create a simple PNG manually using minimal PNG encoding
    // For simplicity, we'll create a bitmap and use nativeImage
    const { createCanvas } = tryCanvas();
    if (createCanvas) {
      return createCanvasIcon(createCanvas, size, color);
    }
    // Fallback: create a simple solid square icon
    return createSimpleIcon(size, color);
  }

  function tryCanvas() {
    // We don't have canvas — use raw buffer approach
    return { createCanvas: null };
  }

  function createSimpleIcon(size, color) {
    // Create a minimal valid PNG with a simple icon shape
    // Using raw RGBA buffer -> nativeImage
    const buffer = Buffer.alloc(size * size * 4, 0);
    const [r, g, b] = color;

    // Draw a viewfinder/crosshair shape — represents "capture"
    const center = Math.floor(size / 2);
    const radius = Math.floor(size * 0.35);
    const thickness = Math.max(1, Math.floor(size / 16));

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * size + x) * 4;

        let alpha = 0;

        // Outer ring
        if (Math.abs(dist - radius) <= thickness) {
          alpha = 255;
        }

        // Crosshair lines (only outside the ring)
        if (dist > radius + thickness) {
          if (Math.abs(dx) <= thickness / 2 && Math.abs(dy) <= size * 0.15) {
            alpha = 255;
          }
          if (Math.abs(dy) <= thickness / 2 && Math.abs(dx) <= size * 0.15) {
            alpha = 255;
          }
        }

        // Small center dot
        if (dist <= thickness) {
          alpha = 255;
        }

        buffer[idx] = r;
        buffer[idx + 1] = g;
        buffer[idx + 2] = b;
        buffer[idx + 3] = alpha;
      }
    }

    return nativeImage.createFromBuffer(buffer, {
      width: size,
      height: size,
    });
  }

  // Template icons (black — macOS will adapt to light/dark)
  const icon16 = createIcon(16, [0, 0, 0]);
  const icon32 = createIcon(32, [0, 0, 0]);

  // Active icons (blue accent)
  const active16 = createIcon(16, [0, 122, 255]);
  const active32 = createIcon(32, [0, 122, 255]);

  fs.writeFileSync(path.join(assetsDir, 'IconTemplate.png'), icon16.toPNG());
  fs.writeFileSync(path.join(assetsDir, 'IconTemplate@2x.png'), icon32.toPNG());
  fs.writeFileSync(path.join(assetsDir, 'icon-active.png'), active16.toPNG());
  fs.writeFileSync(path.join(assetsDir, 'icon-active@2x.png'), active32.toPNG());

  console.log('Icons generated in assets/');
  app.quit();
});
