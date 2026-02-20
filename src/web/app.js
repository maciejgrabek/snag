const API = '';
const content = document.getElementById('content');
const breadcrumb = document.getElementById('breadcrumb');

// --- State ---

let currentView = 'projects';
let currentProject = null;
let currentFilter = null; // null = all, 'open', 'resolved'

// --- Router ---

function navigate(view, project, issueId) {
  currentView = view;
  currentProject = project || null;

  if (view === 'projects') {
    renderProjects();
  } else if (view === 'issues') {
    renderIssues(project);
  } else if (view === 'issue') {
    renderIssueDetail(project, issueId);
  }

  updateBreadcrumb(view, project, issueId);
}

function updateBreadcrumb(view, project, issueId) {
  if (view === 'projects') {
    breadcrumb.innerHTML = '';
    return;
  }

  const projectName = project ? project.split('/').pop() : '';
  let html = `<span class="sep">/</span> <a href="#" data-nav="projects">Projects</a>`;

  if (view === 'issues' || view === 'issue') {
    html += ` <span class="sep">/</span> `;
    if (view === 'issue') {
      html += `<a href="#" data-nav="issues" data-project="${esc(project)}">${esc(projectName)}</a>`;
      html += ` <span class="sep">/</span> ${esc(issueId)}`;
    } else {
      html += esc(projectName);
    }
  }

  breadcrumb.innerHTML = html;

  breadcrumb.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const nav = el.dataset.nav;
      if (nav === 'projects') navigate('projects');
      else if (nav === 'issues') navigate('issues', el.dataset.project);
    });
  });
}

// --- Views ---

async function renderProjects() {
  const projects = await api('/api/projects');

  if (!projects.length) {
    content.innerHTML = `
      <div class="empty">
        <p>No projects yet.</p>
        <p>Use <code>Cmd+Shift+X</code> to capture your first snag.</p>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div class="project-grid">
      ${projects.map(p => `
        <a class="project-card" href="#" data-project="${esc(p.path)}">
          <div>
            <div class="project-name">${esc(p.name)}</div>
            <div class="project-path">${esc(p.path)}</div>
          </div>
          <div class="project-stats">
            <span class="stat-badge"><span class="dot open"></span> ${p.stats.open} open</span>
            <span class="stat-badge"><span class="dot resolved"></span> ${p.stats.resolved} resolved</span>
          </div>
        </a>
      `).join('')}
    </div>
  `;

  content.querySelectorAll('.project-card').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigate('issues', el.dataset.project);
    });
  });
}

async function renderIssues(project) {
  const statusParam = currentFilter ? `&status=${currentFilter}` : '';
  const issues = await api(`/api/issues?project=${enc(project)}${statusParam}`);

  const filterHtml = `
    <div class="filter-bar">
      <button class="filter-btn ${currentFilter === null ? 'active' : ''}" data-filter="">All</button>
      <button class="filter-btn ${currentFilter === 'open' ? 'active' : ''}" data-filter="open">Open</button>
      <button class="filter-btn ${currentFilter === 'resolved' ? 'active' : ''}" data-filter="resolved">Resolved</button>
    </div>
  `;

  if (!issues.length) {
    content.innerHTML = `
      <div class="issues-header">
        <h2>${esc(project.split('/').pop())}</h2>
        ${filterHtml}
      </div>
      <div class="empty">
        <p>${currentFilter ? `No ${currentFilter} issues.` : 'No issues captured yet.'}</p>
      </div>
    `;
    bindFilters(project);
    return;
  }

  content.innerHTML = `
    <div class="issues-header">
      <h2>${esc(project.split('/').pop())} <span style="color: var(--text-secondary); font-weight: 400; font-size: 14px;">${issues.length} issue${issues.length === 1 ? '' : 's'}</span></h2>
      ${filterHtml}
    </div>
    <div class="issue-list">
      ${issues.map(i => `
        <a class="issue-row" href="#" data-issue="${esc(i.id)}">
          <span class="issue-status-dot ${esc(i.status)}"></span>
          <div class="issue-info">
            <div class="issue-title">${esc(i.title)}</div>
            <div class="issue-meta">
              <span>${esc(i.id)}</span>
              ${i.tags.length ? `<span>${i.tags.map(t => esc(t)).join(', ')}</span>` : ''}
            </div>
          </div>
          ${i.hasScreenshot ? `<img class="issue-thumb" src="/screenshots?project=${enc(project)}&file=${enc(i.id + '.png')}" alt="">` : ''}
        </a>
      `).join('')}
    </div>
  `;

  content.querySelectorAll('.issue-row').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigate('issue', project, el.dataset.issue);
    });
  });

  bindFilters(project);
}

function bindFilters(project) {
  content.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter || null;
      renderIssues(project);
    });
  });
}

async function renderIssueDetail(project, issueId) {
  const issue = await api(`/api/issues/${enc(issueId)}?project=${enc(project)}`);

  if (!issue || issue.error) {
    content.innerHTML = `<div class="empty"><p>Issue not found.</p></div>`;
    return;
  }

  const toggleLabel = issue.status === 'open' ? 'Mark Resolved' : 'Reopen';
  const toggleStatus = issue.status === 'open' ? 'resolved' : 'open';

  content.innerHTML = `
    <div class="issue-detail">
      <div class="issue-detail-header">
        <h2>${esc(issue.title)}</h2>
        <button class="status-toggle" data-new-status="${toggleStatus}">${toggleLabel}</button>
      </div>

      ${issue.tags.length ? `
        <div class="issue-tags">
          ${issue.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}
        </div>
      ` : ''}

      ${issue.hasScreenshot ? `
        <img class="issue-screenshot" src="/screenshots?project=${enc(project)}&file=${enc(issueId + '.png')}" alt="Screenshot">
      ` : ''}

      <div class="issue-file-paths">
        <div><strong>Markdown:</strong> ${esc(issue.mdPath)}</div>
        ${issue.pngPath ? `<div><strong>Screenshot:</strong> ${esc(issue.pngPath)}</div>` : ''}
      </div>
    </div>
  `;

  content.querySelector('.status-toggle')?.addEventListener('click', async (e) => {
    const newStatus = e.target.dataset.newStatus;
    await fetch(`/api/issues/${enc(issueId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, status: newStatus }),
    });
    navigate('issue', project, issueId);
  });
}

// --- Helpers ---

async function api(path) {
  const res = await fetch(API + path);
  return res.json();
}

function enc(s) {
  return encodeURIComponent(s);
}

function esc(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// --- Init ---
navigate('projects');
