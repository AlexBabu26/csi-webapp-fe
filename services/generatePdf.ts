/**
 * Browser-side PDF generation from a DOM element using html2pdf.js.
 * This produces output that exactly matches what the browser renders,
 * including all table layouts, pagination, and print CSS rules.
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – html2pdf.js ships no TypeScript types
import html2pdf from 'html2pdf.js';

export interface GeneratePdfOptions {
  filename: string;
  /** Scale factor for html2canvas (2 = 192 dpi, 3 = 288 dpi). Defaults to 2. */
  scale?: number;
}

/**
 * Render `element` to a downloadable A4 PDF that matches the browser layout.
 * Respects `page-break-inside: avoid` / `break-inside: avoid` CSS rules.
 * Stamps "Page X of Y" centred at the bottom of every page.
 */
export function generatePdfFromElement(
  element: HTMLElement,
  options: GeneratePdfOptions,
): Promise<void> {
  const { filename, scale = 2 } = options;

  const opt = {
    margin: [10, 15, 14, 15], // top, right, bottom, left in mm — extra bottom for page number
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale,
      useCORS: true,
      logging: false,
      letterRendering: true,
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

  return html2pdf()
    .set(opt)
    .from(element)
    .toPdf()
    .get('pdf')
    .then((pdf: any) => {
      const totalPages: number = pdf.internal.getNumberOfPages();
      const pageWidth: number = pdf.internal.pageSize.getWidth();
      const pageHeight: number = pdf.internal.pageSize.getHeight();

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 5, // 5 mm from the bottom edge
          { align: 'center' },
        );
      }
    })
    .save();
}
