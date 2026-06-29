import { createWorker, type Worker } from 'tesseract.js';

const AMOUNT_PATTERN = /(?:₹|Rs\.?|INR|[R₹])?\s*([\d,]+(?:\.\d{1,2})?)/i;
const DATE_PATTERN =
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\s+\w+\s+\d{4})\b/i;

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, { logger: () => {} });
  }
  return workerPromise;
}

export function parsePaymentAmountFromText(text: string): number | null {
  if (!text.trim()) return null;

  const candidates: Array<{ amount: number; score: number }> = [];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || DATE_PATTERN.test(trimmed)) continue;

    const compact = trimmed.replace(/\s+/g, '');
    const match = AMOUNT_PATTERN.exec(compact);
    if (!match) continue;

    const raw = match[1].replace(/,/g, '');
    const value = Number.parseFloat(raw);
    if (Number.isNaN(value) || value < 1) continue;

    const hasDecimal = raw.includes('.');
    const looksLikeCurrency =
      hasDecimal ||
      compact.startsWith('₹') ||
      compact.startsWith('R') ||
      /^rs/i.test(trimmed);

    if (!looksLikeCurrency) continue;

    candidates.push({
      amount: Math.round(value),
      score: hasDecimal ? 2 : 1,
    });
  }

  if (candidates.length === 0) return null;

  return candidates.reduce((best, current) =>
    current.score > best.score || (current.score === best.score && current.amount > best.amount)
      ? current
      : best,
  ).amount;
}

export async function extractPaymentAmountFromImage(file: File): Promise<number | null> {
  if (!file.type.startsWith('image/')) {
    return null;
  }

  const worker = await getWorker();
  const result = await worker.recognize(file);
  return parsePaymentAmountFromText(result.data.text);
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function preloadPaymentOcrWorker(): void {
  void getWorker().catch(() => {
    workerPromise = null;
  });
}
