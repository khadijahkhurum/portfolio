(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Floating nav: adds a translucent background once the hero is scrolled past.
  (function () {
    var nav = document.getElementById("site-nav");
    if (!nav) return;
    function update() {
      nav.classList.toggle("is-scrolled", window.scrollY > 40);
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  })();

  // Scroll progress: thin lime line at the top, width = scroll position.
  (function () {
    var bar = document.getElementById("scroll-progress-bar");
    if (!bar) return;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = pct + "%";
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  })();

  // Nav active-section indicator: highlight the link for whichever
  // section id is currently in view.
  (function () {
    var links = document.querySelectorAll('.nav-links a[href^="#"]');
    if (!links.length || !("IntersectionObserver" in window)) return;
    var sections = [];
    links.forEach(function (link) {
      var section = document.getElementById(link.getAttribute("href").slice(1));
      if (section) sections.push({ link: link, section: section });
    });
    if (!sections.length) return;
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var match = sections.find(function (s) { return s.section === entry.target; });
          if (!match) return;
          if (entry.isIntersecting) {
            links.forEach(function (l) { l.classList.remove("is-active"); });
            match.link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    sections.forEach(function (s) { navObserver.observe(s.section); });
  })();

  // Hero load-in: staggered fade/rise, per the timing spec. Skips straight
  // to the resolved state under reduced motion instead of firing timers.
  (function () {
    var items = document.querySelectorAll("[data-reveal-text]");
    if (!items.length) return;
    if (reduceMotion) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var delays = [300, 500, 650, 900];
    items.forEach(function (el, i) {
      setTimeout(function () { el.classList.add("is-in"); }, delays[i] || 300 + i * 200);
    });
  })();

  // Scroll reveal (generic + approach statements, which color in one at a time)
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // Same-page anchor links: smooth-scroll (native jump under reduced motion).
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  // Pipeline widgets (FAIR + the SOC lab cards): click a stage to swap
  // the caption below it. Each instance is scoped to its own
  // .case-visual-inner so multiple pipelines on the page don't cross-wire.
  (function () {
    document.querySelectorAll("[data-pipeline]").forEach(function (pipeline) {
      var scope = pipeline.closest(".case-visual-inner") || pipeline.parentElement;
      var buttons = pipeline.querySelectorAll("[data-stage-btn]");
      var details = scope.querySelectorAll("[data-pipeline-detail]");
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var stage = btn.getAttribute("data-stage-btn");
          buttons.forEach(function (b) { b.setAttribute("aria-expanded", b === btn ? "true" : "false"); });
          details.forEach(function (d) { d.hidden = d.getAttribute("data-pipeline-detail") !== stage; });
        });
      });
    });
  })();

  // Work-section track filter: ALL / SOC / GRC. Swaps the section's
  // data-track (which re-themes accent colour + density via CSS),
  // shows/hides project cards by data-category, and renumbers the
  // visible case-number labels in DOM order for whichever set is shown.
  (function () {
    var section = document.querySelector(".work[data-track]");
    var filterBtns = document.querySelectorAll("[data-track-btn]");
    var contextLines = document.querySelectorAll("[data-track-context-line]");
    var cards = document.querySelectorAll(".work-list .case");
    if (!section || !filterBtns.length || !cards.length) return;

    var hideDelay = reduceMotion ? 0 : 260;

    // Mode-aware content blocks (About copy, Approach stages, Technology
    // toolkit, What I Work With) each carry data-track-variant="all|soc|grc".
    // Only the block matching the active track is ever attached to the
    // document - the others are genuinely removed (not display:none'd) so
    // no track's content leaks into another and no mode leaves a gap.
    // Each block's original parent + next-sibling is captured once up
    // front so it can be reinserted in the same spot when its track is
    // selected again.
    var variantState = Array.prototype.map.call(document.querySelectorAll("[data-track-variant]"), function (el) {
      el.removeAttribute("hidden");
      return { el: el, variant: el.getAttribute("data-track-variant"), parent: el.parentNode, anchor: el.nextSibling };
    });
    function applyVariants(track) {
      variantState.forEach(function (v) {
        if (v.variant === track) {
          if (!v.el.isConnected) v.parent.insertBefore(v.el, v.anchor);
        } else if (v.el.isConnected) {
          v.el.remove();
        }
      });
    }
    applyVariants("all"); // strip non-ALL variants from the initial document state

    function renumber() {
      var n = 0;
      cards.forEach(function (card) {
        if (card.classList.contains("is-hidden")) return;
        n += 1;
        var numEl = card.querySelector("[data-case-number]");
        if (numEl) numEl.textContent = n < 10 ? "0" + n : String(n);
      });
    }

    function applyTrack(track) {
      section.setAttribute("data-track", track);
      document.body.setAttribute("data-track", track);
      applyVariants(track);

      // Re-roll the hero readout's digits into their new values whenever
      // the track changes (not on initial load - that's handled once by
      // the scroll-into-view observer below). Skipped under reduced motion,
      // where the plain final numbers are already correct as-is.
      if (!reduceMotion) {
        document.querySelectorAll('.status-panel [data-track-variant="' + track + '"] [data-roll]').forEach(function (el) {
          rollNumber(el);
        });
      }

      filterBtns.forEach(function (btn) {
        var active = btn.getAttribute("data-track-btn") === track;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });

      contextLines.forEach(function (line) {
        line.hidden = line.getAttribute("data-track-context-line") !== track;
      });

      cards.forEach(function (card) {
        var show = track === "all" || card.getAttribute("data-category") === track;
        if (show) {
          card.classList.remove("is-hidden");
          // Two rAFs so the removed is-hidden (display:none) has taken
          // effect before the opacity/transform transition starts.
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { card.classList.remove("is-filtered-out"); });
          });
        } else {
          card.classList.add("is-filtered-out");
          window.setTimeout(function () { card.classList.add("is-hidden"); }, hideDelay);
        }
      });

      window.setTimeout(renumber, hideDelay);
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () { applyTrack(btn.getAttribute("data-track-btn")); });
    });

    renumber();
  })();

  // Pit Wall flow: hover/focus a node to reveal its caption and nudge the
  // telemetry line (destabilise on Red Team, settle on Blue Team, a little
  // noise back on Residual Risk).
  (function () {
    var flow = document.querySelector("[data-flow]");
    var telemetry = document.querySelector("[data-telemetry]");
    if (!flow) return;
    var nodes = flow.querySelectorAll("[data-flow-node]");
    var details = document.querySelectorAll("[data-flow-detail]");
    function setState(name) {
      details.forEach(function (d) { d.hidden = d.getAttribute("data-flow-detail") !== name; });
      if (telemetry) telemetry.setAttribute("data-state", name || "");
    }
    nodes.forEach(function (node) {
      var name = node.getAttribute("data-flow-node");
      node.addEventListener("mouseenter", function () { setState(name); });
      node.addEventListener("focus", function () { setState(name); });
      node.addEventListener("click", function () { setState(name); });
      node.addEventListener("mouseleave", function () { setState(null); });
      node.addEventListener("blur", function () { setState(null); });
    });
  })();

  // Pit Wall attack-strength slider: two documented data points, not a live model.
  // The track's signal line just gets visually noisier at the higher setting —
  // an illustrative representation of the two documented points, nothing live.
  (function () {
    var range = document.getElementById("attack-range");
    var readout = document.querySelector("[data-attack-readout]");
    var signal = document.querySelector("[data-attack-signal]");
    var line = signal && signal.querySelector(".attack-signal-line");
    var slider = document.querySelector(".attack-slider");
    if (!range || !readout) return;
    function calmPoints() {
      var pts = [];
      for (var x = 0; x <= 300; x += 20) pts.push(x + "," + (14 + Math.sin(x / 40) * 2));
      return pts.join(" ");
    }
    function noisyPoints() {
      var pts = [];
      for (var x = 0; x <= 300; x += 10) pts.push(x + "," + (14 + (Math.sin(x / 12) * 8 + Math.sin(x / 3) * 3)));
      return pts.join(" ");
    }
    function update() {
      var armed = range.value === "1";
      readout.textContent = armed
        ? "At ~2% perturbation: 9.75% peak confidence (down from 17.3% baseline)."
        : "Baseline peak confidence: 17.3%.";
      if (slider) slider.toggleAttribute("data-armed", armed);
      if (line) line.setAttribute("points", armed ? noisyPoints() : calmPoints());
    }
    range.addEventListener("input", update);
    update();
  })();

  // Digit-rolling numbers: each digit character gets its own vertical strip
  // that lands on the target after a couple of loops. Non-digit characters
  // (%, ., commas, →, spaces) pass through as static text. Fires once per
  // element on scroll-into-view (skipped entirely under reduced motion),
  // and can be safely replayed later (e.g. the hero readout re-rolling on
  // track change) - the original digit string is cached on first call so
  // a replay never tries to re-parse its own roll-strip markup.
  function rollNumber(el) {
    var text = el.dataset.rollValue || el.textContent;
    el.dataset.rollValue = text;
    el.textContent = "";
    text.split("").forEach(function (ch) {
      if (/[0-9]/.test(ch)) {
        var target = parseInt(ch, 10);
        var strip = document.createElement("span");
        strip.className = "roll-strip";
        var inner = document.createElement("span");
        inner.className = "roll-strip-inner";
        // One full loop of 0-9 then land on the target digit.
        var sequence = [];
        for (var loop = 0; loop < 1; loop++) {
          for (var d = 0; d < 10; d++) sequence.push(d);
        }
        sequence.push(target);
        sequence.forEach(function (d) {
          var row = document.createElement("span");
          row.textContent = String(d);
          inner.appendChild(row);
        });
        strip.appendChild(inner);
        el.appendChild(strip);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            inner.style.transform = "translateY(-" + (sequence.length - 1) + "em)";
          });
        });
      } else {
        el.appendChild(document.createTextNode(ch));
      }
    });
  }
  (function () {
    var els = document.querySelectorAll("[data-roll]");
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var rollObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            rollNumber(entry.target);
            rollObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    els.forEach(function (el) { rollObserver.observe(el); });
  })();

  // "Currently exploring" items reveal their sub-terms on hover/focus via
  // CSS alone; nothing to wire up here.

  // Footer: a one-time traveling accent line the first time it scrolls in.
  (function () {
    var footer = document.querySelector("[data-footer-reveal]");
    if (!footer || !("IntersectionObserver" in window)) return;
    var footerObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            footer.classList.add("is-visible");
            footerObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    footerObserver.observe(footer);
  })();

  // Footer signature mark: click toggles the "Built by Khadijah" reveal too,
  // so it isn't hover-only on touch devices (CSS already handles hover/focus).
  (function () {
    var mark = document.getElementById("footer-mark");
    var reveal = document.getElementById("footer-mark-reveal");
    if (!mark || !reveal) return;
    mark.addEventListener("click", function () {
      var showing = reveal.style.opacity === "1";
      reveal.style.opacity = showing ? "" : "1";
      reveal.style.transform = showing ? "" : "translateX(-50%) translateY(-6px)";
    });
  })();

  // Hero: a living, mouse-reactive node network (max ~4px) and KHURUM
  // drifting slightly relative to KHADIJAH. Desktop, fine-pointer only.
  if (finePointer && !reduceMotion) {
    var hero = document.querySelector(".hero");
    var nodes = document.querySelectorAll(".hd-node");
    var serif = document.querySelector(".hero-name-serif");
    if (hero && (nodes.length || serif)) {
      hero.addEventListener("mousemove", function (e) {
        var r = hero.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        nodes.forEach(function (node, i) {
          var mult = 1 + (i % 3) * 0.4;
          node.style.transform = "translate(" + (px * 4 * mult) + "px, " + (py * 3 * mult) + "px)";
        });
        if (serif) {
          serif.style.transform = "translate(" + (px * 3) + "px, " + (py * 2) + "px)";
        }
      });
      hero.addEventListener("mouseleave", function () {
        nodes.forEach(function (node) { node.style.transform = "translate(0, 0)"; });
        if (serif) serif.style.transform = "translate(0, 0)";
      });
    }
  }

  // Pointer parallax on project visuals — max 4px horizontal, 3px vertical.
  // Desktop, fine-pointer only; skipped entirely under reduced motion.
  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-parallax]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "translate(" + (px * 8) + "px, " + (py * 6) + "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "translate(0, 0)";
      });
    });
  }

  // Custom cursor: small dot + trailing ring, "View" label over project
  // visuals. Desktop, fine-pointer only.
  if (finePointer && !reduceMotion) {
    document.body.classList.add("has-custom-cursor");
    var dot = document.createElement("div");
    dot.className = "cursor-dot";
    var ring = document.createElement("div");
    ring.className = "cursor-ring";
    var ringLabel = document.createElement("span");
    ringLabel.className = "cursor-ring-label";
    ringLabel.textContent = "View →";
    ring.appendChild(ringLabel);
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = "translate(" + mx + "px, " + my + "px) translate(-50%, -50%)";
    });
    function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = "translate(" + rx + "px, " + ry + "px) translate(-50%, -50%)";
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    document.querySelectorAll("a, button, input, textarea").forEach(function (el) {
      el.addEventListener("mouseenter", function () { ring.classList.add("is-hover"); });
      el.addEventListener("mouseleave", function () { ring.classList.remove("is-hover"); });
    });
    document.querySelectorAll(".case-visual").forEach(function (el) {
      el.addEventListener("mouseenter", function () { ring.classList.add("is-view"); });
      el.addEventListener("mouseleave", function () { ring.classList.remove("is-view"); });
    });
    document.querySelectorAll('[data-cursor="explore"]').forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        ringLabel.textContent = "EXPLORE";
        ring.classList.add("is-explore");
      });
      el.addEventListener("mouseleave", function () {
        ringLabel.textContent = "View →";
        ring.classList.remove("is-explore");
      });
    });
  }

  // Contact form: if no real endpoint has been configured, don't let the
  // browser POST to a placeholder URL — tell the person what to do instead.
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (event) {
      var action = form.getAttribute("action") || "";
      if (action.indexOf("YOUR_FORM_ID") !== -1) {
        event.preventDefault();
        window.alert(
          "This form isn't connected to anything yet. See the README for a " +
            "two-minute Formspree setup, or use the LinkedIn link below for now."
        );
      }
    });
  }
})();
