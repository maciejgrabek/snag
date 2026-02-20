const fs = require('fs');
const path = require('path');
const config = require('./config');

let cleanupTimer = null;

function parseStatus(mdContent) {
  const match = mdContent.match(/\*\*Status:\*\*\s*(\w+)/);
  return match ? match[1].toLowerCase() : 'open';
}

function sweepProject(projectPath, opts = {}) {
  const { retentionDays = 30, autoDeleteResolved = true } = opts;
  const snagDir = path.join(projectPath, '.snag');
  if (!fs.existsSync(snagDir)) return { deleted: 0, skipped: 0 };

  const now = Date.now();
  const cutoff = retentionDays * 24 * 60 * 60 * 1000;
  let deleted = 0;
  let skipped = 0;

  const files = fs.readdirSync(snagDir);
  const mdFiles = files.filter((f) => f.endsWith('.md'));

  for (const mdFile of mdFiles) {
    const mdPath = path.join(snagDir, mdFile);
    const stat = fs.statSync(mdPath);
    const age = now - stat.mtimeMs;

    const content = fs.readFileSync(mdPath, 'utf-8');
    const status = parseStatus(content);

    const shouldDelete =
      (autoDeleteResolved && status === 'resolved' && age > cutoff) ||
      age > cutoff * 2; // Hard cutoff at 2x retention

    if (shouldDelete) {
      // Delete .md and matching .png
      fs.unlinkSync(mdPath);
      const pngFile = mdFile.replace(/\.md$/, '.png');
      const pngPath = path.join(snagDir, pngFile);
      if (fs.existsSync(pngPath)) fs.unlinkSync(pngPath);
      deleted++;
    } else {
      skipped++;
    }
  }

  return { deleted, skipped };
}

function sweepAll() {
  const cfg = config.read();
  const results = {};
  for (const projectPath of cfg.projects) {
    try {
      results[projectPath] = sweepProject(projectPath, cfg.cleanup);
    } catch {
      results[projectPath] = { error: true };
    }
  }
  return results;
}

function startBackground() {
  stopBackground();
  const cfg = config.read();
  if (!cfg.cleanup.enabled) return;

  const minutes = cfg.cleanup.intervalMinutes;
  if (!minutes || minutes <= 0) return;

  const interval = minutes * 60 * 1000;
  cleanupTimer = setInterval(() => sweepAll(), interval);
}

function stopBackground() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

function getProjectStats(projectPath) {
  const snagDir = path.join(projectPath, '.snag');
  if (!fs.existsSync(snagDir)) return { total: 0, open: 0, resolved: 0 };

  const files = fs.readdirSync(snagDir).filter((f) => f.endsWith('.md'));
  let open = 0;
  let resolved = 0;

  for (const f of files) {
    const content = fs.readFileSync(path.join(snagDir, f), 'utf-8');
    const status = parseStatus(content);
    if (status === 'resolved') resolved++;
    else open++;
  }

  return { total: files.length, open, resolved };
}

module.exports = {
  sweepProject,
  sweepAll,
  startBackground,
  stopBackground,
  getProjectStats,
};
