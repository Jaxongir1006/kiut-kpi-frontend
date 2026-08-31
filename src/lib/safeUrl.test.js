/**
 * URL scheme allowlisting.
 *
 * The event under test: proof_url is stored by a teacher and later rendered
 * into an href inside a REVIEWING ADMIN's authenticated session. A
 * `javascript:` value there executes with the reviewer's origin and can read
 * their JWT out of localStorage — a teacher escalating to admin by getting
 * someone to click "view document". rel="noopener noreferrer" does not block
 * the javascript: scheme; only refusing to render the href does.
 */
import { describe, it, expect } from 'vitest';
import { safeUrl, isSafeUrl } from './safeUrl';

describe('safeUrl', () => {
  it.each([
    ['javascript:alert(1)'],
    ['JavaScript:alert(1)'],
    ['  javascript:alert(1)'],
    // Browsers strip control characters before parsing the scheme, so a
    // newline inside the word does NOT make this safe in a real DOM.
    ['java\nscript:alert(1)'],
    ['java\tscript:alert(1)'],
    ['data:text/html,<script>alert(1)</script>'],
    ['vbscript:msgbox(1)'],
    ['file:///etc/passwd'],
  ])('rejects %j', (hostile) => {
    expect(safeUrl(hostile)).toBeUndefined();
    expect(isSafeUrl(hostile)).toBe(false);
  });

  it.each([[null], [undefined], [''], ['   '], [42], [{}], [[]]])(
    'returns undefined for the non-string / empty value %j',
    (value) => {
      expect(safeUrl(value)).toBeUndefined();
    },
  );

  it('accepts ordinary external proof links', () => {
    expect(safeUrl('https://doi.org/10.3390/as12030045')).toBe(
      'https://doi.org/10.3390/as12030045',
    );
    expect(safeUrl('http://example.org/paper.pdf')).toBe('http://example.org/paper.pdf');
  });

  it('absolutises a relative media path against our own origin', () => {
    expect(safeUrl('/media/proofs/3/x.pdf')).toBe(
      `${window.location.origin}/media/proofs/3/x.pdf`,
    );
  });

  it('does not let a scheme hide behind a leading slash trick', () => {
    // "/\evil.com" and "//evil.com" both resolve to an http(s) URL, so they are
    // returned — but on a DIFFERENT host. This test documents that safeUrl
    // guarantees only the SCHEME, never the destination: it is an XSS guard,
    // not an open-redirect guard. Callers rendering these as links accept that.
    const result = safeUrl('//evil.example.com/x');
    expect(result).toBeDefined();
    expect(new URL(result).protocol).toMatch(/^https?:$/);
  });
});
