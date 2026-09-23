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
