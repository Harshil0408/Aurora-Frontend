import { config } from '@/lib/config';
import { tokenManager } from '@/lib/tokenManager';

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * Multipart POST with real progress + cancel, through the same-origin BFF.
 *
 * RTK Query/axios carry a JSON default content-type and a 15s timeout, so
 * file uploads go through raw XHR instead: the browser sets the multipart
 * boundary, the BFF forwards raw bytes, and multer parses server-side.
 * Auth mirrors apiClient (Bearer + cookies + request id).
 */
export function uploadFilesXHR<T>({
  url,
  files,
  field = 'files',
  extra,
  onProgress,
  timeoutMs = 10 * 60 * 1000,
}: {
  /** Same-origin path, e.g. `/seller/catalog/<id>/media` (apiProxyBase is prefixed). */
  url: string;
  files: File[];
  field?: string;
  extra?: Record<string, string>;
  onProgress?: (p: UploadProgress) => void;
  timeoutMs?: number;
}): { promise: Promise<T>; abort: () => void } {
  const xhr = new XMLHttpRequest();
  const form = new FormData();
  for (const f of files) form.append(field, f, f.name);
  if (extra) for (const [k, v] of Object.entries(extra)) form.append(k, v);

  const promise = new Promise<T>((resolve, reject) => {
    xhr.open('POST', `${config.apiProxyBase}${url}`);
    xhr.withCredentials = true;
    xhr.timeout = timeoutMs;
    const token = tokenManager.getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    try {
      xhr.setRequestHeader('x-request-id', crypto.randomUUID());
    } catch {
      /* non-secure contexts — backend mints one */
    }
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      onProgress?.({ loaded: e.loaded, total: e.total, percent: Math.round((e.loaded / e.total) * 100) });
    };
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as {
          success: boolean;
          data?: T;
          error?: { message?: string };
        };
        if (xhr.status >= 200 && xhr.status < 300 && body.success && body.data !== undefined) {
          resolve(body.data);
        } else {
          reject(new Error(body.error?.message ?? `Upload failed (${xhr.status})`));
        }
      } catch {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out — try a smaller file'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));
    xhr.send(form);
  });
  return { promise, abort: () => xhr.abort() };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
