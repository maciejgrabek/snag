const fs = require('fs');
const path = require('path');
const { clipboard, nativeImage } = require('electron');

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

function getClipboardImage() {
  const img = clipboard.readImage();
  if (img.isEmpty()) return null;

  const full = img.toPNG();
  const size = img.getSize();

  // Resize for preview — cap at 800px wide
  let preview;
  if (size.width > 800) {
    const ratio = 800 / size.width;
    const resized = img.resize({
      width: 800,
      height: Math.round(size.height * ratio),
    });
    preview = resized.toPNG();
  } else {
    preview = full;
  }

  return {
    previewBase64: preview.toString('base64'),
    fullBuffer: full,
    width: size.width,
    height: size.height,
  };
}

function saveCaptureToProject({ projectPath, description, details, tags, imageBuffer }) {
  const snagDir = path.join(projectPath, '.snag');
  fs.mkdirSync(snagDir, { recursive: true });

  const ts = timestamp();
  const slug = description
    .slice(0, 40)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const baseName = `${ts}${slug ? '-' + slug : ''}`;

  const pngPath = imageBuffer ? path.join(snagDir, `${baseName}.png`) : null;
  const mdPath = path.join(snagDir, `${baseName}.md`);

  // Write screenshot
  if (imageBuffer) {
    fs.writeFileSync(pngPath, imageBuffer);
  }

  // Build markdown
  const lines = [
    `# ${description || 'Untitled capture'}`,
    '',
    `**Captured:** ${new Date().toISOString()}`,
    `**Status:** open`,
  ];
  if (tags && tags.length) {
    lines.push(`**Tags:** ${tags.join(', ')}`);
  }
  if (pngPath) {
    lines.push('', `![screenshot](${baseName}.png)`);
  }
  if (details) {
    lines.push('', '## Details', '', details);
  }
  lines.push('', '---', '', '');

  fs.writeFileSync(mdPath, lines.join('\n'), 'utf-8');

  return { mdPath, pngPath, baseName };
}

module.exports = { getClipboardImage, saveCaptureToProject };
