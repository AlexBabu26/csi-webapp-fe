/**
 * One-off benchmark: Tesseract.js on UPI payment screenshot.
 * Run: node scripts/tesseract-benchmark.mjs [image-path]
 */
import { createWorker } from 'tesseract.js';
import { readFileSync, existsSync } from 'fs';
import { performance } from 'perf_hooks';

const DEFAULT_IMAGE =
  '/home/alex/.cursor/projects/home-alex-Downloads-CSI/assets/image-bd01b886-308c-4c00-ab2f-0cfd3c4e3a7f.png';
const EXPECTED_AMOUNT = 790.0;

const AMOUNT_RE = /(?:₹|Rs\.?|INR|[R₹])?\s*([\d,]+(?:\.\d{1,2})?)/i;
const DATE_RE =
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\s+\w+\s+\d{4})\b/i;

function parseAmounts(text) {
  const candidates = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || DATE_RE.test(trimmed)) continue;
    const compact = trimmed.replace(/\s+/g, '');
    const m = AMOUNT_RE.exec(compact);
    if (!m) continue;
    const raw = m[1].replace(/,/g, '');
    const val = parseFloat(raw);
    if (Number.isNaN(val) || val < 1) continue;
    if (raw.includes('.') || /^[R₹]/.test(compact) || /^Rs/i.test(trimmed)) {
      candidates.push({ amount: val, line: trimmed });
    }
  }
  return candidates;
}

function pickBestAmount(candidates) {
  if (!candidates.length) return null;
  return candidates.reduce((best, c) => (c.amount > best.amount ? c : best));
}

async function runOnce(worker, imagePath, label) {
  const buf = readFileSync(imagePath);
  const t0 = performance.now();
  const result = await worker.recognize(buf);
  const elapsedMs = performance.now() - t0;
  const text = result.data.text;
  const confidence = result.data.confidence;
  const candidates = parseAmounts(text);
  const picked = pickBestAmount(candidates);
  return {
    label,
    elapsedMs,
    confidence,
    text,
    candidates,
    picked,
    correct: picked?.amount === EXPECTED_AMOUNT,
  };
}

async function main() {
  const imagePath = process.argv[2] || DEFAULT_IMAGE;
  if (!existsSync(imagePath)) {
    console.error('Image not found:', imagePath);
    process.exit(1);
  }

  console.log('Image:', imagePath);
  console.log('Expected amount: ₹', EXPECTED_AMOUNT.toFixed(2));
  console.log('---');

  const initStart = performance.now();
  const worker = await createWorker('eng', 1, { logger: () => {} });
  const initMs = performance.now() - initStart;
  console.log(`Worker init (cold): ${initMs.toFixed(0)} ms`);

  const runs = [];
  runs.push(await runOnce(worker, imagePath, 'run-1 (includes warm worker)'));
  runs.push(await runOnce(worker, imagePath, 'run-2 (warm)'));
  runs.push(await runOnce(worker, imagePath, 'run-3 (warm)'));

  await worker.terminate();

  for (const r of runs) {
    console.log('\n===', r.label, '===');
    console.log(`OCR time: ${r.elapsedMs.toFixed(0)} ms`);
    console.log(`Document confidence: ${r.confidence.toFixed(1)}%`);
    console.log('Raw OCR text:');
    console.log(r.text.split('\n').map((l) => `  | ${l}`).join('\n'));
    console.log('Amount candidates:', r.candidates);
    console.log(
      'Extracted:',
      r.picked ? `₹${r.picked.amount.toFixed(2)} (${r.picked.line})` : 'none',
    );
    console.log('Match expected:', r.correct ? 'YES' : 'NO');
  }

  const warmTimes = runs.slice(1).map((r) => r.elapsedMs);
  const avgWarm = warmTimes.reduce((a, b) => a + b, 0) / warmTimes.length;
  console.log('\n--- Summary ---');
  console.log(`Cold start (worker init): ${initMs.toFixed(0)} ms`);
  console.log(`First recognize: ${runs[0].elapsedMs.toFixed(0)} ms`);
  console.log(`Warm recognize avg: ${avgWarm.toFixed(0)} ms`);
  console.log(`Amount accuracy: ${runs.filter((r) => r.correct).length}/${runs.length} runs`);
  console.log(`Estimated browser first scan: ~${(initMs + runs[0].elapsedMs).toFixed(0)} ms`);
  console.log(`Estimated browser rescan: ~${avgWarm.toFixed(0)} ms`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
