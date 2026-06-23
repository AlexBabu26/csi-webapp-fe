/**
 * Browser-side PDF generation from a DOM element using html2pdf.js.
 * html2pdf is loaded on demand so registration form preview stays lightweight.
 */

import { formatNowDateTimeIST } from '../utils/datetime';

export interface GeneratePdfOptions {
  filename: string;
  scale?: number;
}

export async function waitForImagesInElement(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalHeight > 0) {
            resolve();
            return;
          }
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        }),
    ),
  );
}

function loadedImageToDataUrl(img: HTMLImageElement): string | null {
  if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
    return null;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/** Temporarily swap logo src to data URLs so html2canvas can embed them in the PDF. */
async function inlineVisibleImagesForPdf(element: HTMLElement): Promise<() => void> {
  const restored: Array<{ img: HTMLImageElement; src: string }> = [];

  for (const img of Array.from(element.querySelectorAll('img'))) {
    const originalSrc = img.src;
    const dataUrl = loadedImageToDataUrl(img);
    if (!dataUrl) {
      continue;
    }

    restored.push({ img, src: originalSrc });
    img.src = dataUrl;
  }

  if (restored.length > 0) {
    await waitForImagesInElement(element);
  }

  return () => {
    for (const { img, src } of restored) {
      img.src = src;
    }
  };
}

async function loadHtml2Pdf() {
  const module = await import('html2pdf.js');
  return module.default;
}

const PDF_DOWNLOAD_FOOTER_ATTR = 'data-pdf-download-footer';

/**
 * Injects a download timestamp into the last content block so html2pdf renders
 * it on the final page instead of creating a separate trailing page (jsPDF overlay).
 */
function appendDownloadFooter(element: HTMLElement): HTMLElement {
  const sections = element.querySelectorAll('.break-inside-avoid');
  const container = sections.length > 0 ? sections[sections.length - 1] : element;

  const footer = document.createElement('p');
  footer.setAttribute(PDF_DOWNLOAD_FOOTER_ATTR, 'true');
  footer.textContent = `Downloaded on: ${formatNowDateTimeIST()}`;
  footer.style.marginTop = '12px';
  footer.style.fontSize = '10px';
  footer.style.color = '#666666';
  footer.style.textAlign = 'right';
  footer.style.fontFamily = 'Arial, sans-serif';
  footer.style.pageBreakBefore = 'avoid';
  footer.style.breakBefore = 'avoid';
  container.appendChild(footer);
  return footer;
}

export async function generatePdfFromElement(
  element: HTMLElement,
  options: GeneratePdfOptions,
): Promise<void> {
  const { filename, scale = 2 } = options;
  const html2pdf = await loadHtml2Pdf();

  await waitForImagesInElement(element);
  const restoreImages = await inlineVisibleImagesForPdf(element);
  const downloadFooter = appendDownloadFooter(element);

  try {
    const opt = {
      margin: [10, 15, 14, 15],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        letterRendering: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      },
      pagebreak: {
        mode: ['css', 'legacy'],
      },
    };

    await html2pdf().set(opt).from(element).save();
  } finally {
    downloadFooter.remove();
    restoreImages();
  }
}
