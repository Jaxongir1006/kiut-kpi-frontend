# KIUT KPI — frontend

React SPA for the KIUT KPI system: the interface staff use to submit evidence of
their academic work, and the one the commission uses to review it and settle the
scores that decide performance pay under the KIUT_KPI_v2 regulation (the Nizom).

| | |
|---|---|
| Live | https://kiut-kpi.duckdns.org |
| API | https://api-kpi.duckdns.org ([backend repo](https://github.com/Jaxongir1006/Kiut-kpi)) |
| Stack | React 19, Vite, Redux Toolkit, react-router 7, Radix + Tailwind |

```bash
npm ci
cp .env.example .env      # then set VITE_API_URL
npm run dev               # http://localhost:5174
```

| Command | |
|---|---|
| `npm run dev` | dev server |
| `npm run lint` | ESLint — **CI gates on this and it is currently clean** |
| `npm run test` | vitest, watch mode |
| `npm run test:ci` | vitest once, with coverage |
| `npm run build` | production build into `dist/` |

## Things that will bite you

**The API is a different origin.** The SPA is served from
`kiut-kpi.duckdns.org` and the API from `api-kpi.duckdns.org`. Every call is
cross-origin, so the backend must list this exact origin in
`CORS_ALLOWED_ORIGINS`, and every mutation costs a preflight. `VITE_API_URL`
must be the absolute `https://` URL — a relative value resolves against the
SPA's own origin and 404s.

**`VITE_*` values are inlined at build time.** Nothing in `.env` is a secret;
whatever you put there is readable in the shipped JavaScript. It also cannot be
changed on the server afterwards — pointing a deployed build at a different API
means rebuilding.

**Uploaded files need the bearer token.** Proof documents, appeal attachments
and staff photos are personal data and the backend authorises every download, so
a plain `<img src>` or `<a href>` gets a 401 — the browser sends no
`Authorization` header on those. Use the helpers:

| For | Use |
|---|---|
| an `<img>` of a photo | `useProtectedMedia(url)` from `src/lib/protectedMedia.js` |
| a download link | `downloadProtectedMedia(url)`, or `<ProtectedFileLink>` |
| a proof value that may be a file *or* an external DOI link | `<ProofLink>` — it decides which |

`useProtectedMedia` revokes its blob URL on unmount. Do not hand-roll this: a
leaked blob URL pins the whole file in memory, and these are 10 MB PDFs rendered
one per row.

**Never put an API value straight into `href`.** `proof_url` is supplied by
teachers and rendered inside a *reviewing admin's* session. A `javascript:` value
there executes with the reviewer's origin and can read their token.
`rel="noopener noreferrer"` does not block that scheme. Route every URL through
`safeUrl()` from `src/lib/safeUrl.js`, or use `<SafeLink>`.

**Every list endpoint is paginated** — `{count, next, previous, results}`, 50 by
default, 200 maximum. Never treat a list response as a bare array. Use
`src/lib/pagination.js`:

- `fetchAllPages(url)` — walks to exhaustion, for bounded reference data
  (departments, roles, types, teachers). The teacher list *must* be complete:
  `useUserRole` resolves the logged-in user out of it, and a teacher on page 2
  gets `teacherProfile: null` and cannot submit anything.
- `fetchPagedList(url)` — one 200-row page plus `count`/`hasMore`, for
  collections that grow without bound (submissions, summaries).

**Session handling is automatic.** `src/api/axiosInstance.js` refreshes on 401
and retries, single-flight: concurrent 401s share one refresh call. That matters
because the backend rotates and blacklists refresh tokens, so N parallel
refreshes would invalidate each other's tokens and log the user out. Do not add
a second refresh path.

**A failed fetch is not an empty list.** Slices set `error` on rejection. Render
`<ErrorState>`, not `<EmptyState>` — on the review screen, "nothing to review"
when the request actually failed means approvals silently do not happen.

## Layout

```
src/
  api/         axios instance: auth header, refresh, error sanitising
  app/         redux store
  features/    one slice per domain (thunks + reducers)
  lib/         safeUrl, protectedMedia, pagination, AuthContext
  components/  shared/ (SafeLink, ProofLink, ErrorState…), ui/ (shadcn), layout/
  pages/       Admin/ and Teacher/ screens
  context/     i18n (uz / ru / en)
```

Keys in `src/context/LanguageContext.jsx` must be unique per language. A
duplicate silently wins over the earlier copy, so editing the first one appears
to do nothing — `no-dupe-keys` is on for exactly this reason.

## Deployment

Merge to `main`. CI runs lint, tests, build and a production dependency audit; a
green run ships that exact commit to the VPS over an SSH key restricted to a
forced command, which can only hand `deploy/frontend-receiver.sh` a tarball.
Releases are published by swapping a symlink, so a rollback is instant and a
half-extracted build is never served.

Required repository secrets: `VPS_HOST`, `VPS_KNOWN_HOSTS`, `VPS_SSH_KEY`.

## Known gaps

- The token lives in `localStorage`, so any XSS can read it. The scheme
  allowlisting above closes the vector that existed; moving to an `httpOnly`
  cookie would close the class, and needs a backend change.
- `Settings → Audit Log` and the teacher notifications page have no backend
  endpoint yet and render honest empty states rather than invented data.
- The site logo currently points at `/favicon.svg`. The original external URL
  was blocked by the deployed CSP; drop a real logo into `public/` and update
  the six `<img src>` references.
- The main bundle is ~1.2 MB (339 kB gzipped). Route-level code splitting is the
  obvious next win.
