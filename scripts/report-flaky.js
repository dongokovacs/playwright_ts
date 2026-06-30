#!/usr/bin/env node
// Finds tests that needed a retry to pass and writes them to
// $GITHUB_STEP_SUMMARY. Runs on a schedule, not a PR, so there's no PR to
// comment on — the run summary is the next best place to see this.
const fs = require('node:fs');

const resultsPath = process.argv[2] ?? 'test-results/results.json';
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

if (!fs.existsSync(resultsPath)) {
  console.log(`No results file at ${resultsPath}, skipping flaky report.`);
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
const flaky = [];

function walk(suite, titlePath) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      if (test.results.length > 1 && test.status === 'expected') {
        flaky.push({
          title: [...titlePath, spec.title].join(' › '),
          attempts: test.results.length,
        });
      }
    }
  }
  for (const child of suite.suites ?? []) {
    walk(child, [...titlePath, suite.title].filter(Boolean));
  }
}

for (const suite of report.suites ?? []) {
  walk(suite, []);
}

if (flaky.length === 0) {
  console.log('No flaky tests detected.');
  process.exit(0);
}

const lines = [
  '## Flaky tests detected',
  '',
  'These tests failed at least once but passed on retry:',
  '',
  ...flaky.map((f) => `- **${f.title}** — passed after ${f.attempts} attempt(s)`),
];

console.log(lines.join('\n'));
if (summaryPath) {
  fs.appendFileSync(summaryPath, lines.join('\n') + '\n');
}
