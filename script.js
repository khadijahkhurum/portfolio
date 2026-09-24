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

  // Counts a number up from 0 to its real value, easing out, while keeping
  // any prefix/suffix around it ("±2%", "20+", "25%") intact.
  function countUp(el, duration) {
    if (!el) return;
    var text = el.textContent;
    var match = text.match(/[\d.]+/);
    if (!match || reduceMotion) return;
    var target = parseFloat(match[0]);
    var prefix = text.slice(0, match.index);
    var suffix = text.slice(match.index + match[0].length);
    var start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Impact section: the donut fills and counts up first; only once that's
  // done do the four stat cards reveal and count up, staggered. On desktop
  // (mouse + hover — scroll-jacking is unreliable on touch), scrolling past
  // is briefly held during the sequence so it's actually seen, not skipped.
  (function () {
    var impact = document.getElementById("impact");
    var donut = impact && impact.querySelector(".donut");
    if (!impact || !donut) return;

    var donutNum = impact.querySelector(".donut-num");
    var stats = Array.prototype.slice.call(impact.querySelectorAll(".impact-stat"));
    var pct = donut.getAttribute("data-pct");
    var canLock = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduceMotion;

    function blockDownscroll(e) {
      if (e.deltaY > 0) e.preventDefault();
    }

    function playSequence() {
      impact.classList.add("impact-sequenced");
      donut.style.setProperty("--pct", pct);
      countUp(donutNum, 1400);

      if (canLock) window.addEventListener("wheel", blockDownscroll, { passive: false });

      setTimeout(
        function () {
          stats.forEach(function (stat, i) {
            setTimeout(function () {
              stat.classList.add("is-visible");
              countUp(stat.querySelector(".impact-num"), 600);
            }, i * 150);
          });
          setTimeout(
            function () {
              if (canLock) window.removeEventListener("wheel", blockDownscroll);
            },
            stats.length * 150 + 600
          );
        },
        reduceMotion ? 0 : 1400
      );
    }

    if ("IntersectionObserver" in window) {
      var impactObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              playSequence();
              impactObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      impactObserver.observe(impact);
    } else {
      playSequence();
    }
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
