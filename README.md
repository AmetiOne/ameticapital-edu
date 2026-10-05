# ameticapital-edu

Static source for **https://ameticapital.com**: free educational worksheets for break-even analysis,
contribution margin and fixed vs variable costs. Published by Ameti One LLC. Educational only; not
investment, capital advisory, succession or M&A services.

- Plain HTML/CSS/JS, no build step. The repository root is the Cloudflare Pages output directory.
- Sibling site (separate, never a redirect): https://ameti.capital (margin / markup / pricing worksheets).
- Calculators run in the browser (`tools.js`); nothing is sent to a server.

## Pages (13 indexable + 404)

| Path | Purpose |
|---|---|
| `/` | Hub |
| `/tools/`, `/tools/break-even/`, `/tools/contribution-margin/` | Calculators |
| `/guides/` + `contribution-margin/`, `break-even-units-vs-revenue/`, `fixed-vs-variable-costs/`, `target-profit-margin-of-safety/` | Guides |
| `/about/`, `/contact/`, `/privacy/`, `/terms/` | Publisher, corrections, legal |
| `/404.html` | Real 404 (noindex) |

## SEO conventions

- Titles 50-60 chars, meta descriptions 140-160, one H1, self-referencing canonical on `https://ameticapital.com`.
- `sitemap.xml` lists every indexable URL with `lastmod`; update `lastmod` when a page changes.
- JSON-LD: WebSite + Organization on `/`, Article on guides, WebPage elsewhere, BreadcrumbList on children. No FAQ markup.
- `_headers` sets `X-Robots-Tag: noindex` on `*.pages.dev` hosts so only the custom domain is indexed.
- Worked numbers are illustrative arithmetic and must stay labeled as such. Cite a source for any external fact.

## Deploy

Direct Upload (no git integration). Export a clean copy of `main` without `README.md` and `.git`
(for example `git archive main | tar -x -C /tmp/out && rm /tmp/out/README.md`), then run
`wrangler pages deploy /tmp/out --project-name ameticapital-edu --branch main`.
Record the new deployment ID and the previous production deployment ID for rollback.
