/* CLEAN CONTEXT — deck runtime. No dependencies. */
(function () {
  'use strict';

  var slides   = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var progress = document.getElementById('progress');
  var counter  = document.getElementById('counter');
  var notes    = document.getElementById('notes');
  var notesBody= document.getElementById('notes-body');
  var help     = document.getElementById('help');
  var jump     = document.getElementById('jump');
  var jumpList = document.getElementById('jump-list');
  var tapPrev  = document.getElementById('tap-prev');
  var tapNext  = document.getElementById('tap-next');
  var total    = slides.length;
  var current  = 0;

  counter.innerHTML = '<span class="cur">1</span> / ' + total;

  /* ---------- theme ---------- */

  function setTheme(light) {
    document.body.classList.toggle('light', light);
    document.documentElement.classList.toggle('light', light);
    try { localStorage.setItem('cc-theme', light ? 'light' : 'dark'); } catch (e) {}
  }

  try {
    if (localStorage.getItem('cc-theme') === 'light') setTheme(true);
  } catch (e) { /* private window, blocked storage — dark is the default anyway */ }

  /* ---------- jump index, built from the slides themselves ---------- */

  slides.forEach(function (s, n) {
    var h = s.querySelector('h1, h2, h3');
    var act = s.querySelector('.act');
    var li = document.createElement('li');
    li.innerHTML =
      '<span class="i">' + (n + 1) + '</span>' +
      '<span class="t"></span>' +
      '<span class="a"></span>';
    // innerText would collapse <br> correctly, but it falls back to
    // textContent for non-rendered elements — and 25 of 26 slides are hidden.
    var tmp = document.createElement('div');
    tmp.innerHTML = h ? h.innerHTML.replace(/<br\s*\/?>/gi, ' ') : '—';
    li.querySelector('.t').textContent =
      tmp.textContent.replace(/\s+/g, ' ').trim();
    li.querySelector('.a').textContent =
      act ? act.textContent.split('·')[0].trim() : '';
    li.addEventListener('click', function () {
      closeJump();
      show(n);
    });
    jumpList.appendChild(li);
  });

  function closeJump() { jump.classList.remove('is-open'); }

  function toggleJump() {
    var on = jump.classList.toggle('is-open');
    if (on) {
      Array.prototype.forEach.call(jumpList.children, function (li, n) {
        li.classList.toggle('cur', n === current);
      });
    }
  }

  /* ---------- navigation ---------- */

  function show(i, push) {
    current = Math.max(0, Math.min(total - 1, i));
    slides.forEach(function (s, n) { s.classList.toggle('is-active', n === current); });

    progress.style.width = ((current + 1) / total * 100) + '%';
    counter.innerHTML = '<span class="cur">' + (current + 1) + '</span> / ' + total;

    var src = slides[current].querySelector('.notes-src');
    notesBody.innerHTML = src ? src.innerHTML : '<span style="opacity:.5">no notes for this slide</span>';

    tapPrev.disabled = current === 0;
    tapNext.disabled = current === total - 1;

    if (push !== false) {
      history.replaceState(null, '', '#/' + (current + 1));
    }
  }

  function next() { if (current < total - 1) show(current + 1); }
  function prev() { if (current > 0) show(current - 1); }

  /* ---------- keyboard ---------- */

  var NEXT_KEYS = ['Enter', ' ', 'Spacebar', 'ArrowRight', 'ArrowDown', 'PageDown'];
  var PREV_KEYS = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'];

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    var k = e.key;

    // modal-ish overlays first
    if (k === '?' || (k === '/' && e.shiftKey)) {
      help.classList.toggle('is-open');
      e.preventDefault();
      return;
    }
    if (k === 'Escape') {
      help.classList.remove('is-open');
      closeJump();
      return;
    }

    if (k === 'n' || k === 'N') {
      notes.classList.toggle('is-open');
      e.preventDefault();
      return;
    }
    if (k === 'o' || k === 'O') {
      toggleJump();
      e.preventDefault();
      return;
    }
    if (k === 't' || k === 'T') {
      setTheme(!document.body.classList.contains('light'));
      e.preventDefault();
      return;
    }
    if (k === 'f' || k === 'F') {
      if (document.fullscreenElement) { document.exitFullscreen(); }
      else { document.documentElement.requestFullscreen(); }
      e.preventDefault();
      return;
    }

    if (k === 'Home') { show(0); e.preventDefault(); return; }
    if (k === 'End')  { show(total - 1); e.preventDefault(); return; }

    if (jump.classList.contains('is-open')) return;

    if (NEXT_KEYS.indexOf(k) > -1) {
      next();
      e.preventDefault();
    } else if (PREV_KEYS.indexOf(k) > -1) {
      prev();
      e.preventDefault();
    }
  });

  /* ---------- pointer ---------- */

  tapPrev.addEventListener('click', prev);
  tapNext.addEventListener('click', next);

  document.addEventListener('click', function (e) {
    // never hijack real controls
    if (e.target.closest('button, a, .notes, .help, .jump, .tapnav, input, textarea')) return;
    if (jump.classList.contains('is-open')) return;
    next();
  });

  // swipe, for the people reading this on a phone from the QR code
  var touchX = null;
  document.addEventListener('touchstart', function (e) {
    touchX = e.changedTouches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (touchX === null || jump.classList.contains('is-open')) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 60) { dx < 0 ? next() : prev(); }
    touchX = null;
  }, { passive: true });

  /* ---------- copy button ---------- */

  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.dataset.text;
      if (!text) return;

      navigator.clipboard.writeText(text).then(function () {
        var was = btn.textContent;
        btn.textContent = 'COPIED ✓';
        btn.classList.add('done');
        setTimeout(function () {
          btn.textContent = was;
          btn.classList.remove('done');
        }, 1800);
      });
    });
  });

  /* ---------- boot: honour #/n so a reload keeps your place ---------- */

  var m = /^#\/(\d+)$/.exec(location.hash);
  show(m ? parseInt(m[1], 10) - 1 : 0, false);

  window.addEventListener('hashchange', function () {
    var h = /^#\/(\d+)$/.exec(location.hash);
    if (h) show(parseInt(h[1], 10) - 1, false);
  });
})();
