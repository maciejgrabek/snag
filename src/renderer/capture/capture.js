const form = document.getElementById('capture-form');
const descriptionInput = document.getElementById('description');
const detailsInput = document.getElementById('details');
const tagsInput = document.getElementById('tags');
const projectSelect = document.getElementById('project-select');
const browseBtn = document.getElementById('browse-btn');
const previewImage = document.getElementById('preview-image');
const previewPlaceholder = document.getElementById('preview-placeholder');
const statusBar = document.getElementById('status-bar');

const closeBtn = document.querySelector('.close-btn');
const typeBtns = document.querySelectorAll('.type-btn');

let hasImage = false;
let selectedType = 'bug';

// --- Init ---

async function refreshForm() {
  // Load clipboard image
  const image = await window.snag.getClipboardImage();
  if (image) {
    previewImage.src = `data:image/png;base64,${image.previewBase64}`;
    previewImage.style.display = 'block';
    previewPlaceholder.style.display = 'none';
    hasImage = true;
  } else {
    previewImage.style.display = 'none';
    previewPlaceholder.style.display = 'flex';
    hasImage = false;
  }

  // Load config and populate project dropdown
  const config = await window.snag.getConfig();
  populateProjects(config.projects, config.lastProject);

  // Reset form
  descriptionInput.value = '';
  detailsInput.value = '';
  tagsInput.value = '';
  statusBar.style.display = 'none';
  form.querySelector('.save-btn').disabled = false;
  selectedType = 'bug';
  typeBtns.forEach((btn) => btn.classList.toggle('selected', btn.dataset.type === 'bug'));
  descriptionInput.focus();
}

function populateProjects(projects, lastProject) {
  // Keep the placeholder option
  projectSelect.innerHTML = '<option value="" disabled>Choose project...</option>';

  for (const p of projects) {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = basename(p);
    opt.title = p;
    projectSelect.appendChild(opt);
  }

  if (lastProject && projects.includes(lastProject)) {
    projectSelect.value = lastProject;
  } else if (projects.length) {
    projectSelect.value = projects[0];
  }
}

function basename(p) {
  return p.split('/').pop() || p;
}

// --- Events ---

// Called when capture window becomes visible
window.snag.onCaptureShown(() => {
  refreshForm();
});

// Initial load
refreshForm();

// Type toggle
typeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    selectedType = btn.dataset.type;
    typeBtns.forEach((b) => b.classList.toggle('selected', b === btn));
  });
});

// Close button
closeBtn.addEventListener('click', () => {
  window.snag.closeCapture();
});

// Click preview area to refresh screenshot from clipboard
previewPlaceholder.addEventListener('click', refreshClipboard);
previewImage.addEventListener('click', refreshClipboard);

async function refreshClipboard() {
  const image = await window.snag.getClipboardImage();
  if (image) {
    previewImage.src = `data:image/png;base64,${image.previewBase64}`;
    previewImage.style.display = 'block';
    previewPlaceholder.style.display = 'none';
    hasImage = true;
  }
}

// Browse for project
browseBtn.addEventListener('click', async () => {
  const dir = await window.snag.openDirectoryDialog();
  if (!dir) return;

  // Add to config
  const config = await window.snag.getConfig();
  if (!config.projects.includes(dir)) {
    config.projects.unshift(dir);
  }
  config.lastProject = dir;
  await window.snag.updateConfig({ projects: config.projects, lastProject: dir });

  populateProjects(config.projects, dir);
});

// Form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  await saveCapture();
});

async function saveCapture() {
  const description = descriptionInput.value.trim();
  if (!description) {
    descriptionInput.focus();
    descriptionInput.classList.add('shake');
    setTimeout(() => descriptionInput.classList.remove('shake'), 400);
    return;
  }

  const projectPath = projectSelect.value;
  if (!projectPath) {
    showStatus('Select a project first', 'error');
    return;
  }

  const tags = tagsInput.value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  // Disable form while saving
  const saveBtn = form.querySelector('.save-btn');
  saveBtn.disabled = true;

  const details = detailsInput.value.trim();

  const type = selectedType;

  const result = await window.snag.saveCapture({ projectPath, description, details, tags, type });

  if (result.success) {
    showStatus('Saved!', 'success');
    setTimeout(() => {
      window.snag.closeCapture();
    }, 400);
  } else {
    showStatus(`Error: ${result.error}`, 'error');
    saveBtn.disabled = false;
  }
}

function showStatus(message, type) {
  statusBar.textContent = message;
  statusBar.className = `status-bar ${type}`;
  statusBar.style.display = 'block';
}

// --- Keyboard shortcuts ---

document.addEventListener('keydown', (e) => {
  // Cmd+Enter — save
  if (e.metaKey && e.key === 'Enter') {
    e.preventDefault();
    saveCapture();
    return;
  }

  // Escape — dismiss
  if (e.key === 'Escape') {
    e.preventDefault();
    window.snag.closeCapture();
    return;
  }
});
