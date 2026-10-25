/* Small progressive enhancements; no framework, build step or network request. */
(() => {
  "use strict";
  const config = window.PORTFOLIO || {};
  const root = document.documentElement;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const clean = value => typeof value === "string" ? value.trim() : "";
  root.classList.add("js");

  const name = clean(config.name);
  if (name) {
    $$("[data-name]").forEach(node => { node.textContent = name; });
    document.title = `${name} — توسعه‌دهنده موبایل`;
    $('meta[name="description"]').content = `پورتفولیوی ${name}؛ توسعه‌دهنده Android با حدود سه سال تجربه تمرینی، در آغاز یادگیری SwiftUI و جویای کارآموزی iOS.`;
    $(".site-header .brand").setAttribute("aria-label", `${name}، ابتدای صفحه`);
  }

  // Only complete HTTPS URLs are used for external links.
  function webURL(value) {
    try {
      const url = new URL(clean(value));
      return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
    } catch { return ""; }
  }
  function activateLink(node, href, external = true) {
    node.href = href;
    node.removeAttribute("aria-disabled");
    if (external) {
      node.target = "_blank";
      node.rel = "noopener noreferrer";
    }
  }
  ["github", "linkedin"].forEach(key => {
    const href = webURL(config[key]);
    if (!href) return;
    activateLink($(`[data-contact="${key}"]`), href);
    const label = $(`[data-contact-label="${key}"]`);
    label.textContent = href.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "");
    label.dir = "ltr";
  });
  const email = clean(config.email);
  const validEmail = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) && !/[?&#]/.test(email);
  if (validEmail) {
    activateLink($('[data-contact="email"]'), `mailto:${email}`, false);
    const label = $('[data-contact-label="email"]');
    label.textContent = email;
    label.dir = "ltr";
    $(".copy-email").hidden = false;
  }
  let toastTimer;
  function notify(message) {
    const toast = $(".toast");
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("visible");
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 3500);
  }
  $(".copy-email").addEventListener("click", async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(email);
      notify("ایمیل کپی شد.");
    } catch {
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents($('[data-contact-label="email"]'));
        selection.removeAllRanges();
        selection.addRange(range);
      }
      notify("کپی خودکار در دسترس نیست؛ ایمیل را انتخاب و کپی کنید.");
    }
  });

  $$("[data-project]").forEach(card => {
    const key = card.dataset.project;
    const data = config.projects?.[key] || {};
    const pending = data.comingSoon === true;
    card.classList.toggle("is-coming-soon", pending);
    const content = $(".project-content", card);
    content.inert = pending;
    if (pending) {
      content.setAttribute("aria-hidden", "true");
      card.setAttribute("aria-label", "بزودی");
    } else {
      content.removeAttribute("aria-hidden");
      card.removeAttribute("aria-label");
    }
    $(".coming-soon", card).hidden = !pending;
    const link = $("[data-repo]", card);
    const href = webURL(data.repo);
    link.hidden = !href;
    if (!href) link.removeAttribute("href");
    if (href) {
      activateLink(link, href);
      link.hidden = false;
      link.setAttribute("aria-label", `مشاهده کد ${$("h3", card).textContent} در GitHub، زبانه جدید`);
    }
    const path = clean(data.screenshot);
    // Relative paths work for local files and GitHub Pages project sites.
    if (!path || /^(?:[a-z][a-z\d+.-]*:|[\\/]|.*\\)/i.test(path)) return;
    const img = $(".project-screenshot", card);
    const illustration = $(".project-illustration", card);
    img.alt = clean(data.screenshotAlt) || `نمای پروژه ${$("h3", card).textContent}`;
    function showScreenshot() {
      img.hidden = false;
      if (illustration) illustration.hidden = true;
      const artwork = $(".project-art", card);
      artwork.removeAttribute("role");
      artwork.removeAttribute("aria-label");
    }
    img.addEventListener("load", showScreenshot, { once: true });
    img.addEventListener("error", () => {
      if (illustration) { img.hidden = true; illustration.hidden = false; }
    }, { once: true });
    img.loading = "eager";
    img.src = path;
    if (img.complete && img.naturalWidth) showScreenshot();
    if (key === "dice") {
      const heroImage = $("[data-hero-screenshot]");
      heroImage.src = path;
      heroImage.alt = img.alt;
    }
  });

  const themeButton = $(".theme-toggle");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  let savedTheme;
  try { savedTheme = localStorage.getItem("portfolio-theme"); } catch { /* Storage is optional. */ }
  let manualTheme = savedTheme === "dark" || savedTheme === "light";
  function setTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === "dark";
    themeButton.setAttribute("aria-label", dark ? "فعال‌کردن حالت روشن" : "فعال‌کردن حالت تیره");
    $("use", themeButton).setAttribute("href", dark ? "#i-sun" : "#i-moon");
    $('meta[name="theme-color"]').content = dark ? "#000000" : "#ffffff";
  }
  setTheme(manualTheme ? savedTheme : prefersDark.matches ? "dark" : "light");
  themeButton.hidden = false;
  themeButton.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    manualTheme = true;
    setTheme(next);
    try { localStorage.setItem("portfolio-theme", next); } catch { /* Still works without storage. */ }
  });
  prefersDark.addEventListener?.("change", event => { if (!manualTheme) setTheme(event.matches ? "dark" : "light"); });

  const menuButton = $(".menu-toggle");
  const nav = $("#main-nav");
  menuButton.hidden = false;
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "بستن منو" : "بازکردن منو");
    $("use", menuButton).setAttribute("href", open ? "#i-close" : "#i-menu");
  }
  menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
  $$("a", nav).forEach(link => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      menuButton.focus();
    }
  });
  document.addEventListener("click", event => {
    if (!event.target.closest(".site-header")) setMenu(false);
  });
  window.matchMedia("(min-width: 681px)").addEventListener?.("change", () => setMenu(false));
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        $(".site-header").classList.toggle("is-dark", entry.target.id === "projects");
        $$("a", nav).forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-15% 0px -65% 0px" });
    $$("main section[id]").forEach(section => observer.observe(section));
  }

})();
