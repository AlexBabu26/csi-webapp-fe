import { ComponentType, lazy } from 'react';

const CHUNK_RELOAD_KEY = 'csi-chunk-reload';

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('Loading chunk') ||
    message.includes('ChunkLoadError')
  );
}

export function reloadOnChunkError(error: unknown): boolean {
  if (!isChunkLoadError(error)) {
    return false;
  }

  if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    window.location.reload();
    return true;
  }

  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  return false;
}

export function clearChunkReloadFlag(): void {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
}

export function lazyImport<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(() =>
    factory().catch((error) => {
      if (reloadOnChunkError(error)) {
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }),
  );
}
