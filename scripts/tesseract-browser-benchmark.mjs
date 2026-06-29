/**
 * Browser benchmark via Playwright — closer to real user experience.
 * Run: node scripts/tesseract-browser-benchmark.mjs [image-path]
 */
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
import { pathToFileURL } from 'url';

const DEFAULT_IMAGE =
  '/home/alex/.cursor/projects/home-alex-Downloads-CSI/assets/image-bd01b886-308c-4c00-ab2f-0cfd3c4e3a7f.png';

const HTML = `<!DOCTYPE html>
<html><body>
<script type="module">
import { createWorker } from 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/+esm';

window.runBenchmark = async (imageBase64) => {
  const results = { initMs: 0, runs: [] };
  const tInit = performance.now();
  const worker = await createWorker('eng', 1, { logger: () => {} });
  results.initMs = performance.now() - tInit;

  for (let i = 0; i < 3; i++) {
    const t0 = performance.now();
    const { data } = await worker.recognize(imageBase64);
    results.runs.push({
      ms: performance.now() - t0,
      confidence: data.confidence,
      text: data.text,
    });
  }
  await worker.terminate();
  return results;
};
</script>
</body></html>`;

async function main() {
  const imagePath = process.argv[2] || DEFAULT_IMAGE;
  if (!existsSync(imagePath)) {
    console.error('Image not found:', imagePath);
    process.exit(1);
  }

  const b64 = readFileSync(imagePath).toString('base64');
  const dataUrl = `data:image/png;base64,${b64}`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(HTML, { waitUntil: 'networkidle' });

  console.log('Browser benchmark (Playwright + CDN tesseract.js 5.1.1)');
  console.log('Image:', imagePath);
  console.log('---');

  const results = await page.evaluate(async (url) => {
    return await window.runBenchmark(url);
  }, dataUrl);

  await browser.close();

  const AMOUNT_RE = /(?:₹|Rs\.?|INR|[R₹])?\s*([\d,]+(?:\.\d{1,2})?)/i;
  const DATE_RE =
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\s+\w+\s+\d{4})\b/i;

  function extract(text) {
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || DATE_RE.test(trimmed)) continue;
      const compact = trimmed.replace(/\s+/g, '');
      const m = AMOUNT_RE.exec(compact);
      if (!m) continue;
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (!Number.isNaN(val) && val >= 1) return { val, line: trimmed };
    }
    return null;
  }

  console.log(`Worker init: ${results.initMs.toFixed(0)} ms`);
  results.runs.forEach((r, i) => {
    const ext = extract(r.text);
    console.log(`\nRun ${i + 1}: ${r.ms.toFixed(0)} ms, confidence ${r.confidence.toFixed(1)}%`);
    console.log('Text preview:', r.text.replace(/\n/g, ' | ').trim());
    console.log('Extracted:', ext ? `₹${ext.val.toFixed(2)} (${ext.line})` : 'none');
    console.log('Correct (790):', ext?.val === 790 ? 'YES' : 'NO');
  });

  const warmAvg =
    (results.runs[1].ms + results.runs[2].ms) / 2;
  console.log('\n--- Browser summary ---');
  console.log(`First-time scan: ~${(results.initMs + results.runs[0].ms).toFixed(0)} ms`);
  console.log(`Warm rescans avg: ~${warmAvg.toFixed(0)} ms`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
