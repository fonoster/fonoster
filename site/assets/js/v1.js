/* fonoster.com v1 — preferences, reveals, and the animations listed in ../../README.md */
(() => {
  "use strict";

  const doc = document.documentElement;
  const body = document.body;
  const I18N = window.FONOSTER_I18N || {};
  const ICONS = body.dataset.icons;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => window.matchMedia("(max-width: 640px)").matches;

  doc.classList.add("js");

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const store = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        /* storage unavailable: preferences just won't persist */
      }
    }
  };

  const escape = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // "\n" → line break, "|" → mobile-only line break, "[...]" → hidden on mobile.
  const rich = (s) =>
    escape(s)
      .replace(/\n/g, "<br>")
      .replace(/\|/g, '<br class="br-m">')
      .replace(/\[(.*?)\]/g, '<span class="hide-m">$1</span>');

  const icon = (name, cls = "") =>
    `<svg class="icon ${cls}" aria-hidden="true"><use href="${ICONS}#i-${name}"></use></svg>`;

  // ?lang=es|en (used by the fonoster.do redirect) picks the language and is remembered.
  const params = new URLSearchParams(location.search);
  const urlLang = params.get("lang");
  if (urlLang === "es" || urlLang === "en") {
    store.set("fonoster.lang", urlLang);
    params.delete("lang");
    const query = params.toString();
    history.replaceState(null, "", location.pathname + (query ? `?${query}` : "") + location.hash);
  }
  let lang = (urlLang || store.get("fonoster.lang")) === "es" ? "es" : "en";
  const dict = () => I18N[lang] || I18N.en || {};
  const t = (key) => {
    const value = dict()[key];
    return value !== undefined ? value : (I18N.en || {})[key];
  };

  /* ---------- Timers that can be cancelled as a group ---------- */
  const timers = () => {
    let ids = [];
    return {
      later(fn, ms) {
        ids.push(window.setTimeout(fn, ms));
      },
      clear() {
        ids.forEach(window.clearTimeout);
        ids = [];
      }
    };
  };

  /* ---------- In-view helpers ---------- */
  const once = (el, fn, threshold = 0.25) => {
    if (!el) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      fn();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            io.disconnect();
            fn();
          }
        });
      },
      { threshold, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
  };

  const watch = (el, onChange, threshold = 0) => {
    if (!el || !("IntersectionObserver" in window)) {
      onChange(true);
      return;
    }
    new IntersectionObserver((entries) => entries.forEach((e) => onChange(e.isIntersecting)), { threshold }).observe(el);
  };

  /* ---------- Reveal (fade up, once) ---------- */
  const initReveal = () => {
    const items = $$("[data-reveal]");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    items.forEach((el) => io.observe(el));
  };

  /* ---------- Loops pause offscreen and in background tabs ---------- */
  const loopHandlers = [];
  const initLoops = () => {
    $$("[data-loop]").forEach((el) => watch(el, (visible) => el.classList.toggle("is-paused", !visible)));
    document.addEventListener("visibilitychange", () => {
      doc.classList.toggle("is-paused", document.hidden);
      loopHandlers.forEach((fn) => fn(!document.hidden));
    });
  };

  /* ---------- Preferences: language + theme ---------- */
  const listeners = [];
  const onLangChange = (fn) => listeners.push(fn);

  const applyStrings = () => {
    $$("[data-i18n]").forEach((el) => {
      const value = t(el.dataset.i18n);
      if (typeof value === "string") el.innerHTML = rich(value);
    });
    $$("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":");
        const value = t(key);
        if (typeof value === "string") el.setAttribute(attr, value);
      });
    });
    const titles = {
      home: "meta.homeTitle",
      autopilot: "meta.autopilotTitle",
      pricing: "meta.pricingTitle",
      streams: "meta.streamsTitle",
      regions: "meta.regionsTitle",
      notfound: "meta.notFoundTitle"
    };
    const titleKey = titles[body.dataset.page];
    if (titleKey && t(titleKey)) document.title = t(titleKey);
  };

  const setLang = (next, initial = false) => {
    lang = next === "es" ? "es" : "en";
    doc.lang = lang;
    if (!initial) store.set("fonoster.lang", lang);
    $$('[data-pref="lang"]').forEach((sel) => (sel.value = lang));
    if (initial && lang === "en") return; // the HTML already ships in English
    applyStrings();
    listeners.forEach((fn) => fn(initial));
  };

  const setTheme = (next) => {
    const theme = next === "light" ? "light" : "dark";
    doc.dataset.theme = theme;
    store.set("fonoster.theme", theme);
    $$('[data-pref="theme"]').forEach((sel) => (sel.value = theme));
    $$("[data-theme-icon] use").forEach((use) =>
      use.setAttribute("href", `${ICONS}#i-${theme === "light" ? "sun" : "moon"}`)
    );
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#ffffff" : "#181818");
  };

  const initPrefs = () => {
    $$('[data-pref="lang"]').forEach((sel) => sel.addEventListener("change", () => setLang(sel.value)));
    $$('[data-pref="theme"]').forEach((sel) => sel.addEventListener("change", () => setTheme(sel.value)));
    setTheme(doc.dataset.theme);
  };

  /* ---------- Nav: blur on scroll, mobile sheet ---------- */
  const initNav = () => {
    const nav = $("[data-nav]");
    if (!nav) return;
    let ticking = false;
    const update = () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();

    const button = $("[data-menu]", nav);
    const sheet = $("#sheet");
    if (!button || !sheet) return;
    const close = () => {
      sheet.hidden = true;
      button.setAttribute("aria-expanded", "false");
      $("use", button).setAttribute("href", `${ICONS}#i-menu`);
    };
    button.addEventListener("click", () => {
      const open = sheet.hidden;
      sheet.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
      $("use", button).setAttribute("href", `${ICONS}#i-${open ? "x" : "menu"}`);
    });
    $$("a", sheet).forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !sheet.hidden) close();
    });
  };

  /* ---------- Nav: Products menu (click, hover with a fine pointer, Escape) ---------- */
  const initProducts = () => {
    const menu = $("[data-products]");
    if (!menu) return;
    const button = $("[data-products-btn]", menu);
    const panel = $(".menu__panel", menu);
    let leave = null;
    let hovering = false;
    let hoverOpenedAt = 0;
    const set = (open) => {
      window.clearTimeout(leave);
      panel.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
    };
    // A click right after hover opened the menu is the same intent: keep it open. Otherwise toggle.
    button.addEventListener("click", () => {
      const justHovered = !panel.hidden && Date.now() - hoverOpenedAt < 400;
      set(justHovered || panel.hidden);
    });
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      menu.addEventListener("mouseenter", () => {
        hovering = true;
        if (panel.hidden) hoverOpenedAt = Date.now();
        set(true);
      });
      menu.addEventListener("mouseleave", () => {
        hovering = false;
        leave = window.setTimeout(() => set(false), 160);
      });
    }
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target)) set(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) {
        set(false);
        button.focus();
      }
    });
    // Keyboard users tabbing out close it; a click on the panel's padding (focus goes to body) doesn't.
    menu.addEventListener("focusout", (e) => {
      if (!hovering && !menu.contains(e.relatedTarget)) set(false);
    });
  };

  /* ---------- Numbers: odometer roll ---------- */
  const initOdometers = () => {
    $$("[data-odo]").forEach((el) => {
      const text = el.textContent.trim();
      el.setAttribute("aria-label", text);
      el.classList.add("odo");
      let digit = 0;
      el.innerHTML = Array.from(text)
        .map((ch) => {
          if (/\d/.test(ch)) {
            const strip = Array.from({ length: 10 }, (_, n) => `<span>${n}</span>`).join("");
            return `<span class="odo__col" aria-hidden="true"><span class="odo__strip" style="--d:${ch};--i:${digit++}">${strip}</span></span>`;
          }
          return `<span class="odo__ch" aria-hidden="true">${escape(ch)}</span>`;
        })
        .join("");
      // Size each column to its final digit so proportional figures keep their natural spacing.
      const fit = () => {
        const probe = document.createElement("span");
        probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
        el.appendChild(probe);
        $$(".odo__strip", el).forEach((strip) => {
          probe.textContent = strip.style.getPropertyValue("--d");
          strip.parentElement.style.width = `${probe.getBoundingClientRect().width}px`;
        });
        probe.remove();
      };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
      else fit();
      once(el, () => el.classList.add("is-in"), 0.6);
    });
  };

  /* ---------- Transcript rendering + sequential playback ---------- */
  const itemHTML = ([kind, text, iconName, label, tool], names) => {
    if (kind === "e") {
      return `<div class="msg msg--e"><span class="chip"${tool ? ` data-tool="${escape(tool)}"` : ""}${
        iconName === "wrench" ? " data-running" : ""
      }>${icon(iconName)}<span class="chip__label">${escape(label)}</span><span>${rich(text)}</span><span class="chip__spin" aria-hidden="true"></span></span></div>`;
    }
    const who = names ? `<span class="bubble__who">${escape(kind === "a" ? names.agent : names.caller)}</span>` : "";
    return `<div class="msg msg--${kind}"><div class="bubble bubble--${kind}">${who}<span>${rich(text)}</span></div></div>`;
  };

  const showAll = (container) => Array.from(container.children).forEach((el) => el.classList.add("is-shown"));

  const play = (container, step, clock, onItem) => {
    const items = Array.from(container.children);
    items.forEach((el) => el.classList.remove("is-shown"));
    items.forEach((el, i) => {
      clock.later(() => {
        el.classList.add("is-shown");
        const chip = $("[data-running]", el);
        if (chip) {
          chip.classList.add("is-running");
          clock.later(() => chip.classList.remove("is-running"), 650);
        }
        if (onItem) onItem(el);
      }, 150 + i * step);
    });
    return 150 + items.length * step;
  };

  /* ---------- Home: hero phone, a call that loops ---------- */
  const initPhone = () => {
    const phone = $("[data-phone]");
    if (!phone) return;
    const who = $("[data-phone-who]", phone);
    const text = $("[data-phone-text]", phone);
    const timer = $("[data-phone-timer]", phone);
    const clock = timers();
    let seconds = 42;
    let line = 0;
    let tick = null;
    let running = false;
    let visible = false;

    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    const render = (animate) => {
      const data = t("phone");
      const [speaker, sentence] = data.lines[line % data.lines.length];
      who.textContent = speaker === "agent" ? data.agent : data.caller;
      if (!animate) {
        text.textContent = sentence;
        phone.dataset.speaking = "idle";
        return;
      }
      phone.dataset.speaking = speaker;
      text.innerHTML = sentence
        .split(" ")
        .map((w) => `<span>${escape(w)}</span>`)
        .join(" ");
      const words = $$("span", text);
      const perWord = speaker === "agent" ? 90 : 110;
      words.forEach((w, i) => clock.later(() => w.classList.add("on"), i * perWord));
      const spoken = words.length * perWord + 250;
      clock.later(() => (phone.dataset.speaking = "idle"), spoken);
      clock.later(() => {
        line += 1;
        render(true);
      }, spoken + 2400);
    };

    const start = () => {
      if (running) return;
      running = true;
      tick = window.setInterval(() => {
        seconds += 1;
        timer.textContent = fmt(seconds);
      }, 1000);
      render(true);
    };
    const stop = () => {
      running = false;
      window.clearInterval(tick);
      clock.clear();
    };
    const sync = () => (visible && !document.hidden ? start() : stop());

    if (reduceMotion) {
      line = 2;
      render(false);
      onLangChange(() => render(false));
      return;
    }
    watch(phone, (v) => {
      visible = v;
      sync();
    }, 0.2);
    loopHandlers.push(sync);
    onLangChange(() => {
      if (running) {
        stop();
        start();
      } else {
        render(false);
      }
    });
  };

  /* ---------- Home: use cases ---------- */
  const DIRECTION = { support: "in", scheduling: "out", collections: "out", sales: "in" };

  const initCases = () => {
    const root = $("[data-cases]");
    if (!root) return;
    const tabs = $$('[role="tab"]', root);
    const panel = $('[role="tabpanel"]', root);
    const transcript = $("[data-case-transcript]", root);
    const clock = timers();
    let current = "scheduling";
    let seen = false;

    const render = (animate) => {
      const data = t("cases")[current];
      const phoneNames = t("phone");
      tabs.forEach((tab) => (tab.textContent = t("cases")[tab.dataset.case].tab));
      $("[data-case-name]", root).textContent = data.name;
      $("[data-case-meta]", root).textContent = data.meta;
      $("[data-case-icon] use", root).setAttribute(
        "href",
        `${ICONS}#i-${DIRECTION[current] === "out" ? "phone-outgoing" : "phone-call"}`
      );
      $("[data-case-lead]", root).textContent = data.lead;
      $("[data-case-uses]", root).innerHTML = data.uses
        .map(([ic, label]) => `<li>${icon(ic)}${escape(label)}</li>`)
        .join("");
      clock.clear();
      transcript.innerHTML = data.items
        .map((item) => itemHTML(item, { agent: phoneNames.agent, caller: data.name.split(" ")[0] }))
        .join("");
      if (animate && !reduceMotion) play(transcript, 450, clock);
      else showAll(transcript);
    };

    const select = (tab, focus) => {
      if (tab.dataset.case === current) return;
      tabs.forEach((t2) => {
        const on = t2 === tab;
        t2.setAttribute("aria-selected", String(on));
        t2.tabIndex = on ? 0 : -1;
      });
      panel.setAttribute("aria-labelledby", tab.id);
      if (focus) tab.focus();
      current = tab.dataset.case;
      if (reduceMotion) {
        render(false);
        return;
      }
      transcript.classList.add("is-leaving");
      window.setTimeout(() => {
        transcript.classList.remove("is-leaving");
        render(seen);
      }, 200);
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (e) => {
        const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!delta) return;
        e.preventDefault();
        select(tabs[(i + delta + tabs.length) % tabs.length], true);
      });
    });

    render(false);
    if (!reduceMotion) {
      Array.from(transcript.children).forEach((el) => el.classList.remove("is-shown"));
      once(transcript, () => {
        seen = true;
        play(transcript, 450, clock);
      }, 0.35);
    }
    onLangChange(() => render(false));
  };

  /* ---------- Typing terminal (home Autopilot block) ---------- */
  const initTyping = () => {
    $$("[data-type]").forEach((el) => {
      const full = isMobile() && el.dataset.typeM ? el.dataset.typeM.replace(/\\n/g, "\n") : el.dataset.type;
      const term = el.closest(".term");
      const out = $("[data-type-out]", term);
      const caret = $(".caret", term);
      if (reduceMotion) {
        el.textContent = full;
        if (caret) caret.remove();
        return;
      }
      el.textContent = "";
      out.classList.add("is-hidden");
      once(term, () => {
        let i = 0;
        const step = () => {
          i += 1;
          el.textContent = full.slice(0, i);
          if (i < full.length) window.setTimeout(step, 28);
          else
            window.setTimeout(() => {
              out.classList.remove("is-hidden");
              if (caret) caret.remove();
            }, 350);
        };
        window.setTimeout(step, 400);
      }, 0.6);
    });
  };

  /* ---------- Autopilot: console plays the call once ---------- */
  const initConsole = () => {
    const root = $("[data-console]");
    if (!root) return;
    const transcript = $("[data-console-transcript]", root);
    const timer = $("[data-console-timer]", root);
    const clock = timers();
    let played = false;

    const markTool = (ref) => {
      const row = $(`[data-tool-row="${ref}"]`, root);
      if (row) row.classList.add("is-used");
    };
    const render = () => {
      transcript.innerHTML = t("console").map((item) => itemHTML(item)).join("");
    };
    const finish = () => {
      showAll(transcript);
      $$("[data-tool]", transcript).forEach((chip) => markTool(chip.dataset.tool));
      timer.textContent = "02:14";
    };

    render();
    if (reduceMotion) {
      finish();
    } else {
      once(root, () => {
        played = true;
        let s = 128;
        const tick = window.setInterval(() => {
          s += 1;
          timer.textContent = `0${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
          if (s >= 134) window.clearInterval(tick);
        }, 1000);
        play(transcript, 650, clock, (el) => {
          const chip = $("[data-tool]", el);
          if (chip) clock.later(() => markTool(chip.dataset.tool), 650);
        });
      }, 0.3);
    }
    onLangChange(() => {
      clock.clear();
      render();
      if (played || reduceMotion) finish();
    });
  };

  /* ---------- Terminals print line by line, once, as they scroll in ---------- */
  const printLines = (term) => {
    if (reduceMotion) return;
    term.classList.add("is-armed");
    once(term, () => {
      // Lines hidden at this breakpoint (.hide-m / .show-m) don't get a pause of their own.
      $$(":scope > div", term)
        .filter((line) => line.offsetParent !== null)
        .forEach((line, i) => window.setTimeout(() => line.classList.add("is-shown"), 200 + i * 90));
      $$(":scope > div", term).forEach((line) => line.offsetParent === null && line.classList.add("is-shown"));
    }, 0.4);
  };

  /* ---------- Autopilot: evals terminal prints line by line ---------- */
  const initEvals = () => {
    const term = $("[data-evals]");
    if (!term) return;
    const kv = (k, v, cls = "") => `<div${cls ? ` class="${cls}"` : ""}><span class="g">${escape(`    ${k.padEnd(13, " ")}`)}</span>${v}</div>`;
    const render = () => {
      const e = t("evals");
      term.innerHTML = [
        `<div><span class="g">$ </span>fonoster applications:eval -f agent.yaml</div>`,
        `<div> </div>`,
        `<div class="s">Scenario: book-cleaning</div>`,
        `<div class="b">  Step: 1</div>`,
        kv("Human", escape(e.human1)),
        kv("AI Expected", escape(e.expected1)),
        kv("AI Actual", escape(e.actual1)),
        kv("Tool", "getAvailableTimes"),
        kv("Passed", '<span class="b">✔ Passed</span>', "pass"),
        `<div> </div>`,
        `<div class="b">  Step: 2</div>`,
        kv("Human", escape(e.human2)),
        kv("Tool", "bookAppointment"),
        kv("Passed", '<span class="b">✔ Passed</span>', "pass")
      ].join("");
    };
    render();
    printLines(term);
    onLangChange(() => {
      render();
      $$(":scope > div", term).forEach((line) => line.classList.add("is-shown"));
    });
  };

  /* ---------- Autopilot: bento tiles ---------- */
  const initTiles = () => {
    $$("[data-langs]").forEach((el) => {
      if (reduceMotion) showAll(el);
      else once(el, () => play(el, 520, timers()), 0.5);
    });
    // Touch screens can't hover: play each tile's hover animation once as it scrolls in.
    if (reduceMotion || !window.matchMedia("(hover: none)").matches) return;
    $$(".tile").forEach((tile) =>
      once(tile, () => {
        tile.classList.add("is-play");
        window.setTimeout(() => tile.classList.remove("is-play"), 2400);
      }, 0.6)
    );
  };

  /* ---------- Streams: Pipecat stage plays one call, then loops ----------
     Messages arrive one by one from the side that sends them. On `clear` the bot's queued
     audio is struck out (barge-in), then the mark echoes back. After `stop` the lane dims
     and restarts. Paused offscreen and in background tabs; reduced motion shows it static. */
  const initLane = () => {
    const lane = $("[data-lane]");
    if (!lane) return;
    const rows = $$(".lm", lane);
    if (reduceMotion) {
      // Final state: the barge-in has happened, so the bot's queued audio shows as cleared.
      rows.filter((r) => r.hasAttribute("data-queued")).forEach((r) => r.classList.add("is-cleared"));
      return;
    }
    const pulse = $(".lane__pulse", lane);
    const timer = timers();
    let step = 0;
    let running = false;

    const reset = () => {
      rows.forEach((r) => r.classList.remove("is-shown", "is-cleared"));
      lane.classList.remove("is-done");
      step = 0;
    };
    const visibleRows = () => rows.filter((r) => r.offsetParent !== null);
    const tick = () => {
      const list = visibleRows();
      if (step >= list.length) {
        lane.classList.add("is-done");
        timer.later(() => {
          reset();
          tick();
        }, 3000);
        return;
      }
      const row = list[step++];
      row.classList.add("is-shown");
      if (row.hasAttribute("data-clear")) {
        rows.filter((r) => r.hasAttribute("data-queued")).forEach((r) => r.classList.add("is-cleared"));
      }
      if (row.hasAttribute("data-media") && pulse) {
        pulse.className = "lane__pulse";
        void pulse.offsetWidth;
        pulse.classList.add(row.classList.contains("lm--bot") ? "to-phone" : "to-bot");
      }
      timer.later(tick, row.hasAttribute("data-clear") ? 1100 : 650);
    };
    const start = () => {
      if (running) return;
      running = true;
      tick();
    };
    const stop = () => {
      running = false;
      timer.clear();
    };

    lane.classList.add("is-armed");
    let inView = false;
    let tabVisible = !document.hidden;
    const sync = () => (inView && tabVisible ? start() : stop());
    watch(lane, (visible) => {
      inView = visible;
      sync();
    }, 0.3);
    loopHandlers.push((active) => {
      tabVisible = active;
      sync();
    });
  };

  /* ---------- Streams: quickstart terminal prints line by line ---------- */
  const initPrint = () => $$("[data-print]").forEach(printLines);

  /* ---------- Home: "Call me" (no backend yet) ---------- */
  const initCallMe = () => {
    const form = $("[data-callme]");
    if (!form) return;
    let hide = null;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      form.classList.add("is-noted");
      window.clearTimeout(hide);
      hide = window.setTimeout(() => form.classList.remove("is-noted"), 5000);
    });
  };

  /* ---------- "Contact sales": dialog with the address and a copy button ---------- */
  // Without <dialog> support the links stay plain mailto.
  const initContact = () => {
    const dialog = $("#contact");
    if (!dialog || typeof dialog.showModal !== "function") return;
    const email = $(".contact__email", dialog);
    const copy = $("[data-copy]", dialog);
    const label = $("span", copy);
    const use = $("use", copy);
    const track = (name) => typeof window.gtag === "function" && window.gtag("event", name);
    let reset = null;

    const restore = () => {
      label.textContent = t("contact.copy");
      use.setAttribute("href", `${ICONS}#i-copy`);
    };

    $$("[data-contact]").forEach((link) =>
      link.addEventListener("click", (e) => {
        e.preventDefault();
        dialog.showModal();
        copy.focus();
        track("contact_open");
      })
    );
    $("[data-contact-close]", dialog).addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(email.value);
      } catch (e) {
        email.select(); // clipboard blocked: leave the address selected for Cmd/Ctrl+C
        return;
      }
      label.textContent = t("contact.copied");
      use.setAttribute("href", `${ICONS}#i-check`);
      track("contact_copy");
      window.clearTimeout(reset);
      reset = window.setTimeout(restore, 2000);
    });
  };

  /* ---------- Boot ---------- */
  initPrefs();
  initNav();
  initProducts();
  initReveal();
  initLoops();
  initOdometers();
  initPhone();
  initCases();
  initTyping();
  initConsole();
  initEvals();
  initTiles();
  initLane();
  initPrint();
  initCallMe();
  initContact();
  setLang(lang, true);
})();
