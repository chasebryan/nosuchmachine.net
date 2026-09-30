# No Such Machine

Portfolio site for [Chase Bryan](https://github.com/chasebryan) — a selected
showcase of ambitious projects, not a dump of every repository.

**Live:** [https://nosuchmachine.net](https://nosuchmachine.net)

## Featured now

| Project | Summary | Links |
| --- | --- | --- |
| **Orange** | Language and toolchain for cryptography you can check | [repo](https://github.com/chasebryan/orange) · [Orange Book](https://github.com/chasebryan/orange/blob/main/docs/THE_ORANGE_BOOK.md) · [Orange School](https://github.com/chasebryan/orange-school) |

Add further featured entries in `src/data/projects.ts`.

## Stack

- [Astro](https://astro.build) static site
- Typed project catalog in `src/data/projects.ts`
- Static assets under `public/`

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # output in dist/
npm run preview  # serve the production build
```

## Deploy

Build produces static files in `dist/`. Suitable for Cloudflare Pages, GitHub
Pages, or any static host. Set the publish directory to `dist` and the build
command to `npm run build`.

## License

GNU Affero General Public License v3.0 — see [LICENSE](LICENSE).
