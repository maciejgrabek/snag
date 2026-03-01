const projectList = document.getElementById('project-list');
const emptyState = document.getElementById('empty-state');
const cleanupBtn = document.getElementById('cleanup-btn');
const footerStatus = document.getElementById('footer-status');

async function loadDashboard() {
  const data = await window.snag.getDashboardData();

  if (!data.projects.length) {
    emptyState.style.display = 'block';
    projectList.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  projectList.style.display = 'flex';
  projectList.innerHTML = '';

  for (const project of data.projects) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <div class="project-info">
        <span class="project-name">${escapeHtml(project.name)}</span>
        <span class="project-path">${escapeHtml(project.path)}</span>
      </div>
      <div class="project-right">
        <div class="project-stats">
          <span class="stat">
            <span class="stat-dot open"></span>
            ${project.stats.open} open
          </span>
          <span class="stat">
            <span class="stat-dot resolved"></span>
            ${project.stats.resolved} resolved
          </span>
        </div>
        <div class="project-actions">
          <button class="action-btn resolve-all-btn" ${project.stats.open === 0 ? 'disabled' : ''}>Resolve All</button>
          <button class="action-btn clean-btn" ${project.stats.resolved === 0 ? 'disabled' : ''}>Clean</button>
        </div>
      </div>
    `;

    card.querySelector('.resolve-all-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = e.target;
      btn.disabled = true;
      btn.textContent = 'Resolving...';
      const result = await window.snag.resolveAll(project.path);
      footerStatus.textContent = result.updated
        ? `Resolved ${result.updated} item${result.updated === 1 ? '' : 's'} in ${escapeHtml(project.name)}`
        : 'Nothing to resolve';
      loadDashboard();
    });

    card.querySelector('.clean-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = e.target;
      btn.disabled = true;
      btn.textContent = 'Cleaning...';
      const result = await window.snag.cleanProject(project.path);
      footerStatus.textContent = result.deleted
        ? `Deleted ${result.deleted} resolved item${result.deleted === 1 ? '' : 's'} from ${escapeHtml(project.name)}`
        : 'Nothing to clean';
      loadDashboard();
    });

    projectList.appendChild(card);
  }
}

cleanupBtn.addEventListener('click', async () => {
  cleanupBtn.disabled = true;
  footerStatus.textContent = 'Running cleanup...';

  const results = await window.snag.runCleanup();

  let totalDeleted = 0;
  for (const key of Object.keys(results)) {
    if (results[key].deleted) totalDeleted += results[key].deleted;
  }

  footerStatus.textContent = totalDeleted
    ? `Cleaned up ${totalDeleted} item${totalDeleted === 1 ? '' : 's'}`
    : 'Nothing to clean up';
  cleanupBtn.disabled = false;

  // Refresh the list
  loadDashboard();
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Initial load
loadDashboard();
