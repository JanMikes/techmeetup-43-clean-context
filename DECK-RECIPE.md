# Building a talk deck like this one

A complete spec for rebuilding the CLEAN CONTEXT deck's look and delivery
pipeline for a different talk. Hand this file to a fresh Claude Code session
along with your content; it should not need to reverse-engineer anything from
the original repo.

Reference implementation: <https://techmeetup-43-1.janmikes.cz>
Source: <https://github.com/JanMikes/techmeetup-43-clean-context>

---

## 0. The brief this was built to

High-contrast conference slides for a 10–15 minute lightning talk, terminal
aesthetic, big type readable from the back of the room, important keywords
highlighted. Delivered as a static site on GitHub Pages behind a custom domain,
so the audience can open it on their phones during the talk.

Two constraints drove nearly every decision below:

1. **It must not be able to fail live.** No build step, no `node_modules`, no
   CDN, no network at render time. Open `index.html` and it works — on venue
   wifi, on no wifi, from a USB stick.
2. **The audience will read it on a phone.** It is a public URL that goes on a
   QR code, so every slide has to work at 390px as well as on a projector.

---

## 1. Stack decision: no framework

Reveal.js and Slidev were both considered and rejected. Use plain HTML/CSS/JS
unless your deck genuinely needs something they provide.

**Why not Slidev**, specifically, because it is the tempting choice:

- Its big win is Shiki syntax highlighting, but slides like these contain ASCII
  diagrams, shell snippets and hand-picked highlighted keywords — not real code.
  Shiki actively fights that; you want manual `<mark>` spans.
- A fully bespoke look means overriding most of its theme system anyway, plus
  writing Vue layouts on top.
- It adds a Vite build that can break at 18:00 on the day of the talk.

Markdown authoring is the one thing you give up. In practice, editing text
between `<h2>` tags is barely harder, and you get total layout control.

---

## 2. File layout

```
index.html      the deck — one <section class="slide"> per slide, in order
style.css       everything visual
deck.js         navigation, notes, jump index, theme, copy buttons
prompt.html     a companion long-form page the deck links to
qr.svg          QR to the live URL
photo-{320,480,640}.webp   responsive portrait
CNAME           the custom domain, one line
.nojekyll       stops GitHub Pages running Jekyll over the files
README.md       how to present and edit it
```

No config files, no package.json, no dependencies.

---

## 3. Theming: two token blocks, and one hard rule

All colour lives in CSS custom properties, defined twice — once on `:root` for
dark, once on `body.light`. Every rule in the stylesheet references tokens
only.

```css
:root {
  --bg:      #0a0c0d;
  --panel:   #101618;   /* terminal block background */
  --fg:      #e9ecea;
  --fg-soft: #cfd6d2;   /* quoted text: softer than --fg, still readable */
  --dim:     #74827d;   /* captions, comments, de-emphasised text */
  --green:   #4ff08c;   /* primary accent / highlight */
  --amber:   #ffc14d;   /* warnings */
  --red:     #ff6b5e;   /* failures */
  --line:    #202829;   /* borders */
  --overlay: #060809;   /* full-bleed presenter overlays */
  --overlay-fg: #c6cfca;
  --mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Monaco,
          "Cascadia Mono", "Roboto Mono", Consolas, monospace;
}

body.light {
  --bg:      #f5f3ee;   /* warm off-white, not pure white */
  --panel:   #e7e4db;
  --fg:      #14181a;
  --fg-soft: #2f3639;
  --dim:     #5c6560;
  --green:   #06703a;   /* darkened: the dark-mode accents fail on light */
  --amber:   #8a5200;
  --red:     #b3261e;
  --line:    #d6d2c7;
  --overlay: #ffffff;
  --overlay-fg: #2f3639;
}
html.light { background: #f5f3ee; }   /* avoids a dark flash on load */
```

> **The rule: never write a colour literal outside those two blocks.**
> This is the single most common way to break a themed deck, and it fails
> silently — you only find it when you switch themes and a block of text has
> vanished into the background. In this deck `.term.quote` had a hardcoded
> `#cfd6d2` that was invisible in light mode.
>
> The only legitimate exceptions are colours that must *not* flip: a QR code's
> white quiet zone (it has to scan), and the `html.light` background above.
> Audit with:
> ```bash
> awk '/^body\.light \{/{l=1} /^:root \{/{r=1}
>      l&&/^\}/{l=0;next} r&&/^\}/{r=0;next}
>      !l&&!r&&/#[0-9a-fA-F]{3,6}|rgba?\(/{printf "%4d  %s\n", NR, $0}' style.css
> ```

**Light vs dark as the default.** Dark looks better on a screen and suits a
terminal aesthetic; light survives a bright room and a weak projector far
better. Ship both, default to dark, and let the presenter decide in the venue.
Do **not** wire it to `prefers-color-scheme` — the presenting machine's system
theme should not decide how a projected deck looks.

---

## 4. Typography and scale

The trick that makes one stylesheet work on a laptop, a 4K projector and a
phone: **scale the root font-size on both viewport axes**, then size everything
in `rem`.

```css
html { font-size: clamp(13px, calc(0.5vw + 0.95vh), 26px); }
```

Using both `vw` and `vh` means the deck adapts to any aspect ratio rather than
only 16:9. On 1920×1080 this lands around 18px; on a phone it bottoms out at
13px, which is where the mobile overrides in §6 take over.

Everything is monospace, including headings — it is what sells the terminal
feel more than any colour choice.

```css
h1 { font-size: 4.6rem; line-height: 1.02; }
h2 { font-size: 3.3rem; }
h3 { font-size: 1.5rem; color: var(--dim); font-weight: 500; }  /* eyebrow */
```

Slide titles are `<h1>`/`<h2>`; `<h3>` is the small dim label above a slide
("THE SHAPE", "LAUNCH"). Force line breaks with `<br>` so titles break where
you want them to, not where the box happens to end.

---

## 5. The terminal block

The signature element. A left accent border rather than a fake window chrome —
cleaner and it scales down without looking silly.

```css
.term {
  font-family: var(--mono);
  background: var(--panel);
  border: 1px solid var(--line);
  border-left: 3px solid var(--green);
  border-radius: 3px;
  padding: 1.5rem 1.8rem;
  font-size: 1.5rem;
  line-height: 1.65;
  white-space: pre;        /* preserves ASCII alignment */
  overflow-x: auto;        /* long lines scroll inside the block */
  color: var(--fg);
}
.term.quote { border-left-color: var(--dim); color: var(--fg-soft); }
.term.warn  { border-left-color: var(--amber); }
.term.bad   { border-left-color: var(--red); }
.term.xl    { font-size: 2rem; }
.term.sm    { font-size: 1.2rem; }
```

Markup, with the shell prompt and comments as spans:

```html
<pre class="term"><span class="dim"># survive a dropped terminal</span>
<span class="gr">$</span> tmux new -s claude
<span class="gr">$</span> claude --permission-mode <mark>bypassPermissions</mark></pre>
```

**Highlighting.** `<mark>` is redefined as a colour highlight, not a yellow
background:

```css
mark { background: none; color: var(--green); font-weight: 700; }
mark.warn { color: var(--amber); }
mark.bad  { color: var(--red); }
```

Discipline that makes this work on a projector: **at most three highlighted
tokens per slide**, and the highlighted words across the whole deck should read
as a coherent sentence if someone only scans them.

---

## 6. Responsiveness

Three separate problems, all of which will bite you.

**a. Type sized for a projector overflows a phone.** One media query with an
explicit smaller scale, triggered by width *or* a coarse pointer:

```css
@media (pointer: coarse), (max-width: 860px) {
  .slide { padding: 4vh 5vw 6rem; gap: 1rem; }
  h1 { font-size: 2.3rem; }
  h2 { font-size: 1.9rem; }
  .term { font-size: 0.85rem; padding: 1rem 1.1rem; }
  .term.xl { font-size: 0.95rem; }
  /* .sm is a TWO-class selector, so it outranks the .term rule above and
     would otherwise render LARGER than the mobile base. */
  .term.sm { font-size: 0.72rem; }
}
```

> **Specificity gotcha, worth stating loudly:** any modifier like `.term.sm` or
> `.term.xl` beats a single-class `.term` rule inside a media query. Every
> size modifier you define needs its own mobile override or it will silently
> render at desktop size.

**b. Content taller than the viewport was being clipped with no way to reach
it.** Never let a slide hide its own content:

```css
.slide { overflow-y: auto; overflow-x: hidden; }
```

**c. "Click anywhere to advance" gives no way back and no hint that swiping
works.** Add real buttons on touch devices:

```css
.tapnav { position: fixed; bottom: 0; left: 0; right: 0; display: none;
          justify-content: space-between; padding: 0.6rem 0.9rem 1.1rem;
          z-index: 45; pointer-events: none; }
.tapnav button { pointer-events: auto; width: 3rem; height: 3rem;
                 border-radius: 999px; background: var(--panel);
                 border: 1px solid var(--line); color: var(--fg); }
.tapnav button:disabled { opacity: 0.3; }
@media (pointer: coarse), (max-width: 860px) { .tapnav { display: flex; } }
```

Disable them at the ends of the deck so the affordance tells the truth.

**Verifying narrow layouts.** Chrome refuses to resize its window below a
minimum, so you cannot test 390px by resizing. Media queries *do* respond to
iframe dimensions, so use a harness page:

```html
<iframe src="/#/6" style="width:390px;height:730px"></iframe>
<script>
setTimeout(() => {
  const d = document.querySelector('iframe').contentDocument;
  const s = d.querySelector('.slide.is-active');
  console.log('vOverflow', s.scrollHeight - s.clientHeight,
              'hOverflow', d.documentElement.scrollWidth - d.documentElement.clientWidth);
}, 1500);
</script>
```

Anything above ~2px on either axis means the slide is clipping. Check the
slides with the widest diagram, the longest list, the biggest type and any
image grid — those are where it breaks.

Do **not** try to sweep all slides by rapidly assigning `location.hash` in a
loop; that froze the renderer. Toggle `display` on the slides instead, or check
a representative sample.

---

## 7. Slide markup

```html
<section class="slide">
  <h3>EYEBROW LABEL</h3>
  <h1>THE BIG<br>STATEMENT</h1>
  <pre class="term">…</pre>
  <p class="why"><span class="arrow">→</span> the takeaway, with <mark>a highlight</mark></p>
  <div class="act">act 4 · turbulence</div>
  <aside class="notes-src">Speaker notes for this slide. <b>Bold the delivery cues.</b></aside>
</section>
```

- `.notes-src` is `display: none` — it is a data carrier read by the runtime for
  the notes overlay, never rendered on the slide. **Do not forget this rule**;
  without it every speaker note prints on the slide.
- `.act` is also hidden but kept in the DOM, because the jump index reads it for
  its right-hand column and for flags like `CUT IF LONG`.
- Slide count, the counter and the jump list are all derived from the DOM, so
  adding or removing a `<section>` needs no other change.

> **Never hardcode slide numbers in copy or speaker notes** ("that's why slide 9
> had tmux"). Inserting one slide silently invalidates every such reference.
> Name the slide instead: "that's why the launch slide had tmux".

---

## 8. The runtime (`deck.js`)

Roughly 180 lines, no dependencies. What it must do:

| Concern | Implementation |
|---|---|
| Next | `Enter`, `Space`, `→`, `↓`, `PageDown`, click anywhere, swipe left |
| Previous | `←`, `↑`, `PageUp`, `Backspace`, swipe right |
| First / last | `Home` / `End` |
| Speaker notes | `N` — reads `.notes-src` of the active slide into a bottom overlay |
| Jump index | `O` — titled list of every slide, click to jump |
| Theme | `T` — toggles `body.light`, persisted in `localStorage` |
| Fullscreen | `F` |
| Help | `?` |
| Deep links | `#/12` in the URL, kept in sync via `history.replaceState` |

Two things worth copying exactly:

**Don't let a key do double duty.** `n` was in both the next-slide list and the
notes toggle; the notes handler returned first, so the deck silently ignored it
as a nav key.

**Build the jump index from the slides themselves**, converting `<br>` to spaces:

```js
// innerText would collapse <br> correctly, but it falls back to textContent
// for non-rendered elements — and all but one slide is hidden.
const tmp = document.createElement('div');
tmp.innerHTML = h ? h.innerHTML.replace(/<br\s*\/?>/gi, ' ') : '—';
label.textContent = tmp.textContent.replace(/\s+/g, ' ').trim();
```

Without the `<br>` replacement you get `CLEANCONTEXT`.

**Theme persistence**, wrapped because storage throws in some contexts:

```js
function setTheme(light) {
  document.body.classList.toggle('light', light);
  document.documentElement.classList.toggle('light', light);
  try { localStorage.setItem('deck-theme', light ? 'light' : 'dark'); } catch (e) {}
}
try { if (localStorage.getItem('deck-theme') === 'light') setTheme(true); } catch (e) {}
```

**Copy buttons** — put the canonical text in a data attribute rather than
scraping it out of display markup, so reformatting the slide cannot corrupt it:

```html
<button class="copy-btn" data-text="the exact text to copy">COPY</button>
```

**Click handling** must not hijack real controls:

```js
if (e.target.closest('button, a, .notes, .help, .jump, .tapnav, input, textarea')) return;
```

---

## 9. Photos

Optimise aggressively; a 2 MB PNG became 56 KB across three widths.

```bash
# square crop framing the face, then three widths as WebP
magick photo.png -crop 1023x1023+0+130 +repage /tmp/sq.png
for w in 320 480 640; do
  magick /tmp/sq.png -resize ${w}x${w} -strip -quality 82 photo-${w}.webp
done
```

```html
<img class="portrait" alt="Speaker name"
     src="photo-480.webp"
     srcset="photo-320.webp 320w, photo-480.webp 480w, photo-640.webp 640w"
     sizes="(max-width: 860px) 40vw, 28vw"
     width="480" height="480" decoding="async">
```

```css
.portrait { width: 28vw; max-width: 20rem; height: auto;
            border-radius: 50%; border: 3px solid var(--line); }
```

> **Gotcha that cost real time:** `aspect-ratio: 1` combined with
> `object-fit: cover` and `height: auto` made Chrome render the border but
> **not the image** — no console error, `complete === true`, and the pixels
> drew fine to a canvas. If your source files are already square you need
> neither property; crop them square and let the natural dimensions do the work.

Layout: portrait beside the title on desktop, stacked above it on mobile.

```css
.title-grid { display: flex; align-items: center; gap: 5vw; }
@media (pointer: coarse), (max-width: 860px) {
  .title-grid { flex-direction: column-reverse; align-items: flex-start; gap: 1.5rem; }
  .portrait { width: 8rem; }
}
```

WebP needs no fallback — universal since 2020.

---

## 10. ASCII diagrams

Hand-spaced ASCII art will drift, and it looks sloppy projected. Put the
diagram on an explicit character grid and **verify the columns before shipping**:

```python
lines = [
"            ORCHESTRATOR      ← reads only the ledger",
"                  │",
"       ┌──────────┼──────────┐",
"       ▼          ▼          ▼",
"  implementer  reviewer  architect",
]
def cols(line, ch): return [i for i, c in enumerate(line) if c == ch]
def centre(line, word):
    i = line.index(word); return i + (len(word) - 1) / 2

print(cols(lines[3], '▼'))                    # want the same columns
print([centre(lines[4], w) for w in ('implementer','reviewer','architect')])
```

Pick your branch columns first (e.g. 7 / 18 / 29), then pad labels to centre on
them. Half-character offsets from even-length words are invisible; whole-
character drift is not.

```css
.diagram { white-space: pre; overflow-x: auto; max-width: 100%; }
```

`overflow-x` matters — without it a wide diagram widens the whole page on a
phone.

---

## 11. Links and the companion page

A talk deck should not try to be the handout. Keep slides sparse and put the
long-form material on a second static page (`prompt.html` here) that the closing
slide links to and the QR code reaches. Give it:

- the one thing you actually want people to take away, first and copyable
- the supporting detail nobody can absorb from a slide
- an honest limitations section

Style it as a normal document — narrow measure (`max-width: 82ch`),
`white-space: pre-wrap` on code blocks so long prompts wrap — reusing the same
tokens. It is read on a phone, not projected.

---

## 12. Static build, GitHub Pages, Cloudflare

There is no build. Commit the files and enable Pages on the repo root.

```bash
printf 'talk.example.com\n' > CNAME     # custom domain
touch .nojekyll                          # skip Jekyll processing

gh api -X POST /repos/OWNER/REPO/pages \
  -f 'source[branch]=main' -f 'source[path]=/'
```

DNS — a `CNAME` from your subdomain to `OWNER.github.io`:

```js
// Cloudflare API
{ type: "CNAME", name: "talk", content: "OWNER.github.io",
  ttl: 1, proxied: false }
```

> **The Cloudflare record must stay DNS-only (grey cloud).** Proxying it stops
> GitHub provisioning the Let's Encrypt certificate, and later breaks its
> renewal — a long-standing, well-documented failure. GitHub Pages already sits
> behind a CDN, so proxying buys nothing.

The certificate takes roughly 10–20 minutes after DNS resolves. Until it
exists, enabling HTTPS returns `404 The certificate does not exist yet`, so
poll for it:

```bash
until gh api -X PUT /repos/OWNER/REPO/pages -F 'https_enforced=true' 2>&1 \
      | grep -qv "certificate does not exist"; do sleep 60; done
```

Repo must be public for Pages on the free tier.

**PDF backup.** Add a print stylesheet and export before the talk — it is the
thing that saves you when the venue's display setup misbehaves.

```css
@media print {
  @page { size: 297mm 167mm; margin: 0; }
  .slide { position: relative; display: flex !important;
           width: 297mm; height: 167mm; page-break-after: always; }
  .progress, .counter, .notes, .help, .tapnav, .jump { display: none !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
```

---

## 13. Verify contrast by measuring, not by looking

Run this in the console with the deck open. It walks every rendered text
element against its real resolved background, in both themes, and reports WCAG
failures (4.5:1 normal text, 3:1 large).

```js
const lum = c => { const [r,g,b] = c.map(v => { v/=255;
  return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
  return 0.2126*r + 0.7152*g + 0.0722*b; };
const parse = s => (s.match(/[\d.]+/g) || []).slice(0,3).map(Number);
const alpha = s => { const m = s.match(/[\d.]+/g); return m && m.length > 3 ? +m[3] : 1; };
const bgOf = el => { let n = el;
  while (n && n !== document.documentElement) {
    const b = getComputedStyle(n).backgroundColor;
    if (b && alpha(b) > 0.5) return parse(b);
    n = n.parentElement; }
  return parse(getComputedStyle(document.body).backgroundColor); };
const ratio = (a,b) => { const l1 = lum(a), l2 = lum(b);
  return (Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05); };

const st = document.createElement('style');
st.textContent = '.slide{display:flex !important}';
document.head.appendChild(st);
for (const theme of ['dark','light']) {
  document.body.classList.toggle('light', theme === 'light');
  const bad = [];
  document.querySelectorAll('.slide h1,.slide h2,.slide h3,.slide p,.slide pre,.slide span,.slide li,.slide mark,.slide div')
    .forEach(el => {
      const txt = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
      if (!txt) return;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
      const need = (px >= 24 || (bold && px >= 18.66)) ? 3 : 4.5;
      const r = ratio(parse(cs.color), bgOf(el));
      if (r < need) bad.push({ txt: txt.slice(0,40), r: +r.toFixed(2), need });
    });
  console.log(theme, bad.length ? bad : 'OK');
}
document.body.classList.remove('light'); st.remove();
```

Target zero failures in both themes.

---

## 14. Checklist before the talk

- [ ] Contrast audit: 0 failures, both themes
- [ ] No colour literals outside the two token blocks
- [ ] Every slide checked at 390px — no vertical or horizontal clipping
- [ ] No hardcoded slide numbers in copy or speaker notes
- [ ] `.notes-src` hidden; no speaker notes visible on slides
- [ ] Theme chosen and set on the presenting machine (it is per-browser)
- [ ] PDF exported and on the desktop
- [ ] QR code scans from the back of the room, error correction `H`
- [ ] `tmux` / `caffeinate` equivalent so the machine does not sleep mid-talk
