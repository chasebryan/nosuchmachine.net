# No Such Machine

Chase Bryan’s independent work in mathematics and cryptography, centered on Orange.

**Production domain:** [nosuchmachine.net](https://nosuchmachine.net)

![Orange-focused homepage preview](docs/redesign-preview.jpg)

## Structure

- The homepage presents Orange as the sole main project, followed by a brief introduction to Chase. Navigation leads to Orange, the Orange Book, About, and GitHub.
- A restrained layout, readable type, and orange accents replace the project catalog and animated background. The homepage has no canvas visuals or motion controls.
- The complete Orange Book is hosted at `/book/`, with a table of contents, 24 chapter pages, chapter navigation, section links, and local full-text search. The reader follows the original manuscript's order, including its preface, appendices, manuscript map, and source disclosure.
- All 40 existing project pages remain available at `/projects/<slug>/`, with their purpose, implementation, maturity, limitations, repository, and documentation links.
- `src/data/catalog.json` owns the project content. The [repository inventory](docs/repository-inventory.json) and [review report](docs/portfolio-review.md) record the public-repository review and earlier curation decisions.
- `src/data/book.json` records the book's publication metadata and chapter order; `src/content/book/` contains the generated chapter Markdown. The full upstream manuscript is retained in `vendor/orange/THE_ORANGE_BOOK.md` and available to download at `/book/orange-book.md`.
- The sitemap includes the catalog and all hosted book pages. Executable scripts must remain external to comply with the existing Cloudflare content-security policy.

## Develop

```sh
# Node 22.23.3 (.nvmrc). engines.node is >=22.23.3 so the locked undici floor (>=22.19.0) is met.
npm ci
npm run dev
npm run check
npm run build
npm run verify
npm run preview
```

`verify` confirms that Orange is the only featured catalog project and the only project linked from the homepage, and that the homepage has no canvas visuals or motion controls. It checks every hosted book chapter, reading order, previous/next links, active chapter navigation, search-index coverage, and consistency with the vendored manuscript. It also checks all generated project routes and source references, sitemap entries, internal links and anchors, image/script assets, unique IDs, one main landmark and heading per page, and CSP-compatible script output. CI runs the type check, build, and this integration check.

## Update the Orange Book

The hosted edition is pinned to Orange Book v0.26, snapshot October 2, 2026, from Orange revision [`4394a66201ff59d73bdd1dea38637bf9b7f37421`](https://github.com/chasebryan/orange/commit/4394a66201ff59d73bdd1dea38637bf9b7f37421). Builds use the committed manuscript and chapters without fetching upstream content, so the book remains available independently of GitHub.

To import a newer edition from a local Orange checkout with a clean `docs/THE_ORANGE_BOOK.md`:

```sh
npm run sync:book -- --repo /path/to/orange
npm run check
npm run build
npm run verify
```

Review and commit the updated vendored manuscript, downloadable source, metadata, and chapter files together. The import records the source commit, preserves chapter URLs, and rewrites manuscript-relative links for the hosted reader. If a new edition changes the section structure, update the chapter map and descriptions in `scripts/sync-orange-book.mjs` and the pinned chapter count in `scripts/verify-build.mjs` as part of that edition review.

`npm run sync:book` regenerates chapters from the committed manuscript. `npm run sync:book -- --check` checks the generated metadata and chapters without writing files or accessing the network.

## Deploy

https://nosuchmachine.net is served by Cloudflare Pages. The apex and www resolve to Cloudflare anycast addresses, and responses include `server: cloudflare` and `cf-ray`. GitHub Pages is not enabled for this repository and does not serve the domain. `.github/workflows/deploy-github-pages.yml` and `public/CNAME` have been removed so Pages cannot claim the hostname.

`.github/workflows/deploy-cloudflare.yml` publishes project `nosuchmachine-net` with Wrangler. It runs on `workflow_dispatch`, a daily schedule (06:17 UTC), and `repository_dispatch` type `orange-book-updated`. Each run executes `npm run sync:book` before the build so the Orange Book can be refreshed from `chasebryan/orange`. The workflow is read-only for `GITHUB_TOKEN` and does not run on pull requests.

It needs repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The October 2026 Actions run failed because those secrets were missing, and the workflow was disabled manually afterwards. Re-enable **Deploy Cloudflare Pages** in the Actions tab after the secrets exist.

Cloudflare Pages Git integration publishes `main` and branch previews without these secrets. Keep the Pages project name `nosuchmachine-net` (see `wrangler.toml`) and the custom domains on that project. Set the project's Node.js version to `22.23.3` (`.nvmrc`) if the dashboard build is pinned.

Production apex `https://nosuchmachine.net` is a **Cloudflare** zone. Historically it was published by Cloudflare Pages project `wuci-ji` from [`chasebryan/-wuci-ji`](https://github.com/chasebryan/-wuci-ji). This repository is now the source of truth for the public portfolio.

`bottle.nosuchmachine.net` remains a separate Cloudflare Worker in `-wuci-ji` — do not remove that subdomain.

### Cloudflare Pages

1. Cloudflare API token with **Cloudflare Pages — Edit** (and Account read) for project `nosuchmachine-net`.
2. Repository secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
3. Re-enable the **Deploy Cloudflare Pages** workflow if it is still disabled, then run it with **workflow_dispatch** or wait for the daily schedule.
4. Custom domains on project `nosuchmachine-net`: `nosuchmachine.net` and `www.nosuchmachine.net`. Remove those hostnames from the old `wuci-ji` Pages project if they are still attached.
5. Keep Always Use HTTPS and HSTS on the zone. `bottle.nosuchmachine.net` is a separate Worker; do not change it.

GitHub Pages is retired for this site. Do not turn Pages back on for `nosuchmachine.net`.

## License

GNU Affero General Public License v3.0 — see [LICENSE](LICENSE).
