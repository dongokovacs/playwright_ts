#!/usr/bin/env node
// Builds the GitHub Pages landing page from README.md, so the framework
// description on Pages can't drift out of sync with the repo's own README.
// The Playwright HTML report gets copied alongside it at build time (see
// .github/workflows/all.yml / nightly.yml) so the landing page can link to
// ./report/ as a relative path within the same Pages deploy.
const fs = require('node:fs');
const path = require('node:path');
const { marked } = require('marked');

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'pages-site');

const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf-8');

// Pages only publishes this rendered page + the report, not the repo's other
// .md files, so relative links to them (ARCHITECTURE.md, CONTRIBUTING.md)
// would 404 — point those at the GitHub blob view instead.
const REPO_URL = 'https://github.com/dongokovacs/playwright_ts';
const content = marked
  .parse(readme)
  .replace(/href="\.?\/?([\w-]+\.md)"/g, (_match, file) => `href="${REPO_URL}/blob/main/${file}"`);

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Playwright TS Test Automation Portfolio</title>
    <style>
      body {
        font-family:
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          sans-serif;
        max-width: 860px;
        margin: 2.5rem auto;
        padding: 0 1.5rem 3rem;
        line-height: 1.6;
        color: #1a1a1a;
      }
      pre {
        background: #f5f5f5;
        padding: 1rem;
        overflow-x: auto;
        border-radius: 6px;
      }
      code {
        background: #f0f0f0;
        padding: 0.15rem 0.35rem;
        border-radius: 4px;
      }
      pre code {
        background: none;
        padding: 0;
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      th,
      td {
        border: 1px solid #ddd;
        padding: 0.5rem 0.75rem;
        text-align: left;
      }
      a.report-link {
        display: inline-block;
        margin-bottom: 1.5rem;
        padding: 0.6rem 1.2rem;
        background: #1a1a1a;
        color: #fff;
        text-decoration: none;
        border-radius: 6px;
      }
      a.report-link:hover {
        background: #333;
      }
    </style>
  </head>
  <body>
    <a class="report-link" href="./report/">View latest test report →</a>
    ${content}
  </body>
</html>
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log(`Wrote ${path.join(outDir, 'index.html')}`);
