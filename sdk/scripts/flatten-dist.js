// tsconfig.json compiles src/ and react/ together so react's cross-imports
// into src/ type-check, which makes tsc nest src output under dist/src/.
// package.json's main/exports expect it at dist/ directly, so move it up.
const fs = require('node:fs');
const path = require('node:path');

const distDir = path.join(__dirname, '..', 'dist');
const nestedSrcDir = path.join(distDir, 'src');

function moveEntry(source, destination) {
  fs.rmSync(destination, { recursive: true, force: true });

  try {
    fs.renameSync(source, destination);
  } catch (error) {
    // Windows can reject directory renames during rebuilds even after cleanup.
    // Fall back to copy + remove so repeated local builds still succeed.
    if (error && (error.code === 'EPERM' || error.code === 'EXDEV')) {
      fs.cpSync(source, destination, { recursive: true });
      fs.rmSync(source, { recursive: true, force: true });
      return;
    }

    throw error;
  }
}

if (fs.existsSync(nestedSrcDir)) {
  for (const entry of fs.readdirSync(nestedSrcDir)) {
    moveEntry(path.join(nestedSrcDir, entry), path.join(distDir, entry));
  }
  fs.rmSync(nestedSrcDir, { recursive: true, force: true });
}
