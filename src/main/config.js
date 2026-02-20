const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.config', 'snag');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

const DEFAULTS = {
  hotkey: 'CommandOrControl+Shift+X',
  projects: [],
  lastProject: null,
  cleanup: {
    enabled: true,
    intervalMinutes: 30,
    retentionDays: 30,
    autoDeleteResolved: true,
  },
};

function ensureDir() {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

function read() {
  ensureDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    write(DEFAULTS);
    return { ...DEFAULTS };
  }
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function write(config) {
  ensureDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

function update(partial) {
  const current = read();
  const merged = { ...current, ...partial };
  write(merged);
  return merged;
}

function addProject(projectPath) {
  const config = read();
  const normalized = path.resolve(projectPath);
  config.projects = config.projects.filter((p) => p !== normalized);
  config.projects.unshift(normalized);
  config.lastProject = normalized;
  write(config);
  return config;
}

function touchProject(projectPath) {
  const config = read();
  const normalized = path.resolve(projectPath);
  config.projects = config.projects.filter((p) => p !== normalized);
  config.projects.unshift(normalized);
  config.lastProject = normalized;
  write(config);
  return config;
}

module.exports = { read, write, update, addProject, touchProject, CONFIG_PATH };
