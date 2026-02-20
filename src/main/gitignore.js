const fs = require('fs');
const path = require('path');

function ensureSnagIgnored(projectPath) {
  const gitignorePath = path.join(projectPath, '.gitignore');
  const entry = '.snag/';

  try {
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      const lines = content.split('\n').map((l) => l.trim());
      if (lines.includes(entry) || lines.includes('.snag')) return;
      const suffix = content.endsWith('\n') ? '' : '\n';
      fs.appendFileSync(gitignorePath, `${suffix}${entry}\n`, 'utf-8');
    } else {
      // Only create .gitignore if the project has a .git directory
      if (fs.existsSync(path.join(projectPath, '.git'))) {
        fs.writeFileSync(gitignorePath, `${entry}\n`, 'utf-8');
      }
    }
  } catch {
    // Non-fatal — don't block capture on gitignore issues
  }
}

module.exports = { ensureSnagIgnored };
