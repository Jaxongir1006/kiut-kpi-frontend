// Only these two schemes may ever reach an href/src attribute.
// `javascript:` and `data:` execute in the origin of the page that renders them,
// and proof_url values are attacker-supplied: a teacher can store one and it is
// then rendered inside a reviewing admin's authenticated session.
const SAFE_PROTOCOLS = ['http:', 'https:'];

/**
 * Normalise a stored URL for use in href/src.
 *
 * @param {unknown} value raw value from the API (may be null, relative, or hostile)
 * @returns {string | undefined} an absolute http(s) URL, or undefined if it is not safe to render
 */
export function safeUrl(value) {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  let parsed;
  try {
    // Relative values ("/media/proof.pdf") are legitimate and resolve against our own origin.
    parsed = new URL(trimmed, window.location.origin);
  } catch {
    return undefined;
  }

  if (!SAFE_PROTOCOLS.includes(parsed.protocol)) return undefined;
  return parsed.href;
}

/** Predicate form, for hiding a link entirely rather than rendering a dead one. */
export function isSafeUrl(value) {
  return safeUrl(value) !== undefined;
}

export default safeUrl;
