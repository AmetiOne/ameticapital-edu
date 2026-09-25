# ameticapital.com — educational business arithmetic hub

Static educational worksheets published by **MasterEngine AI** for the domain **ameticapital.com**.

This is a **distinct** educational hub — not a mirror of [ameti.capital](https://ameti.capital/), and **not** investment, capital advisory, succession or M&A services. Spelling is **Ameti** (e) everywhere.

## What is here

| Path | Purpose |
| --- | --- |
| `/` | Hub home |
| `/tools/` | Tools index |
| `/tools/break-even/` | Interactive break-even worksheet (browser-only inputs) |
| `/guides/` | Guides index |
| `/guides/contribution-margin/` | Contribution margin primer |
| `/about/` | Publisher, method, soft-collision disclaimer |
| `/privacy/`, `/terms/`, `/contact/` | Legal / contact |
| `/robots.txt`, `/sitemap.xml` | Canonical host `https://ameticapital.com/` |
| `/404.html` | Not found |
| `/style.css`, `/tools.js` | Shared styles and calculator helpers |

Stack: plain HTML/CSS/JS. No Next.js, no Astro, no build step required.

Brand accent: `--brand: #3d5650` (calm green-gray; distinct from ameti.capital `#4a5c4d`). Ads / AdSense meta: none (Ads HOLD).

## Preview locally

From this directory:

```bash
cd /workspace/ameticapital-edu
python3 -m http.server 8787
```

Open `http://127.0.0.1:8787/` in a browser. Paths use directory `index.html` files (`/tools/break-even/`, etc.).

## Deploy (Cloudflare Pages)

Ready for **Cloudflare Pages** Direct Upload or a git-connected Pages project (suggested project name: `ameticapital-edu`).

**Do not** attach these files to the existing Pages project `ameti-capital` (that serves ameti.capital). **Do not** leave the live cross-domain 301 `ameticapital.com` → `ameti.capital` in place after cutover.

Exact dashboard steps, redirect-rule removal, custom domains, MX/SPF preservation and verification curls:

→ `/workspace/capital-margin/DEPLOY-ameticapital-edu.md`

Locks to respect unless Jet unlocks otherwise: Gate 3 HOLD (merge ≠ deploy claims), Ads HOLD, CF free tier, leave ameti.capital untouched.

## Contact

contact@ameticapital.com
