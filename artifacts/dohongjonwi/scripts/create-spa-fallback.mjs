import { copyFile, readFile, rm, writeFile } from 'node:fs/promises';

const outputDirectory = 'dist/public';
let html = await readFile(`${outputDirectory}/index.html`, 'utf8');

function getAssetPath(url) {
  const match = url.match(/(?:^|\/)assets\/(.+)$/);
  if (!match) throw new Error(`Unexpected Vite asset path: ${url}`);
  return `${outputDirectory}/assets/${match[1]}`;
}

const scriptMatch = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
if (scriptMatch) {
  const script = await readFile(getAssetPath(scriptMatch[1]), 'utf8');
  html = html.replace(scriptMatch[0], `<script type="module">${script}</script>`);
}

const styleMatch = html.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);
if (styleMatch) {
  const style = await readFile(getAssetPath(styleMatch[1]), 'utf8');
  html = html.replace(styleMatch[0], `<style>${style}</style>`);
}

const faviconMatch = html.match(/<link rel="icon" type="image\/svg\+xml" href="([^"]+)" \/>/);
if (faviconMatch) {
  const favicon = await readFile(`${outputDirectory}/favicon.svg`, 'utf8');
  html = html.replace(faviconMatch[0], `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(favicon)}" />`);
}

await writeFile(`${outputDirectory}/index.html`, html);
await copyFile(`${outputDirectory}/index.html`, `${outputDirectory}/404.html`);
await rm(`${outputDirectory}/assets`, { recursive: true, force: true });
await rm(`${outputDirectory}/favicon.svg`, { force: true });
await writeFile('dist/public/.nojekyll', '');