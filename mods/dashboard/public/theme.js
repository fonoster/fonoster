// Sets the theme before the first paint so there is no flash of the wrong one.
(function () {
  var theme = "dark";
  try {
    var pref = localStorage.getItem("fonoster.theme");
    if (pref === "light" || pref === "dark") theme = pref;
    else if (pref === "system" && window.matchMedia("(prefers-color-scheme: light)").matches) theme = "light";
  } catch (e) {}
  document.documentElement.dataset.theme = theme;
})();
