import { createWorker, type Worker } from 'tesseract.js';

const AMOUNT_PATTERN = /(?:₹|Rs\.?|INR|[R₹])?\s*([\d,]+(?:\.\d{1,2})?)/i;
const DATE_PATTERN =
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\s+\w+\s+\d{4})\b/i;
const PAID_TO_PATTERN = /^paid\s+to\b/i;

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, { logger: () => {} });
  }
  return workerPromise;
}

function normalizeAmountDigits(raw: string): string {
  return raw.replace(/,/g, '');
}

/** ₹ misread as "2" before amounts starting with 7, 8, or 9 (2820→820, 2790→790). */
function correctRupeeMisreadAmount(compact: string, value: number): number {
  const normalized = compact.replace(/,/g, '');
  const decimalMatch = /^2([789]\d{2}\.\d{2})$/.exec(normalized);
  if (decimalMatch) {
    const corrected = Number.parseFloat(decimalMatch[1]);
    if (!Number.isNaN(corrected)) {
      return Math.round(corrected);
    }
  }

  return value;
}

function parseAmountFromLine(trimmed: string): number | null {
  if (!trimmed || DATE_PATTERN.test(trimmed) || PAID_TO_PATTERN.test(trimmed)) {
    return null;
  }

  const compact = trimmed.replace(/\s+/g, '');
  const match = AMOUNT_PATTERN.exec(compact);
  if (!match) return null;

  const raw = normalizeAmountDigits(match[1]);
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value) || value < 1) return null;

  const hasDecimal = raw.includes('.');
  const looksLikeCurrency =
    hasDecimal ||
    compact.startsWith('₹') ||
    compact.startsWith('R') ||
    /^rs/i.test(trimmed);

  if (!looksLikeCurrency) return null;

  return correctRupeeMisreadAmount(compact, Math.round(value));
}

export function parsePaymentAmountFromText(text: string): number | null {
  if (!text.trim()) return null;

  const lines = text.split('\n');
  const beforePaidTo: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (PAID_TO_PATTERN.test(trimmed)) break;
    if (trimmed) beforePaidTo.push(trimmed);
  }

  const searchLines = beforePaidTo.length > 0 ? beforePaidTo : lines.map((l) => l.trim()).filter(Boolean);

  for (const line of searchLines) {
    const withDecimal = parseAmountFromLine(line);
    if (withDecimal != null && /\.\d{1,2}/.test(line.replace(/\s+/g, ''))) {
      return withDecimal;
    }
  }

  for (const line of searchLines) {
    const amount = parseAmountFromLine(line);
    if (amount != null) return amount;
  }

  return null;
}

async function preprocessImageForOcr(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const cropHeight = Math.max(1, Math.floor(bitmap.height * 0.42));
  const scale = 2;

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width * scale;
  canvas.height = cropHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(
    bitmap,
    0,
    0,
    bitmap.width,
    cropHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const sample = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let luminanceSum = 0;
  for (let i = 0; i < sample.data.length; i += 4) {
    luminanceSum +=
      (sample.data[i] + sample.data[i + 1] + sample.data[i + 2]) / 3;
  }
  const avgLuminance = luminanceSum / (sample.data.length / 4);

  if (avgLuminance < 110) {
    ctx.drawImage(
      bitmap,
      0,
      0,
      bitmap.width,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const inverted = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < inverted.data.length; i += 4) {
      inverted.data[i] = 255 - inverted.data[i];
      inverted.data[i + 1] = 255 - inverted.data[i + 1];
      inverted.data[i + 2] = 255 - inverted.data[i + 2];
    }
    ctx.putImageData(inverted, 0, 0);
  }

  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to preprocess image'))),
      'image/png',
    );
  });
}

function reconcileDetectedAmounts(
  cropAmount: number | null,
  fullAmount: number | null,
): number | null {
  if (cropAmount != null && fullAmount != null && cropAmount !== fullAmount) {
    // ₹ misread as leading "2" on full-image OCR (2820 vs cropped 820).
    if (
      fullAmount > cropAmount &&
      (fullAmount === 2000 + cropAmount || String(fullAmount) === `2${cropAmount}`)
    ) {
      return cropAmount;
    }
  }

  if (cropAmount != null) return cropAmount;

  return fullAmount;
}

export async function extractPaymentAmountFromImage(file: File): Promise<number | null> {
  if (!file.type.startsWith('image/')) {
    return null;
  }

  const worker = await getWorker();
  const cropBlob = await preprocessImageForOcr(file);

  const [cropResult, fullResult] = await Promise.all([
    worker.recognize(cropBlob),
    worker.recognize(file),
  ]);

  const cropAmount = parsePaymentAmountFromText(cropResult.data.text);
  const fullAmount = parsePaymentAmountFromText(fullResult.data.text);

  return reconcileDetectedAmounts(cropAmount, fullAmount);
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function preloadPaymentOcrWorker(): void {
  void getWorker().catch(() => {
    workerPromise = null;
  });
}

/** @internal Exported for unit tests in Node benchmark scripts. */
export { correctRupeeMisreadAmount, preprocessImageForOcr };
