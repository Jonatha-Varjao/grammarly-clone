import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
  cpSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const PUBLIC = join(__dirname, 'public');
const SRC = join(__dirname, 'src');

async function build() {
  console.log('🏗️  Building extension...\n');

  if (existsSync(DIST)) {
    rmSync(DIST, { recursive: true });
  }
  mkdirSync(DIST, { recursive: true });
  mkdirSync(join(DIST, 'assets'), { recursive: true });

  console.log('📦 Bundling background and content scripts...');
  await Bun.build({
    entrypoints: [join(SRC, 'background.ts'), join(SRC, 'content.ts')],
    outdir: DIST,
    target: 'browser',
    format: 'esm',
    minify: true,
    sourcemap: 'none',
  });

  console.log('📦 Bundling popup and sidepanel...');
  await Bun.build({
    entrypoints: [join(SRC, 'popup/main.tsx'), join(SRC, 'sidepanel/main.tsx')],
    outdir: join(DIST, 'assets'),
    target: 'browser',
    format: 'esm',
    minify: true,
    sourcemap: 'none',
    jsx: {
      runtime: 'automatic',
    },
  });

  console.log('📄 Copying static files...');
  copyFileSync(join(PUBLIC, 'manifest.json'), join(DIST, 'manifest.json'));

  copyFileSync(join(SRC, 'popup/popup.css'), join(DIST, 'assets', 'popup.css'));
  copyFileSync(join(SRC, 'sidepanel/sidepanel.css'), join(DIST, 'assets', 'sidepanel.css'));

  const popupHtml = readFileSync(join(PUBLIC, 'popup.html'), 'utf-8');
  const sidepanelHtml = readFileSync(join(PUBLIC, 'sidepanel.html'), 'utf-8');

  const processedPopup = popupHtml
    .replace('/src/popup/main.tsx', 'assets/popup/main.js')
    .replace('/src/popup/popup.css', 'assets/popup.css')
    .replace('</head>', '  <link rel="stylesheet" href="assets/popup.css">\n</head>');

  const processedSidepanel = sidepanelHtml
    .replace('/src/sidepanel/main.tsx', 'assets/sidepanel/main.js')
    .replace('/src/sidepanel/sidepanel.css', 'assets/sidepanel.css')
    .replace('</head>', '  <link rel="stylesheet" href="assets/sidepanel.css">\n</head>');

  writeFileSync(join(DIST, 'popup.html'), processedPopup);
  writeFileSync(join(DIST, 'sidepanel.html'), processedSidepanel);

  console.log('✅ Build complete! Output: dist/');
}

build();
