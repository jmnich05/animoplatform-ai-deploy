// Small Businesses page: the booking demo inside the phone.
// Three screens: pick a service, pick a time, confirmation. Nothing is sent or saved; it shows how
// short a booking path can be.

const demo = document.querySelector("[data-book]");
if (demo) {
  const steps = [...demo.querySelectorAll("[data-book-step]")];
  const serviceName = demo.querySelector("[data-book-service-name]");
  const summary = demo.querySelector("[data-book-summary]");
  let service = "";

  const go = (number) => {
    steps.forEach((step) => { step.hidden = step.dataset.bookStep !== String(number); });
    // Move keyboard and screen-reader focus to the new screen's heading.
    steps[number - 1]?.querySelector(".phone__title")?.focus({ preventScroll: true });
    if (typeof window.gtag === "function") {
      window.gtag("event", "smallbiz_demo", { demo_step: number, page_path: window.location.pathname });
    }
  };

  demo.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.bookService) {
      service = button.dataset.bookService;
      if (serviceName) serviceName.textContent = service.toLowerCase();
      go(2);
    } else if (button.dataset.bookTime) {
      if (summary) summary.textContent = `${service}, ${button.dataset.bookTime}`;
      go(3);
    } else if (button.hasAttribute("data-book-back") || button.hasAttribute("data-book-reset")) {
      go(1);
    }
  });
}
