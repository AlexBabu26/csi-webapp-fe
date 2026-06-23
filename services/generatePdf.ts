/**
 * Browser-side PDF generation from a DOM element using html2pdf.js.
 * html2pdf is loaded on demand so registration form preview stays lightweight.
 */

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

function formatDownloadTimestampIst(): string {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export async function generatePdfFromElement(
  element: HTMLElement,
  options: GeneratePdfOptions,
): Promise<void> {
  const { filename, scale = 2 } = options;
  const html2pdf = await loadHtml2Pdf();

  await waitForImagesInElement(element);
  const restoreImages = await inlineVisibleImagesForPdf(element);

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

    await html2pdf()
      .set(opt)
      .from(element)
      .toPdf()
      .get('pdf')
      .then((pdf) => {
        const pageCount = pdf.internal.getNumberOfPages();
        pdf.setPage(pageCount);
        pdf.setFontSize(8);
        pdf.setTextColor(102, 102, 102);
        const footerText = `Downloaded on: ${formatDownloadTimestampIst()}`;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.text(footerText, pageWidth - 15, pageHeight - 8, { align: 'right' });
      })
      .save();
  } finally {
    restoreImages();
  }
}
