import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const stylesPath = resolve(__dirname, '../public/styles.css');

const REQUIRED_ENV = ['GEMINI_API_KEY', 'GOOGLE_SHEET_URL'];

function ensureEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  console.log('✅ Environment variables present');
}

async function ensureStyles() {
  try {
    await access(stylesPath);
    console.log('✅ Tailwind styles present at public/styles.css');
  } catch (error) {
    console.error('❌ public/styles.css is missing. Run "npm run build:css" before deploying.');
    process.exit(1);
  }
}

async function main() {
  ensureEnv();
  await ensureStyles();
  console.log('✅ Predeploy checks passed');
}

main().catch((error) => {
  console.error('❌ Predeploy script failed', error);
  process.exit(1);
});
