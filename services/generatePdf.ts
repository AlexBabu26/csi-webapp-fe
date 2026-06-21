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

/** Draw an already-loaded <img> into a data URL (works for same-origin / CORS-enabled images). */
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

async function loadImageWithCors(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(loadedImageToDataUrl(img));
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Replace remote image URLs in the PDF clone with data URLs.
 * Uses images already rendered on the page first, then a CORS reload as fallback.
 */
async function inlineImagesForPdf(sourceElement: HTMLElement, clone: HTMLElement): Promise<void> {
  const sourceImages = Array.from(sourceElement.querySelectorAll('img'));
  const cloneImages = Array.from(clone.querySelectorAll('img'));

  await Promise.all(
    cloneImages.map(async (cloneImg, index) => {
      const src = cloneImg.getAttribute('src') || cloneImg.src;
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
        return;
      }

      const sourceImg = sourceImages[index];
      let dataUrl = sourceImg ? loadedImageToDataUrl(sourceImg) : null;

      if (!dataUrl) {
        dataUrl = await loadImageWithCors(src);
      }

      if (!dataUrl) {
        return;
      }

      await new Promise<void>((resolve) => {
        cloneImg.onload = () => resolve();
        cloneImg.onerror = () => resolve();
        cloneImg.src = dataUrl!;
        if (cloneImg.complete) {
          resolve();
        }
      });
    }),
  );
}

async function loadHtml2Pdf() {
  const module = await import('html2pdf.js');
  return module.default;
}

export async function generatePdfFromElement(
  element: HTMLElement,
  options: GeneratePdfOptions,
): Promise<void> {
  const { filename, scale = 2 } = options;
  const html2pdf = await loadHtml2Pdf();

  await waitForImagesInElement(element);

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.width = `${element.scrollWidth}px`;
  clone.style.background = '#ffffff';
  document.body.appendChild(clone);

  try {
    await inlineImagesForPdf(element, clone);
    await waitForImagesInElement(clone);

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
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
      },
    };

    await html2pdf().set(opt).from(clone).save();
  } finally {
    clone.remove();
  }
}
