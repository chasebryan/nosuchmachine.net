# No Such Machine

Spare portfolio site for [Chase Bryan](https://github.com/chasebryan).

**Live:** [https://nosuchmachine.net](https://nosuchmachine.net)

## Structure

| Route | Purpose |
| --- | --- |
| `/` | Brand home — nosuchmachine.net, path into Orange, Chase’s GitHub |
| `/projects/orange` | Dedicated Orange page (repo, Orange Book, Orange School) |

Future projects get their own `/projects/[slug]` pages. The home page stays
simple — not a project dump. Catalog data lives in `src/data/projects.ts`.

## Stack

- [Astro](https://astro.build) static site
- Original brand SVGs in `public/brand/` (no reused wuci-ji / old site art)
- Orange identity assets from [chasebryan/orange](https://github.com/chasebryan/orange)

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # output in dist/
npm run preview  # serve the production build
```

## Deploy

Build produces static files in `dist/`. Suitable for Cloudflare Pages, GitHub
Pages, or any static host (`npm run build`, publish `dist`).

## License

GNU Affero General Public License v3.0 — see [LICENSE](LICENSE).
