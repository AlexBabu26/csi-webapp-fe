/** Trigger a browser download from a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

/** Parse filename from Content-Disposition header when present. */
export function getFilenameFromContentDisposition(
  header: string | null,
  fallback: string,
): string {
  if (!header) return fallback;
  const match = /filename=\"?([^\";]+)\"?/i.exec(header);
  return match?.[1] ?? fallback;
}
