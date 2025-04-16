// Vercel build script using ES modules syntax
import { execSync } from 'child_process';

// Build the frontend
console.log('Building the frontend...');
execSync('vite build', { stdio: 'inherit' });

console.log('Build completed successfully!');