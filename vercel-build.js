// Vercel build script
const { execSync } = require('child_process');

// Build the frontend
console.log('Building the frontend...');
execSync('vite build', { stdio: 'inherit' });

// Build the backend
console.log('Building the backend...');
execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', 
  { stdio: 'inherit' });

console.log('Build completed successfully!');