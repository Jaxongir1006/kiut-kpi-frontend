import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '@/api/axiosInstance';
import { isSafeUrl } from '@/lib/safeUrl';

/** Keep a server-supplied name from escaping the download folder. */
function sanitizeFilename(name) {
  const cleaned = (name || '').replace(/[\\/]+/g, '_').replace(/^\.+/, '').trim();
  return cleaned || 'yuklama';
}

function filenameFromHeaders(headers) {
  const disposition = headers?.['content-disposition'] || headers?.get?.('content-disposition');
  if (!disposition) return null;

  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      return encoded[1];
    }
  }

  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1] : null;
}

function filenameFromUrl(url) {
  try {
    const { pathname } = new URL(url, window.location.origin);
    return decodeURIComponent(pathname.split('/').filter(Boolean).pop() || '');
  } catch {
    return '';
  }
}

/**
 * Download a protected media file with the bearer header and wrap it in an object URL.
 * A plain <img src> / <a href> against these URLs now gets a 401.
 *
 * The caller owns the returned object URL and MUST call `revoke()` — until then the
 * whole file stays in memory.
 *
 * @param {string | null | undefined} url
 * @returns {Promise<{objectUrl: string, filename: string, blob: Blob, revoke: () => void} | null>}
 */
export async function fetchProtectedMedia(url) {
  if (!url) return null;
  // The value comes from the database and is echoed back into the DOM as an object URL.
  if (!isSafeUrl(url)) throw new Error(`Xavfsiz bo'lmagan manzil: ${url}`);

  const response = await axiosInstance.get(url, {
    responseType: 'blob',
    returnFullResponse: true,
  });

  const objectUrl = URL.createObjectURL(response.data);

  return {
    objectUrl,
    blob: response.data,
    filename: sanitizeFilename(filenameFromHeaders(response.headers) || filenameFromUrl(url)),
    revoke: () => URL.revokeObjectURL(objectUrl),
  };
}

/** Explicit release, for callers that keep the object URL in their own state. */
export function revokeProtectedMedia(objectUrl) {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
}

/**
 * Object URL for a protected image/file, revoked on unmount and whenever `url` changes.
 *
 * @param {string | null | undefined} url
 * @returns {{url: string | null, isLoading: boolean, error: any}}
 */
export function useProtectedMedia(url) {
  // Keyed by the url it was produced for, so a stale result is ignored during render
  // instead of being cleared with an extra setState pass inside the effect.
  const [resolved, setResolved] = useState(null);

  useEffect(() => {
    if (!url) return undefined;

    let cancelled = false;
    let objectUrl = null;

    fetchProtectedMedia(url)
      .then((media) => {
        if (cancelled) {
          // Unmounted or url changed mid-flight: the cleanup below already ran,
          // so nothing else will ever free this one.
          media?.revoke();
          return;
        }
        objectUrl = media?.objectUrl ?? null;
        setResolved({ source: url, url: objectUrl, error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        setResolved({ source: url, url: null, error });
      });

    return () => {
      cancelled = true;
      revokeProtectedMedia(objectUrl);
    };
  }, [url]);

  const isCurrent = !!url && resolved?.source === url;

  return useMemo(
    () => ({
      url: isCurrent ? resolved.url : null,
      isLoading: !!url && !isCurrent,
      error: isCurrent ? resolved.error : null,
    }),
    [url, isCurrent, resolved]
  );
}

/**
 * Fetch with auth and hand the file to the browser's save dialog.
 *
 * @param {string | null | undefined} url
 * @param {string} [filename] override for the server-derived name
 * @returns {Promise<boolean>} false when there was nothing to download
 */
export async function downloadProtectedMedia(url, filename) {
  const media = await fetchProtectedMedia(url);
  if (!media) return false;

  const link = document.createElement('a');
  link.href = media.objectUrl;
  link.download = filename ? sanitizeFilename(filename) : media.filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Revoking in the same tick cancels the save in some browsers.
  setTimeout(media.revoke, 0);
  return true;
}
