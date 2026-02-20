const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const config = require('./config');
const cleanup = require('./cleanup');

const PORT = 9999;
let server = null;

// --- Helpers ---

function parseIssue(mdPath) {
  const content = fs.readFileSync(mdPath, 'utf-8');
  const basename = path.basename(mdPath, '.md');
  const dir = path.dirname(mdPath);
  const pngPath = path.join(dir, `${basename}.png`);
  const hasPng = fs.existsSync(pngPath);

  const title = content.match(/^#\s+(.+)/m)?.[1] || 'Untitled';
  const status = content.match(/\*\*Status:\*\*\s*(\w+)/)?.[1]?.toLowerCase() || 'open';
  const captured = content.match(/\*\*Captured:\*\*\s*(.+)/)?.[1] || null;
  const tags = content.match(/\*\*Tags:\*\*\s*(.+)/)?.[1]?.split(',').map(t => t.trim()) || [];
  const detailsMatch = content.match(/## Details\n\n([\s\S]*?)(?=\n---|\n##|$)/);
  const details = detailsMatch ? detailsMatch[1].trim() : null;

  return {
    id: basename,
    title,
    status,
    captured,
    tags,
    details,
    mdPath,
    pngPath: hasPng ? pngPath : null,
    hasScreenshot: hasPng,
  };
}

function getIssuesForProject(projectPath, statusFilter) {
  const snagDir = path.join(projectPath, '.snag');
  if (!fs.existsSync(snagDir)) return [];

  const mdFiles = fs.readdirSync(snagDir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse(); // newest first

  const issues = mdFiles.map(f => parseIssue(path.join(snagDir, f)));

  if (statusFilter) {
    return issues.filter(i => i.status === statusFilter);
  }
  return issues;
}

// --- Router ---

function route(req, res) {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const query = parsed.query;

  // CORS for local dev tools
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API routes ---

  if (pathname === '/api/projects' && req.method === 'GET') {
    const cfg = config.read();
    const projects = cfg.projects.map(p => ({
      path: p,
      name: path.basename(p),
      stats: cleanup.getProjectStats(p),
    }));
    return json(res, projects);
  }

  if (pathname === '/api/issues' && req.method === 'GET') {
    const projectPath = query.project;
    if (!projectPath) return json(res, { error: 'Missing ?project= parameter' }, 400);
    const issues = getIssuesForProject(projectPath, query.status);
    return json(res, issues);
  }

  if (pathname === '/api/issues/next' && req.method === 'GET') {
    const cfg = config.read();
    const projects = query.project ? [query.project] : cfg.projects;

    for (const p of projects) {
      const open = getIssuesForProject(p, 'open');
      if (open.length) {
        // Oldest open issue (last in the reversed array)
        const next = open[open.length - 1];
        next.project = p;
        next.projectName = path.basename(p);
        return json(res, next);
      }
    }
    return json(res, null);
  }

  const issueMatch = pathname.match(/^\/api\/issues\/([^/]+)$/);
  if (issueMatch && req.method === 'GET') {
    const id = decodeURIComponent(issueMatch[1]);
    const projectPath = query.project;
    if (!projectPath) return json(res, { error: 'Missing ?project= parameter' }, 400);

    const mdPath = path.join(projectPath, '.snag', `${id}.md`);
    if (!fs.existsSync(mdPath)) return json(res, { error: 'Not found' }, 404);

    const issue = parseIssue(mdPath);
    issue.content = fs.readFileSync(mdPath, 'utf-8');
    return json(res, issue);
  }

  if (issueMatch && req.method === 'PATCH') {
    const id = decodeURIComponent(issueMatch[1]);
    return readBody(req, (body) => {
      try {
        const { project, status: newStatus } = JSON.parse(body);
        if (!project) return json(res, { error: 'Missing project in body' }, 400);

        const mdPath = path.join(project, '.snag', `${id}.md`);
        if (!fs.existsSync(mdPath)) return json(res, { error: 'Not found' }, 404);

        let content = fs.readFileSync(mdPath, 'utf-8');
        if (newStatus) {
          content = content.replace(
            /\*\*Status:\*\*\s*\w+/,
            `**Status:** ${newStatus}`
          );
          fs.writeFileSync(mdPath, content, 'utf-8');
        }

        return json(res, { success: true, id, status: newStatus });
      } catch (e) {
        return json(res, { error: e.message }, 400);
      }
    });
  }

  // --- Screenshot serving ---
  // GET /screenshots?project=...&file=...
  if (pathname === '/screenshots' && req.method === 'GET') {
    const projectPath = query.project;
    const file = query.file;
    if (!projectPath || !file) return json(res, { error: 'Missing params' }, 400);

    // Sanitize filename — no path traversal
    const safe = path.basename(file);
    const filePath = path.join(projectPath, '.snag', safe);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(safe).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : ext === '.md' ? 'text/markdown' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // --- Web UI ---
  if (pathname === '/' || pathname.startsWith('/web')) {
    return serveWebUI(pathname, res);
  }

  res.writeHead(404);
  res.end('Not found');
}

function serveWebUI(pathname, res) {
  const webDir = path.join(__dirname, '..', 'web');
  let filePath;

  if (pathname === '/' || pathname === '/web') {
    filePath = path.join(webDir, 'index.html');
  } else {
    const relative = pathname.replace(/^\/web\/?/, '');
    filePath = path.join(webDir, relative);
  }

  // Prevent path traversal
  if (!filePath.startsWith(webDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  };

  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
}

// --- Utility ---

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

function readBody(req, cb) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => cb(body));
}

// --- Lifecycle ---

function start() {
  if (server) return;
  server = http.createServer(route);
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Snag server running at http://127.0.0.1:${PORT}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Snag: port ${PORT} in use, server not started`);
    } else {
      console.error('Snag server error:', err);
    }
  });
}

function stop() {
  if (server) {
    server.close();
    server = null;
  }
}

module.exports = { start, stop, PORT };
