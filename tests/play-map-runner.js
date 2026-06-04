#!/usr/bin/env node
/**
 * Play Map Runner -- executes play map YAML files mechanically.
 *
 * Usage:
 *   node tests/play-map-runner.js tests/play-maps/project-management.yaml
 *   node tests/play-map-runner.js tests/play-maps/project-management.yaml --flow create_project --vars name=my-test
 *   node tests/play-map-runner.js tests/play-maps/project-management.yaml --verify-only
 *
 * No LLM in the loop. Reads YAML, executes steps, reports pass/fail.
 * Runs in seconds, not minutes.
 */

const { chromium } = require('playwright');
const { readFileSync } = require('fs');
const { parse } = require('yaml');
const path = require('path');

// ── Parse CLI args ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (!args[0] || args[0] === '--help') {
  console.log(`Usage: node play-map-runner.js <play-map.yaml> [options]
Options:
  --flow <name>       Run only this flow (default: all flows)
  --vars key=val,...   Template variables (e.g. name=my-test,new_name=renamed)
  --verify-only       Run only verifications, no flows
  --headed            Show browser window
  --slow <ms>         Slow down actions (default: 0)
  --timeout <ms>      Per-action timeout (default: 5000)`);
  process.exit(0);
}

const mapFile = path.resolve(args[0]);
const flags = {
  flow: null,
  vars: {},
  verifyOnly: false,
  headed: false,
  slow: 0,
  timeout: 5000,
};

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--flow') flags.flow = args[++i];
  if (args[i] === '--vars') {
    args[++i].split(',').forEach(kv => {
      const [k, ...v] = kv.split('=');
      flags.vars[k] = v.join('=');
    });
  }
  if (args[i] === '--verify-only') flags.verifyOnly = true;
  if (args[i] === '--headed') flags.headed = true;
  if (args[i] === '--slow') flags.slow = parseInt(args[++i]);
  if (args[i] === '--timeout') flags.timeout = parseInt(args[++i]);
}

// ── Load play map ───────────────────────────────────────────────────────────

const raw = readFileSync(mapFile, 'utf8');
const map = parse(raw);
const baseUrl = map.url || 'http://localhost:9000';

// ── Template interpolation ──────────────────────────────────────────────────

function interp(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => flags.vars[k] ?? `{${k}}`);
}

// ── Logging ─────────────────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;

function pass(msg) { passCount++; console.log(`  [+] ${msg}`); }
function fail(msg, detail) { failCount++; console.log(`  [x] ${msg}`); if (detail) console.log(`      ${detail}`); }
function info(msg) { console.log(`  [-] ${msg}`); }

// ── Step executors ──────────────────────────────────────────────────────────

async function execStep(page, step) {
  const action = step.action;
  const timeout = flags.timeout;

  switch (action) {
    case 'click': {
      const sel = interp(step.selector);
      const scope = step.scope ? interp(step.scope) : null;
      const containing = step.containing ? interp(step.containing) : null;
      try {
        if (scope && containing) {
          await page.locator(scope).filter({ hasText: containing }).locator(sel).first().click({ timeout });
          pass(`click: ${sel} in ${scope} containing "${containing}"`);
        } else if (scope) {
          await page.locator(scope).locator(sel).first().click({ timeout });
          pass(`click: ${sel} in ${scope}`);
        } else if (containing) {
          await page.locator(sel).filter({ hasText: containing }).first().click({ timeout });
          pass(`click: ${sel} containing "${containing}"`);
        } else {
          await page.click(sel, { timeout });
          pass(`click: ${sel}`);
        }
      } catch (e) {
        fail(`click: ${sel}`, e.message.split('\n')[0]);
      }
      break;
    }

    case 'click_text': {
      const text = interp(step.text);
      const scope = step.scope ? interp(step.scope) : 'body';
      try {
        // Use Playwright's native click with text selector for proper event handling
        // (evaluate + .click() bypasses React's stopPropagation and closes dropdowns)
        const locator = scope !== 'body'
          ? page.locator(scope).getByRole('button', { name: text })
          : page.getByRole('button', { name: text });
        await locator.first().click({ timeout });
        pass(`click_text: "${text}"`);
      } catch (e) {
        // Fallback: try broader text matching
        try {
          const locator = scope !== 'body'
            ? page.locator(scope).locator(`text="${text}"`)
            : page.locator(`text="${text}"`);
          await locator.first().click({ timeout });
          pass(`click_text: "${text}" (fallback)`);
        } catch (e2) {
          fail(`click_text: "${text}" not found in ${scope}`, e2.message.split('\n')[0]);
        }
      }
      break;
    }

    case 'fill': {
      const sel = interp(step.selector);
      const val = interp(step.value);
      try {
        await page.fill(sel, val, { timeout });
        pass(`fill: ${sel} = "${val}"`);
      } catch (e) {
        fail(`fill: ${sel}`, e.message.split('\n')[0]);
      }
      break;
    }

    case 'press': {
      const key = step.key || 'Enter';
      try {
        await page.keyboard.press(key);
        pass(`press: ${key}`);
      } catch (e) {
        fail(`press: ${key}`, e.message.split('\n')[0]);
      }
      break;
    }

    case 'hover': {
      const sel = interp(step.selector);
      const containing = step.containing ? interp(step.containing) : null;
      try {
        if (containing) {
          // Hover the element whose text contains the given string
          const locator = page.locator(sel).filter({ hasText: containing }).first();
          await locator.hover({ timeout });
          pass(`hover: ${sel} containing "${containing}"`);
        } else {
          await page.hover(sel, { timeout });
          pass(`hover: ${sel}`);
        }
      } catch (e) {
        fail(`hover: ${sel}`, e.message.split('\n')[0]);
      }
      break;
    }

    case 'wait': {
      const ms = step.ms || 1000;
      await new Promise(r => setTimeout(r, ms));
      info(`wait: ${ms}ms`);
      break;
    }

    case 'accept_dialog': {
      // Dialog handler should already be set up
      info('accept_dialog: (handled by listener)');
      break;
    }

    case 'verify': {
      const js = interp(step.js);
      const expect = interp(step.expect);
      try {
        const result = await page.evaluate(js);
        const resultStr = JSON.stringify(result);
        const expectStr = JSON.stringify(expect === 'true' ? true : expect === 'false' ? false : expect);

        // Flexible matching: exact, contains, or boolean coercion
        let matched = false;
        if (resultStr === expectStr) matched = true;
        else if (typeof result === 'string' && typeof expect === 'string' && result.includes(expect)) matched = true;
        else if (result === true && expect === true) matched = true;
        else if (result === false && expect === false) matched = true;

        if (matched) pass(`verify: ${js.substring(0, 60)}...`);
        else fail(`verify: expected ${expectStr}, got ${resultStr}`, js.substring(0, 80));
      } catch (e) {
        fail(`verify: ${js.substring(0, 60)}`, e.message.split('\n')[0]);
      }
      break;
    }

    case 'verify_absent': {
      const text = interp(step.text);
      const scope = step.scope ? interp(step.scope) : 'body';
      try {
        const found = await page.evaluate(({ text, scope }) => {
          const el = document.querySelector(scope) || document.body;
          return el.textContent.includes(text);
        }, { text, scope });
        if (!found) pass(`verify_absent: "${text}" not in ${scope}`);
        else fail(`verify_absent: "${text}" should NOT be present`);
      } catch (e) {
        fail(`verify_absent`, e.message.split('\n')[0]);
      }
      break;
    }

    default:
      info(`unknown action: ${action} (skipped)`);
  }

  // Small delay between actions for UI to settle
  if (flags.slow > 0) await new Promise(r => setTimeout(r, flags.slow));
  else await new Promise(r => setTimeout(r, 100));
}

// ── Run verifications ───────────────────────────────────────────────────────

async function runVerifications(page, verifications) {
  if (!verifications) return;
  console.log('\n  Verifications:');
  for (const [name, v] of Object.entries(verifications)) {
    if (v.js && v.expect !== undefined) {
      await execStep(page, { action: 'verify', js: v.js, expect: v.expect });
    } else if (v.absent) {
      await execStep(page, { action: 'verify_absent', text: v.absent });
    } else if (v.js) {
      // Info-only verification (no expected value)
      try {
        const result = await page.evaluate(v.js);
        info(`${name}: ${JSON.stringify(result)}`);
      } catch (e) {
        fail(`${name}`, e.message.split('\n')[0]);
      }
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n  Play Map Runner: ${map.area}`);
  console.log(`  URL: ${baseUrl}`);
  console.log(`  Map: ${mapFile}`);
  if (Object.keys(flags.vars).length > 0) console.log(`  Vars: ${JSON.stringify(flags.vars)}`);
  console.log('');

  const browser = await chromium.launch({ headless: !flags.headed });
  const page = await browser.newPage();

  // Auto-accept dialogs (confirm, alert)
  page.on('dialog', async dialog => {
    info(`dialog: "${dialog.message().substring(0, 60)}" -> accept`);
    await dialog.accept();
  });

  // Navigate
  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 10000 });
    pass(`navigate: ${baseUrl}`);
  } catch (e) {
    fail(`navigate: ${baseUrl}`, e.message.split('\n')[0]);
    await browser.close();
    process.exit(1);
  }

  // Wait for app to render
  await page.waitForTimeout(1000);

  if (flags.verifyOnly) {
    await runVerifications(page, map.verifications);
  } else {
    // Run flows
    const flows = map.flows || {};
    const flowNames = flags.flow ? [flags.flow] : Object.keys(flows);

    for (const name of flowNames) {
      const flow = flows[name];
      if (!flow || !flow.steps) {
        fail(`flow "${name}" not found or has no steps`);
        continue;
      }
      console.log(`  Flow: ${name}`);
      for (const step of flow.steps) {
        await execStep(page, step);
      }
      // Close any open dropdowns/menus by clicking the body, then pause
      await page.evaluate(() => document.body.click());
      await page.waitForTimeout(500);
      console.log('');
    }

    // Run verifications after flows
    await runVerifications(page, map.verifications);
  }

  await browser.close();

  // Summary
  console.log(`\n  ────────────────────────────────`);
  console.log(`  Results: ${passCount} passed, ${failCount} failed`);
  if (failCount > 0) {
    console.log(`  STATUS: FAIL`);
    process.exit(1);
  } else {
    console.log(`  STATUS: PASS`);
  }
}

main().catch(e => {
  console.error(`  [x] Fatal: ${e.message}`);
  process.exit(1);
});
