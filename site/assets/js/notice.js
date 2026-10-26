/* fonoster.com — the notice bar above the nav on every page.
   To change it, edit NOTICE and merge to main; the Pages workflow redeploys on any change under site/.
   - show: false hides the bar on every page.
   - icon: any i-* symbol in assets/img/icons.svg (triangle-alert, sparkles, gift, …).
   - link: where the call to action goes. Leave it empty for a bar without one.
   - text: "[...]" is hidden on phones, so keep the essentials outside the brackets.
   Keep it to about one line on desktop. Each page loads this file as the first thing in <body>,
   so the bar is drawn before the nav and nothing below it moves. */
(() => {
  "use strict";

  const NOTICE = {
    show: true,
    icon: "triangle-alert",
    link: "https://github.com/fonoster/fonoster/issues/new?template=bug.yml",
    en: {
      lead: "Major upgrades underway.",
      text: "Things may be unstable for a while.[ We're pausing contributions for now, but bug reports are welcome.]",
      cta: "Report a bug"
    },
    es: {
      lead: "Grandes mejoras en curso.",
      text: "Puede haber inestabilidad temporal.[ Por ahora no aceptamos contribuciones, pero los reportes de errores son bienvenidos.]",
      cta: "Reportar un error"
    }
  };

  /* ---------- No need to edit below this line ---------- */
  if (!NOTICE.show) return;

  const ICONS = document.body.dataset.icons;

  const escape = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  const icon = (name, cls = "") =>
    `<svg class="icon ${cls}" aria-hidden="true"><use href="${ICONS}#i-${name}"></use></svg>`;

  const storedLang = () => {
    try {
      return localStorage.getItem("fonoster.lang");
    } catch (e) {
      return null;
    }
  };

  // The icon hugs the first part; the lead, text, and link are separated by single spaces (the CSS expects this).
  const html = (lang) => {
    const s = NOTICE[lang === "es" ? "es" : "en"];
    const parts = [
      s.lead && `<strong>${escape(s.lead)}</strong>`,
      s.text && `<span>${escape(s.text).replace(/\[(.*?)\]/g, '<span class="hide-m">$1</span>')}</span>`,
      NOTICE.link &&
        s.cta &&
        `<a class="notice__link" href="${escape(NOTICE.link)}"><span>${escape(s.cta)}</span>${icon("arrow-right")}</a>`
    ].filter(Boolean);
    return `<div class="container notice__in"><p>${icon(NOTICE.icon, "notice__icon")}${parts.join(" ")}</p></div>`;
  };

  const bar = document.createElement("div");
  bar.className = "notice";
  bar.setAttribute("role", "note");
  bar.innerHTML = html(storedLang());
  document.currentScript.after(bar);

  // Follow the language picker; v1.js translates the rest of the page.
  document.addEventListener("change", (event) => {
    if (event.target.matches('[data-pref="lang"]')) bar.innerHTML = html(event.target.value);
  });
})();
