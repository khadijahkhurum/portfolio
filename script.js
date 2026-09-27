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
    document.querySelectorAll("[data-reveal], .approach-item").forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll("[data-reveal], .approach-item").forEach(function (el) {
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

  // FAIR pipeline: click a stage to swap the caption below it.
  (function () {
    var pipeline = document.querySelector("[data-pipeline]");
    if (!pipeline) return;
    var buttons = pipeline.querySelectorAll("[data-stage-btn]");
    var details = document.querySelectorAll("[data-pipeline-detail]");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var stage = btn.getAttribute("data-stage-btn");
        buttons.forEach(function (b) { b.setAttribute("aria-expanded", b === btn ? "true" : "false"); });
        details.forEach(function (d) { d.hidden = d.getAttribute("data-pipeline-detail") !== stage; });
      });
    });
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
  (function () {
    var range = document.getElementById("attack-range");
    var readout = document.querySelector("[data-attack-readout]");
    if (!range || !readout) return;
    range.addEventListener("input", function () {
      readout.textContent =
        range.value === "1"
          ? "At ~2% perturbation: 9.75% peak confidence (down from 17.3% baseline)."
          : "Baseline peak confidence: 17.3%.";
    });
  })();

  // "Currently exploring" — rotates through topics; text-only swap under reduced motion.
  (function () {
    var el = document.querySelector("[data-exploring]");
    if (!el) return;
    var topics = ["Quantitative cyber risk", "Compliance engineering", "Security automation"];
    var i = 0;
    setInterval(function () {
      i = (i + 1) % topics.length;
      if (reduceMotion) {
        el.textContent = topics[i];
        return;
      }
      el.style.opacity = 0;
      setTimeout(function () {
        el.textContent = topics[i];
        el.style.opacity = 1;
      }, 350);
    }, 3400);
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
