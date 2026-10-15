#!/usr/bin/env node
/**
 * Principal Full-Stack Audit, Repair & Packaging Script for KrishiMitra AI
 * Usage: node build-final-zip.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;

const REQUIRED_PATHS = [
  '.env.example',
  '.gitignore',
  '.prettierrc',
  '.prettierignore',
  '.github/workflows/deploy.yml',
  'README.md',
  'database/schema.sql',
  'backend/app.js',
  'backend/server.js',
  'backend/config.js',
  'backend/db.js',
  'backend/package.json',
  'frontend/index.html',
  'frontend/package.json',
  'frontend/public/manifest.webmanifest',
  'frontend/public/icons/icon-192.png',
  'frontend/public/icons/icon-512.png',
];

function log(step, msg) {
  console.log(`\x1b[36m[${step}]\x1b[0m ${msg}`);
}

// 1. Audit required project structure
log('1/6 AUDIT', 'Verifying repository structure...');
for (const relPath of REQUIRED_PATHS) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  ! Missing expected file: ${relPath}`);
  }
}

// 2. Check and repair truncated sugarcane product image
log('2/6 REPAIR', 'Checking frontend/public/products/sugarcane.jpg...');
const productSugarcane = path.join(ROOT, 'frontend/public/products/sugarcane.jpg');
const cropSugarcane = path.join(ROOT, 'frontend/public/crops/sugarcane.jpg');

if (fs.existsSync(cropSugarcane)) {
  let needsRepair = !fs.existsSync(productSugarcane);
  if (!needsRepair) {
    const buf = fs.readFileSync(productSugarcane);
    if (buf.length < 1024 || buf[buf.length - 2] !== 0xff || buf[buf.length - 1] !== 0xd9) {
      needsRepair = true;
    }
  }
  if (needsRepair) {
    fs.copyFileSync(cropSugarcane, productSugarcane);
    log('2/6 REPAIR', 'Repaired truncated frontend/public/products/sugarcane.jpg from crops/sugarcane.jpg');
  } else {
    log('2/6 REPAIR', 'frontend/public/products/sugarcane.jpg is intact (valid JPEG EOI marker).');
  }
}

// 3. Install dependencies & run backend test suites
log('3/6 TESTS', 'Running backend test suites (20 test files)...');
try {
  execSync('npm test', { cwd: path.join(ROOT, 'backend'), stdio: 'inherit' });
} catch (err) {
  console.error('Backend tests reported failures. Review the output above.');
  process.exit(1);
}

// 4. Run Checkout Smoke Script
log('4/6 SMOKE', 'Executing backend/scripts/smoke-checkout.js...');
try {
  execSync('node scripts/smoke-checkout.js', { cwd: path.join(ROOT, 'backend'), stdio: 'inherit' });
} catch (err) {
  console.error('Smoke checkout failed.');
  process.exit(1);
}

// 5. Format codebase with Prettier & verify frontend build
log('5/6 FORMAT & BUILD', 'Formatting code and verifying frontend build...');
try {
  execSync('npx prettier --write .', { cwd: ROOT, stdio: 'inherit' });
  execSync('npm run build', { cwd: path.join(ROOT, 'frontend'), stdio: 'inherit' });
} catch (err) {
  console.warn('Prettier or frontend build warning:', err.message);
}

// 6. Package clean production zip (excluding node_modules, .env, .git)
log('6/6 PACKAGE', 'Creating clean krishimitra-ai-production.zip...');
const zipOutput = path.join(ROOT, '..', 'krishimitra-ai-production.zip');
try {
  execSync(
    `zip -r "${zipOutput}" . -x "*/node_modules/*" "node_modules/*" ".env" "*/.env" ".git/*" "*.log" "frontend/dist/*"`,
    { cwd: ROOT, stdio: 'inherit' },
  );
  log('DONE', `Production archive created at: ${zipOutput}`);
} catch (err) {
  console.error('Failed to run zip command. Ensure zip is installed on your OS.');
  process.exit(1);
}
