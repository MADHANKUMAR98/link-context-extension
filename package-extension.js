const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Files to include in package
const filesToInclude = [
  'manifest.json',
  'content.js',
  'styles.css',
  'popup.html',
  'popup.js',
  'error-handler.js',
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png'
];

// Create ZIP archive
const output = fs.createWriteStream('link-context-v1.0.0.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log('✅ Extension packaged successfully!');
  console.log(`📦 File size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
  console.log('🚀 Ready for Chrome Web Store submission!');
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Add files to archive
filesToInclude.forEach(file => {
  if (fs.existsSync(file)) {
    archive.file(file, { name: file });
  } else {
    console.warn(`⚠️  File not found: ${file}`);
  }
});

archive.finalize();