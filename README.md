# CLEAN CONTEXT

Lightning talk for **Tech Meetup #43** — *how to run Claude Code for days without
remembering anything.*

**Live:** https://techmeetup-43-1.janmikes.cz
**Full prompt:** https://techmeetup-43-1.janmikes.cz/prompt.html

## Running it

Open `index.html`. That's it — no build step, no dependencies, no CDN. It works
offline, which is the point when you're presenting on venue wifi.

```
python3 -m http.server 8000    # if you want a local server
```

## Presenting

| key | |
|---|---|
| `enter` `space` `→` `↓` `pagedown` | next slide |
| `←` `↑` `pageup` `backspace` | previous slide |
| `N` | speaker notes |
| `O` | overview grid (click a slide to jump) |
| `F` | fullscreen |
| `home` / `end` | first / last slide |
| `?` | keyboard help |

Click anywhere also advances. The URL tracks the slide (`#/12`), so a mid-talk
reload puts you back where you were.

**PDF backup:** `Cmd+P` → Save as PDF. The print stylesheet lays it out one
slide per landscape page. Do this before the talk and keep it on the desktop.

## Editing

`index.html` is 26 `<section class="slide">` blocks in running order. To change a
slide, edit the text inside it.

- `<mark>` — accent highlight (green). `<mark class="warn">` amber, `<mark class="bad">` red.
- `<pre class="term">` — terminal block. Add `xl` for bigger, `quote` for a prompt excerpt.
- `<aside class="notes-src">` — speaker notes for that slide, shown with `N`.
- `.marker` (top right) and `.act` (bottom left) are the flight/act labels.

Slide count in the counter is derived automatically, so adding or removing a
section needs no other change.

## Deployment

GitHub Pages from `main`, custom domain via `CNAME`.

The Cloudflare DNS record must stay **DNS-only (grey cloud)**. Proxying it stops
GitHub from issuing the Let's Encrypt certificate, and later breaks its renewal.
GitHub Pages is already behind a CDN, so there's nothing to gain by proxying.
