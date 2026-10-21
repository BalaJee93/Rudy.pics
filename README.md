# Rudy.pics

A simple photo gallery for Rudy. Plain HTML/CSS/JS with no build step, ready for GitHub Pages.

## Adding photos

1. Drop the image into `photos/` (resize it to about 1600px wide first so the page stays fast).
2. Add an entry to `photos.js`:

   ```js
   { src: "photos/first-steps.jpg", caption: "First steps!", date: "2026-10-01" },
   ```

3. Commit and push. The site updates in a minute or two.

## Hosting on rudy.pics

1. In the GitHub repo, go to **Settings → Pages** and set the source to deploy from the `main` branch, root folder.
2. At your domain registrar, point `rudy.pics` at GitHub Pages:
   - `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` record for `www`: `balajee93.github.io`
3. Back in **Settings → Pages**, once DNS resolves, tick **Enforce HTTPS**.

The `CNAME` file in this repo already tells GitHub Pages to use `rudy.pics`.

## Privacy

The site asks search engines not to index it (`robots.txt` and a `noindex` meta tag). Anyone with the link can still see it, and the repo itself is public if the repo is public. Strip location data (EXIF/GPS) from photos before uploading.
