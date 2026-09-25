(function () {
  "use strict";

  var STORAGE_KEY = "portfolio-mode";
  var buttons = document.querySelectorAll("[data-mode-btn]");
  var announce = document.getElementById("mode-announce");
  var isFirstApply = true;

  function applyMode(mode) {
    document.body.setAttribute("data-mode", mode);
    document.documentElement.setAttribute("data-mode", mode);
    buttons.forEach(function (btn) {
      var isActive = btn.getAttribute("data-mode-btn") === mode;
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    if (announce && !isFirstApply) {
      announce.textContent =
        mode === "technical" ? "Switched to technical view" : "Switched to GRC view";
    }
    isFirstApply = false;
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
      /* storage unavailable — mode still applies for this view */
    }
  }

  function initMode() {
    var stored = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      /* no persisted preference available */
    }
    applyMode(stored === "technical" || stored === "grc" ? stored : "grc");
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyMode(btn.getAttribute("data-mode-btn"));
    });
  });

  initMode();

  // Live stat counts in the technical hero (counts real DOM content, not fabricated numbers)
  document.querySelectorAll("[data-stat-count]").forEach(function (el) {
    el.textContent = document.querySelectorAll(el.getAttribute("data-stat-count")).length;
  });

  // Scroll-reveal: fade/slide sections in as they enter view (native IntersectionObserver, no library)
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      observer.observe(el);
    });
  } else {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Rolls each digit like a slot machine reel — two full 0-9 spins, then
  // settling on the real digit — instead of just ticking the text up.
  // Prefix/suffix ("±", "+", "%") stay put as plain text either side.
  var ROLL_LOOPS = 2;
  function countUp(el, duration) {
    if (!el) return;
    // Cache the real target text on first run — after that, el.textContent
    // is the roll markup's own digits concatenated, not the real number,
    // so replays (scrolling past this element again) need the original.
    if (!el.dataset.rollText) el.dataset.rollText = el.textContent;
    var text = el.dataset.rollText;
    var match = text.match(/\d+/);
    if (!match) return;
    if (reduceMotion) return; // leave the real number showing as-is

    var digits = match[0];
    var prefix = text.slice(0, match.index);
    var suffix = text.slice(match.index + digits.length);

    el.textContent = "";
    if (prefix) el.appendChild(document.createTextNode(prefix));

    var strips = digits.split("").map(function (d) {
      var wrap = document.createElement("span");
      wrap.className = "roll-digit";
      var strip = document.createElement("span");
      strip.className = "roll-strip";
      var rows = ROLL_LOOPS * 10 + parseInt(d, 10);
      for (var n = 0; n <= rows; n++) {
        var row = document.createElement("span");
        row.textContent = n % 10;
        strip.appendChild(row);
      }
      wrap.appendChild(strip);
      el.appendChild(wrap);
      return { strip: strip, rows: rows };
    });
    if (suffix) el.appendChild(document.createTextNode(suffix));

    el.offsetHeight; // force layout so the strip's start position (row 0) actually paints
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        strips.forEach(function (s, i) {
          s.strip.style.transitionDuration = duration + "ms";
          s.strip.style.transitionDelay = i * 80 + "ms";
          s.strip.style.transform = "translateY(-" + s.rows + "em)";
        });
      });
    });
  }

  // Impact section: the donut fills and counts up first; only once that's
  // done do the four stat cards reveal and count up, staggered. On desktop
  // (mouse + hover — scroll-jacking is unreliable on touch), scrolling past
  // is briefly held during the sequence so it's actually seen, not skipped.
  // Replays every time the section is scrolled into view — either
  // direction — resetting to zero when it's scrolled back out.
  (function () {
    var impact = document.getElementById("impact");
    var donut = impact && impact.querySelector(".donut");
    if (!impact || !donut) return;

    var donutNum = impact.querySelector(".donut-num");
    var stats = Array.prototype.slice.call(impact.querySelectorAll(".impact-stat"));
    var pct = donut.getAttribute("data-pct");
    var canLock = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduceMotion;
    var pendingTimers = [];

    function blockDownscroll(e) {
      if (e.deltaY > 0) e.preventDefault();
    }

    function resetRoll(el) {
      if (el && el.dataset.rollText) el.textContent = el.dataset.rollText;
    }

    function clearPending() {
      pendingTimers.forEach(clearTimeout);
      pendingTimers = [];
      if (canLock) window.removeEventListener("wheel", blockDownscroll);
    }

    function playSequence() {
      clearPending(); // in case a previous play was interrupted mid-sequence
      impact.classList.add("impact-sequenced");
      donut.style.setProperty("--pct", pct);
      countUp(donutNum, 1400);

      if (canLock) window.addEventListener("wheel", blockDownscroll, { passive: false });

      pendingTimers.push(
        setTimeout(
          function () {
            stats.forEach(function (stat, i) {
              pendingTimers.push(
                setTimeout(function () {
                  stat.classList.add("is-visible");
                  countUp(stat.querySelector(".impact-num"), 600);
                }, i * 150)
              );
            });
            pendingTimers.push(
              setTimeout(
                function () {
                  if (canLock) window.removeEventListener("wheel", blockDownscroll);
                },
                stats.length * 150 + 600
              )
            );
          },
          reduceMotion ? 0 : 1400
        )
      );
    }

    function resetSequence() {
      clearPending();
      donut.style.setProperty("--pct", 0);
      resetRoll(donutNum);
      stats.forEach(function (stat) {
        stat.classList.remove("is-visible");
        resetRoll(stat.querySelector(".impact-num"));
      });
    }

    if ("IntersectionObserver" in window) {
      var impactObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) playSequence();
            else resetSequence();
          });
        },
        { threshold: 0.3 }
      );
      impactObserver.observe(impact);
    } else {
      playSequence();
    }
  })();

  // Project stack: cards overlap like a physical deck. The front card is
  // fully readable; the next one is a heavily blurred hint behind it, no
  // more. Navigate with the prev/next buttons on either side, or by
  // swiping on touch — dots below are just a position indicator, not a
  // control surface.
  (function () {
    var stack = document.querySelector(".project-stack");
    var dotsWrap = document.querySelector(".stack-dots");
    var prevBtn = document.querySelector('[data-stack-nav="prev"]');
    var nextBtn = document.querySelector('[data-stack-nav="next"]');
    if (!stack || !dotsWrap) return;

    var cards = Array.prototype.slice.call(stack.querySelectorAll(".dossier"));
    if (cards.length < 2) return; // nothing to stack yet

    var order = cards.map(function (_, i) {
      return i;
    }); // order[0] is the front card's index into `cards`

    var dots = cards.map(function () {
      var dot = document.createElement("span");
      dot.className = "stack-dot";
      dotsWrap.appendChild(dot);
      return dot;
    });

    function setStackHeight() {
      var tallest = Math.max.apply(
        null,
        cards.map(function (c) {
          return c.offsetHeight;
        })
      );
      stack.style.height = tallest + 16 + "px"; // + room for the back card's peek offset
    }

    function render() {
      order.forEach(function (cardIndex, pos) {
        var card = cards[cardIndex];
        card.classList.toggle("is-front", pos === 0);
        card.style.zIndex = cards.length - pos;
        if (pos === 0) {
          card.style.transform = "none";
          card.style.opacity = "1";
          card.style.filter = "none";
        } else if (pos === 1) {
          // just a hint that another card is behind — heavily blurred so
          // its content never reads as a second, half-legible card
          card.style.transform = "translateY(16px) scale(0.96)";
          card.style.opacity = "0.4";
          card.style.filter = "blur(10px)";
        } else {
          // any further back stay fully hidden under the peek card rather
          // than fanning out indefinitely
          card.style.transform = "translateY(16px) scale(0.94)";
          card.style.opacity = "0";
          card.style.filter = "blur(10px)";
        }
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", order[0] === i);
      });
    }

    function step(dir) {
      // dir 1 = next: current front goes to the back. dir -1 = previous:
      // the last card comes back to the front.
      if (dir === 1) {
        order.push(order.shift());
      } else {
        order.unshift(order.pop());
      }
      render();
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { step(1); });

    // Swipe on touch devices — left advances, right goes back.
    var touchStartX = null;
    stack.addEventListener(
      "touchstart",
      function (e) {
        touchStartX = e.touches[0].clientX;
      },
      { passive: true }
    );
    stack.addEventListener(
      "touchend",
      function (e) {
        if (touchStartX === null) return;
        var dx = e.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(dx) < 40) return; // too small to count as a swipe
        step(dx < 0 ? 1 : -1);
      },
      { passive: true }
    );

    setStackHeight();
    render();
    window.addEventListener("resize", setStackHeight);
  })();

  // Custom cursor: a small dot tracks the pointer exactly, a larger ring
  // trails behind it with lerp easing (the "floating" feel), and both grow
  // on hover over interactive elements. Desktop mouse only.
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduceMotion) {
    var dot = document.createElement("div");
    dot.className = "cursor-dot";
    var ring = document.createElement("div");
    ring.className = "cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mx = window.innerWidth / 2,
      my = window.innerHeight / 2,
      rx = mx,
      ry = my;

    window.addEventListener("mousemove", function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = "translate(" + mx + "px, " + my + "px) translate(-50%, -50%)";
    });

    function loop() {
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      ring.style.transform = "translate(" + rx + "px, " + ry + "px) translate(-50%, -50%)";
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    document.querySelectorAll("a, button, input, textarea").forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        ring.classList.add("is-hover");
      });
      el.addEventListener("mouseleave", function () {
        ring.classList.remove("is-hover");
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
