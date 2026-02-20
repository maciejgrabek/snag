/**
 * Generate a macOS .icns app icon from raw pixel data.
 * Run via: npx electron scripts/generate-app-icon.js
 *
 * Creates a 1024x1024 PNG, then uses macOS `iconutil` to produce .icns.
 */
const { app, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

app.dock?.hide();

app.whenReady().then(() => {
  const assetsDir = path.join(__dirname, '..', 'assets');
  const iconsetDir = path.join(assetsDir, 'AppIcon.iconset');
  fs.mkdirSync(iconsetDir, { recursive: true });

  function renderIcon(size) {
    const buffer = Buffer.alloc(size * size * 4, 0);
    const center = size / 2;
    const radius = size * 0.32;
    const thickness = Math.max(1, Math.round(size * 0.045));
    const bgRadius = size * 0.44;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * size + x) * 4;

        // Rounded square background
        const cornerR = size * 0.22;
        const ax = Math.abs(dx);
        const ay = Math.abs(dy);
        const half = bgRadius;
        let inBg = false;
        if (ax <= half && ay <= half) {
          // Check rounded corners
          if (ax > half - cornerR && ay > half - cornerR) {
            const cx = ax - (half - cornerR);
            const cy = ay - (half - cornerR);
            inBg = Math.sqrt(cx * cx + cy * cy) <= cornerR;
          } else {
            inBg = true;
          }
        }

        if (!inBg) continue;

        // Background gradient — dark blue-gray
        const t = (y / size);
        buffer[idx]     = Math.round(30 + t * 15);   // R
        buffer[idx + 1] = Math.round(30 + t * 15);   // G
        buffer[idx + 2] = Math.round(38 + t * 18);   // B
        buffer[idx + 3] = 255;

        // Foreground — white crosshair/viewfinder
        let isFg = false;

        // Outer ring
        if (Math.abs(dist - radius) <= thickness) {
          isFg = true;
        }

        // Crosshair ticks (outside ring, 4 directions)
        const tickInner = radius + thickness * 1.5;
        const tickOuter = radius + thickness * 5;

        if (Math.abs(dx) <= thickness * 0.7 && dy < -tickInner && dy > -tickOuter) isFg = true;
        if (Math.abs(dx) <= thickness * 0.7 && dy > tickInner && dy < tickOuter) isFg = true;
        if (Math.abs(dy) <= thickness * 0.7 && dx < -tickInner && dx > -tickOuter) isFg = true;
        if (Math.abs(dy) <= thickness * 0.7 && dx > tickInner && dx < tickOuter) isFg = true;

        // Center dot
        if (dist <= thickness * 1.2) {
          isFg = true;
        }

        if (isFg) {
          buffer[idx]     = 255;
          buffer[idx + 1] = 255;
          buffer[idx + 2] = 255;
          buffer[idx + 3] = 255;
        }
      }
    }

    return nativeImage.createFromBuffer(buffer, { width: size, height: size });
  }

  // iconutil requires specific sizes
  const sizes = [16, 32, 64, 128, 256, 512, 1024];
  const names = {
    16:   ['icon_16x16.png'],
    32:   ['icon_16x16@2x.png', 'icon_32x32.png'],
    64:   ['icon_32x32@2x.png'],
    128:  ['icon_128x128.png'],
    256:  ['icon_128x128@2x.png', 'icon_256x256.png'],
    512:  ['icon_256x256@2x.png', 'icon_512x512.png'],
    1024: ['icon_512x512@2x.png'],
  };

  for (const size of sizes) {
    const img = renderIcon(size);
    const png = img.toPNG();
    for (const name of names[size]) {
      fs.writeFileSync(path.join(iconsetDir, name), png);
    }
  }

  // Convert to .icns
  const icnsPath = path.join(assetsDir, 'app-icon.icns');
  execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`);

  // Clean up iconset
  fs.rmSync(iconsetDir, { recursive: true });

  console.log(`App icon generated: ${icnsPath}`);
  app.quit();
});
