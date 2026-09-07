# Sharing this + version control

Two jobs: somewhere the client can look at it, and somewhere the code lives.
One setup covers both — push to GitHub, connect a host, every push
redeploys.

## 1. Repo

```bash
cd simple-insurance
git init
git add .
git commit -m "Rebuild from Figma design system"
git branch -M main
git remote add origin git@github.com:<you>/simple-insurance.git
git push -u origin main
```

`.gitignore` already excludes `node_modules`, `dist` and `.astro`.

Make it **private**. The client's site is live at the same content, and the
regulatory text in the footer is real — not something to leave in a public
repo.

## 2. Host

Any of these build Astro with zero config, free tier, auto-deploy on push:

| Host | Build command | Publish dir | Notes |
|---|---|---|---|
| **Netlify** | `npm run build` | `dist` | Netlify Forms would solve the contact form (see below) |
| **Cloudflare Pages** | `npm run build` | `dist` | Free password protection via Cloudflare Access |
| **Vercel** | auto-detected | auto | Fastest setup |

Connect the repo, set the build command, done. You get a URL like
`simple-insurance.netlify.app` to send the client.

### Keep the preview out of Google

Set an environment variable on the preview deploy:

```
PUBLIC_NOINDEX=true
```

That adds `<meta name="robots" content="noindex, nofollow">`. Without it
you'd have two copies of the same copy competing in search — the client's
live site and your rebuild. Leave the variable unset for production.

Better still, password-protect it. Cloudflare Access does this free;
Netlify and Vercel put it on paid tiers.

## 3. Client review

Send the deployed URL, not the zip — they'll see it on their own phone,
which is where the mobile nav and the reveals actually matter.

Every push updates the same URL, so feedback rounds don't need new links.
Netlify and Vercel also build a unique preview URL per pull request, which
is handy if you want to show two directions side by side.

## 4. The form

`ContactForm.astro` posts to `/api/enquiry`, which doesn't exist yet — the
form will 404 on submit. Options:

- **Netlify Forms** — add `data-netlify="true"` and a hidden `form-name`
  field, and Netlify captures submissions with no backend. Cheapest path.
- **Formspree / Basin** — change the `action` to their endpoint. Host-agnostic.
- **Astro server endpoint** — needs a Node or serverless adapter, so the
  site stops being purely static.

Worth sorting before the client tests it, otherwise the first thing they do
is submit the form and hit an error.

## Still open before launch

- Consultants & Advisory icon (the drawn briefcase)
- How It Works steps 02 and 03 copy
- Our Numbers section — built from live copy, not matched to Figma `896:1396`
- Legal pages: `/legals`, `/privacy`, `/terms-of-engagement`, `/complaints`
- Footer "Explore" links have no destinations
