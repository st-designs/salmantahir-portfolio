(function(){
  var fine = window.matchMedia('(pointer: fine)').matches;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Lenis. Touch is left on native inertia, which is already good and which
     scroll hijacking tends to make worse. Reduced motion opts out entirely. */
  var lenis = null;
  if (window.Lenis && !reduced){
    lenis = new Lenis({
      duration:0.9,
      easing:function(t){ return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel:true,
      syncTouch:false
    });
    var raf = function(time){ lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    // anchors go through Lenis so the easing matches the wheel
    document.addEventListener('click', function(e){
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id === '#' || id === '#top'){ e.preventDefault(); lenis.scrollTo(0); return; }
      var t = document.querySelector(id);
      if (t){ e.preventDefault(); lenis.scrollTo(t, {offset:-110}); }
    });
  }

  /* The mark deliberately does not animate. It duplicated the headline stroke's
     gesture a second later in the same colour, and the logo is the one element
     that should read as fixed. The .write keyframes are kept in the stylesheet
     if it is ever wanted somewhere it is not competing. */

  /* ---- header ---- */
  var hdr = document.getElementById('hdr');
  var onScroll = function(){ hdr.classList.toggle('stuck', window.scrollY > 24); };
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});

  var burger = document.getElementById('burger'), nav = document.getElementById('hnav');
  burger.addEventListener('click', function(){
    var open = nav.classList.toggle('open');
    burger.classList.toggle('on', open);
    burger.setAttribute('aria-expanded', open);
  });
  nav.addEventListener('click', function(e){
    if (e.target.closest('a')){
      nav.classList.remove('open'); burger.classList.remove('on');
      burger.setAttribute('aria-expanded','false');
    }
  });

  /* ---- the accent bleeds from wherever the pointer entered ---- */
  document.addEventListener('pointerover', function(e){
    var el = e.target.closest && e.target.closest('.act');
    if (!el) return;
    var r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, {passive:true});

  /* ---- reveals, reversible so they replay scrolling back up ---- */
  var items = document.querySelectorAll('.rv:not(.in), .stg:not(.in)');
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ en.target.classList.toggle('in', en.isIntersecting); });
    }, {threshold:.06, rootMargin:'0px 0px -8% 0px'});
    items.forEach(function(el){ io.observe(el); });
  } else {
    items.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---- discipline filter. Multi select, OR matched. The same markup and the
         same handler will drive the full case studies page. ---- */
  var filters = document.getElementById('filters');
  var grid = document.getElementById('workGrid');
  var empty = document.getElementById('emptyState');
  if (filters && grid){
    var all = filters.querySelector('.chip-all');
    var EASE = 'cubic-bezier(.22,1,.36,1)';
    /* enter and exit are the same move played in opposite directions: same
       duration, same easing, same scale, so leaving reads as the inverse of
       arriving rather than as a different effect */
    var FADE = 400, SC = .92;
    var busy = false, pending = false;

    /* Hiding a card is display:none, which drops it out of the grid instantly and
       snaps everything after it into the gap. So: fade the leaving cards out
       first, then FLIP the survivors, measuring where each one was before the
       reflow and animating it back from there to its new slot. */
    var apply = function(){
      // a click landing mid animation is deferred, never dropped, or the grid
      // would settle out of sync with the chips
      if (busy){ pending = true; return; }
      var on = [].slice.call(filters.querySelectorAll('.chip:not(.chip-all)[aria-pressed="true"]'))
                 .map(function(b){ return b.dataset.tag; });
      all.setAttribute('aria-pressed', on.length ? 'false' : 'true');

      var cards = [].slice.call(grid.querySelectorAll('.mini'));
      var keep = new Map();
      cards.forEach(function(c){
        var tags = (c.dataset.tags || '').split(' ');
        keep.set(c, !on.length || on.some(function(t){ return tags.indexOf(t) > -1; }));
      });

      // FIRST: where every visible card sits right now
      var first = new Map();
      cards.forEach(function(c){ if (!c.hidden) first.set(c, c.getBoundingClientRect()); });

      var reflow = function(){
        var shown = 0;
        cards.forEach(function(c){
          c.hidden = !keep.get(c);
          c.style.opacity = ''; c.style.transform = '';
          if (keep.get(c)) shown++;
        });
        empty.hidden = shown > 0;

        // LAST, INVERT, PLAY
        cards.forEach(function(c){
          if (c.hidden) return;
          var last = c.getBoundingClientRect(), f = first.get(c);
          if (!f){
            c.animate([{opacity:0, transform:'scale(' + SC + ')'},{opacity:1, transform:'none'}],
                      {duration:FADE, easing:EASE});
            return;
          }
          var dx = f.left - last.left, dy = f.top - last.top;
          if (Math.abs(dx) > .5 || Math.abs(dy) > .5){
            c.animate([{transform:'translate(' + dx + 'px,' + dy + 'px)'},{transform:'none'}],
                      {duration:520, easing:EASE});
          }
        });
        busy = false;
        // the work index batches its cards, and the batch has to recount
        // against whatever the filter just left visible
        window.dispatchEvent(new Event('workfiltered'));
        if (pending){ pending = false; apply(); }
      };

      var leaving = cards.filter(function(c){ return !c.hidden && !keep.get(c); });
      if (!leaving.length){ reflow(); return; }

      busy = true;
      var settled = false;
      // A backgrounded tab pauses animation timelines, so onfinish may never
      // arrive. Without this the reflow would never run and the filter would
      // stay locked, so the timer settles it either way.
      var finish = function(){
        if (settled) return;
        settled = true;
        leaving.forEach(function(c){ c.getAnimations().forEach(function(a){ a.cancel(); }); });
        reflow();
      };
      var done = 0;
      leaving.forEach(function(c){
        var a = c.animate([{opacity:1, transform:'none'},{opacity:0, transform:'scale(' + SC + ')'}],
                          {duration:FADE, easing:EASE, fill:'forwards'});
        var tick = function(){ if (++done >= leaving.length) finish(); };
        a.onfinish = tick;
        a.oncancel = tick;
      });
      setTimeout(finish, FADE + 190);
    };
    filters.addEventListener('click', function(e){
      var b = e.target.closest('.chip');
      if (!b) return;
      if (b === all){
        // "All" is a reset, not a toggle
        filters.querySelectorAll('.chip:not(.chip-all)').forEach(function(c){
          c.setAttribute('aria-pressed','false');
        });
      } else {
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      }
      apply();
    });
  }

  /* ---- rounded selection paint ---- */
  (function(){
    var layer = document.createElement('div');
    layer.className = 'sel-layer';
    layer.setAttribute('aria-hidden','true');
    document.body.appendChild(layer);
    document.documentElement.classList.add('selpaint');
    var queued = false;
    var paint = function(){
      queued = false;
      var sel = window.getSelection();
      layer.textContent = '';
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      var frag = document.createDocumentFragment();
      for (var i = 0; i < sel.rangeCount; i++){
        var range = sel.getRangeAt(i);
        var host = range.commonAncestorContainer;
        if (host && host.nodeType === 3) host = host.parentElement;
        var onDark = !!(host && host.closest && host.closest('.cta'));
        var rects = range.getClientRects();
        for (var j = 0; j < rects.length; j++){
          var r = rects[j];
          if (r.width < 0.5 || r.height < 0.5) continue;
          var d = document.createElement('span');
          d.className = onDark ? 'sel-rect on-dark' : 'sel-rect';
          d.style.left = (r.left + window.scrollX - 2.5) + 'px';
          d.style.top = (r.top + window.scrollY) + 'px';
          d.style.width = (r.width + 5) + 'px';
          d.style.height = r.height + 'px';
          d.style.borderRadius = Math.min(16, Math.round(r.height * 0.42)) + 'px';
          d.style.cornerShape = 'squircle';
          frag.appendChild(d);
        }
      }
      layer.appendChild(frag);
    };
    var schedule = function(){ if (!queued){ queued = true; requestAnimationFrame(paint); } };
    document.addEventListener('selectionchange', schedule);
    window.addEventListener('resize', schedule);
    window.__paintSelection = paint;
  })();

  /* Cursor chip over project imagery. Driven from a remembered pointer position
     rather than only from mousemove, so it keeps up when the page scrolls under
     a stationary cursor instead of freezing until the mouse is nudged. */
  if (fine){
    var px = -1, py = -1, chipRaf = null;
    var placeChip = function(){
      chipRaf = null;
      if (px < 0) return;
      var under = document.elementFromPoint(px, py);
      var box = under && under.closest ? under.closest('.shot, .mini-shot, .cs-feature, .rel-shot') : null;
      // the chip takes over as the pointer, so the arrow gets out of its way.
      // Driven from here rather than from the cursor handler so it also holds
      // while the page scrolls under a stationary mouse.
      var cur = document.querySelector('.cursor');
      if (cur) cur.classList.toggle('over-media', !!box);
      document.querySelectorAll('.chip-follow').forEach(function(c){
        var owner = c.parentElement;
        if (owner === box){
          var r = owner.getBoundingClientRect();
          c.style.transform = 'translate(' + (px - r.left) + 'px,' + (py - r.top) + 'px)';
          c.style.opacity = '1';
        } else {
          c.style.opacity = '';
        }
      });
    };
    var queueChip = function(){ if (!chipRaf) chipRaf = requestAnimationFrame(placeChip); };
    document.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse') return;
      px = e.clientX; py = e.clientY;
      queueChip();
    }, {passive:true});
    window.addEventListener('scroll', queueChip, {passive:true});
    if (lenis) lenis.on('scroll', queueChip);
  }

  /* ---- tap and click marker ---- */
  document.addEventListener('pointerdown', function(e){
    var dot = document.createElement('span');
    dot.className = 'ripple';
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
    document.body.appendChild(dot);
    dot.addEventListener('animationend', function(){ dot.remove(); });
  }, {passive:true});

  /* ---- marquee: arms only on bare layout background ---- */
  if (fine){
    var BLANK = ['MAIN','SECTION','FOOTER','HEADER'];
    var blankClass = ['wrap','bento','grid2','hero-btns','cta-actions','more-foot','about-foot'];
    var isBlank = function(el){
      if (el === document.body || el === document.documentElement) return true;
      if (BLANK.indexOf(el.tagName) > -1) return true;
      for (var i = 0; i < blankClass.length; i++){
        if (el.classList && el.classList.contains(blankClass[i])) return true;
      }
      return false;
    };
    var box = null, ox = 0, oy = 0, cx = 0, cy = 0, tick = null, lines = [];
    var indexText = function(){
      lines = [];
      var walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: function(n){
          if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          var p = n.parentElement;
          if (!p || p.closest('script,style,svg,.marquee,.cursor')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var n, r = document.createRange();
      while ((n = walk.nextNode())){
        r.selectNodeContents(n);
        var rects = r.getClientRects();
        if (rects.length) lines.push({ node:n, rects:Array.prototype.slice.call(rects) });
      }
    };
    var hits = function(rects,l,t,rg,b){
      for (var i=0;i<rects.length;i++){ var q=rects[i];
        if (q.left<rg && q.right>l && q.top<b && q.bottom>t) return true; }
      return false;
    };
    var paintBox = function(){
      tick = null;
      if (!box) return;
      var l=Math.min(ox,cx), t=Math.min(oy,cy), rg=Math.max(ox,cx), b=Math.max(oy,cy);
      box.style.left=l+'px'; box.style.top=t+'px';
      box.style.width=(rg-l)+'px'; box.style.height=(b-t)+'px';
      var first=-1,last=-1;
      for (var i=0;i<lines.length;i++){
        if (hits(lines[i].rects,l,t,rg,b)){ if(first<0)first=i; last=i; }
      }
      var sel = window.getSelection();
      if (first<0){ sel.removeAllRanges(); return; }
      var range = document.createRange();
      range.setStart(lines[first].node,0);
      range.setEnd(lines[last].node, lines[last].node.nodeValue.length);
      sel.removeAllRanges(); sel.addRange(range);
    };
    var draw = function(e){ cx=e.clientX; cy=e.clientY; if(!tick) tick=requestAnimationFrame(paintBox); };
    var done = function(){
      if (box){ box.remove(); box=null; }
      if (tick){ cancelAnimationFrame(tick); tick=null; }
      lines = [];
      window.removeEventListener('pointermove',draw);
      window.removeEventListener('pointerup',done);
      window.removeEventListener('pointercancel',done);
    };
    document.addEventListener('pointerdown', function(e){
      if (e.pointerType!=='mouse' || e.button!==0) return;
      if (!isBlank(e.target)) return;
      e.preventDefault();
      window.getSelection().removeAllRanges();
      ox=cx=e.clientX; oy=cy=e.clientY;
      indexText();
      box=document.createElement('div'); box.className='marquee';
      box.style.left=ox+'px'; box.style.top=oy+'px';
      document.body.appendChild(box);
      window.addEventListener('pointermove',draw,{passive:true});
      window.addEventListener('pointerup',done,{passive:true});
      window.addEventListener('pointercancel',done,{passive:true});
    });
  }

  /* ---- accent pointer ---- */
  if (fine && !reduced){
    var cur = document.createElement('div');
    cur.className = 'cursor';
    cur.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2.2 18.4 12.4l-6.6 1.1L8.7 19.9z" fill="currentColor"/></svg>';
    document.body.appendChild(cur);
    document.documentElement.classList.add('has-cursor');
    var invertOn = '.btn-primary, .cta, .chip-follow span, .chip[aria-pressed="true"]';
    document.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse') return;
      cur.style.transform = 'translate3d(' + (e.clientX-3.7) + 'px,' + (e.clientY-2) + 'px,0)';
      cur.classList.add('on');
      cur.classList.toggle('invert', !!(e.target.closest && e.target.closest(invertOn)));
    }, {passive:true});
    document.addEventListener('pointerdown', function(){ cur.classList.add('press'); }, {passive:true});
    document.addEventListener('pointerup', function(){ cur.classList.remove('press'); }, {passive:true});
    document.addEventListener('mouseleave', function(){ cur.classList.remove('on'); });
    document.addEventListener('mouseenter', function(){ cur.classList.add('on'); });
  }

  /* ---- a pill on a card selects that discipline in the filter above it ---- */
  document.addEventListener('click', function(e){
    var pill = e.target.closest && e.target.closest('.mini button.tag, .rel button.tag');
    if (!pill) return;
    e.preventDefault();
    var tag = pill.dataset.tag;
    var bar = document.getElementById('filters');
    if (!bar || !tag) return;
    var chip = bar.querySelector('.chip[data-tag="' + tag + '"]');
    if (chip) chip.click();
    bar.scrollIntoView({behavior: 'smooth', block: 'center'});
  });

  /* ---- work index: release cards in batches instead of paginating ---- */
  var wg = document.getElementById('workGrid');
  var moreWrap = document.getElementById('moreWrap');
  var moreBtn = document.getElementById('loadMore');
  if (wg && moreWrap && moreBtn){
    var BATCH = parseInt(wg.dataset.batch, 10) || 6;
    var shown = 0;

    // what the filter currently allows through, in DOM order
    var pool = function(){
      return Array.prototype.filter.call(wg.children, function(c){ return !c.hidden; });
    };
    var paint = function(){
      var list = pool();
      list.forEach(function(c, i){ c.classList.toggle('batched-out', i >= shown); });
      moreWrap.hidden = list.length <= shown;
    };
    var release = function(){
      shown += BATCH;
      paint();
    };
    // reset whenever the filter changes the pool
    window.addEventListener('workfiltered', function(){ shown = BATCH; paint(); });

    shown = BATCH;
    paint();
    moreBtn.addEventListener('click', release);

    // auto release as the end comes into view; the button stays for keyboard
    // users and for when the observer is unavailable
    if ('IntersectionObserver' in window){
      var sentinel = new IntersectionObserver(function(en){
        if (en[0].isIntersecting && !moreWrap.hidden) release();
      }, {rootMargin: '260px 0px'});
      sentinel.observe(moreWrap);
    }
  }


  /* ---- contact form: post without leaving the page ---- */
  var cf = document.getElementById('contactForm');
  if (cf){
    var msg = document.getElementById('formMsg');
    var btn = document.getElementById('submitBtn');
    var say = function(text, kind){
      msg.textContent = text;
      msg.className = 'form-msg on ' + kind;
    };
    cf.addEventListener('submit', function(e){
      e.preventDefault();
      var data = Object.fromEntries(new FormData(cf).entries());
      if (!data.name || !data.email || !data.message){
        say('Please fill in every field.', 'bad');
        return;
      }
      btn.disabled = true;
      var label = btn.innerHTML;
      btn.textContent = 'Sending';
      msg.className = 'form-msg';

      fetch('/api/contact', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(data)
      })
      .then(function(r){ return r.json().catch(function(){ return {ok:false}; }); })
      .then(function(r){
        if (r.ok){
          cf.reset();
          say('Thanks. That reached me, and I will reply to you directly.', 'ok');
        } else {
          say(r.error || 'Could not send that just now. Email me at salmantahir0831@gmail.com.', 'bad');
        }
      })
      .catch(function(){
        say('Could not send that just now. Email me at salmantahir0831@gmail.com.', 'bad');
      })
      .finally(function(){
        btn.disabled = false;
        btn.innerHTML = label;
      });
    });
  }

})();
