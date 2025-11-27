document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  const navLinks = document.querySelectorAll(".main-nav .nav-link");
  const revealElems = document.querySelectorAll(".reveal");
  const generateNow = document.querySelector(".nav-cta");

  navToggle &&
    navToggle.addEventListener("click", () => {
      mainNav.classList.toggle("open");
    });

  navLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const topOffset = 72;
          const top =
            target.getBoundingClientRect().top +
            window.pageYOffset -
            topOffset -
            8;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }
      navLinks.forEach((n) => n.classList.remove("active"));
      a.classList.add("active");
      if (mainNav.classList.contains("open")) mainNav.classList.remove("open");
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((ent) => {
        if (ent.isIntersecting) {
          ent.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElems.forEach((el) => observer.observe(el));

  const form = document.getElementById("contactForm");
  form &&
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const name = form.querySelector("#name").value.trim();
      const email = form.querySelector("#email").value.trim();
      const message = form.querySelector("#message").value.trim();
      if (!name || !email || !message) {
        alert("Please fill out all fields before submitting.");
        return;
      }
      alert("Thanks, " + name + "! Your message has been noted (simulated).");
      form.reset();
    });

  if (window.location.hash) {
    const el = document.querySelector(window.location.hash);
    if (el) {
      setTimeout(() => {
        const topOffset = 72;
        const top =
          el.getBoundingClientRect().top + window.pageYOffset - topOffset - 8;
        window.scrollTo({ top, behavior: "smooth" });
      }, 300);
    }
  }
});
