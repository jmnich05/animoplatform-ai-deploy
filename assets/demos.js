const demoTabs = [...document.querySelectorAll("[data-demo-tab]")];
const demoPanels = [...document.querySelectorAll("[data-demo-panel]")];

function trackDemo(name, detail = {}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, { page_path: window.location.pathname, ...detail });
  }
}

function activateDemo(name, updateHash = true) {
  const activeTab = demoTabs.find((tab) => tab.dataset.demoTab === name) || demoTabs[0];
  if (!activeTab) return;

  demoTabs.forEach((tab) => {
    const active = tab === activeTab;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  demoPanels.forEach((panel) => {
    const active = panel.dataset.demoPanel === activeTab.dataset.demoTab;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  });

  if (updateHash) history.replaceState(null, "", `#${activeTab.dataset.demoTab}`);
  trackDemo("demo_view", { demo_name: activeTab.dataset.demoTab });
}

demoTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateDemo(tab.dataset.demoTab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = demoTabs.length - 1;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % demoTabs.length;
    else nextIndex = (index - 1 + demoTabs.length) % demoTabs.length;
    demoTabs[nextIndex].focus();
    activateDemo(demoTabs[nextIndex].dataset.demoTab);
  });
});

const requestedDemo = window.location.hash.slice(1);
if (demoTabs.some((tab) => tab.dataset.demoTab === requestedDemo)) activateDemo(requestedDemo, false);

document.querySelectorAll(".choice-chip").forEach((choice) => {
  choice.addEventListener("click", () => {
    const storeGroup = choice.closest("[data-store-choices]");
    if (storeGroup) {
      storeGroup.querySelectorAll(".choice-chip").forEach((item) => {
        const selected = item === choice;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      document.querySelector("[data-order-store]").textContent = `${choice.textContent.trim()} cart prepared`;
    } else {
      const selected = choice.getAttribute("aria-pressed") !== "true";
      choice.classList.toggle("is-selected", selected);
      choice.setAttribute("aria-pressed", String(selected));
    }
  });
});

document.querySelector("[data-build-meals]")?.addEventListener("click", () => {
  const result = document.querySelector("[data-meal-result]");
  const label = document.querySelector("[data-meal-button-label]");
  if (!result || !label) return;
  result.classList.add("is-refreshing");
  label.textContent = "Refreshing the week";
  window.setTimeout(() => {
    result.classList.remove("is-refreshing");
    label.textContent = "Week ready";
    trackDemo("demo_meal_plan_built");
  }, 520);
});

document.querySelectorAll("[data-brief-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const done = !button.classList.contains("is-done");
    if (done) button.dataset.originalText = button.textContent;
    button.classList.toggle("is-done", done);
    button.textContent = done ? "Added to today" : (button.dataset.originalText || "Open");
    trackDemo("demo_brief_action", { action_label: button.dataset.originalText || button.textContent });
  });
});

const audioToggle = document.querySelector("[data-audio-toggle]");
const audioProgress = document.querySelector("[data-audio-progress]");
const audioTime = document.querySelector("[data-audio-time]");
const audioLabel = document.querySelector("[data-audio-label]");
let audioTimer = 0;
let elapsed = 0;

function paintAudio() {
  const total = 364;
  const minutes = Math.floor(elapsed / 60);
  const seconds = String(elapsed % 60).padStart(2, "0");
  audioProgress.style.width = `${Math.min(100, (elapsed / total) * 100)}%`;
  audioTime.textContent = `${minutes}:${seconds} / 6:04`;
  if (elapsed >= total) {
    window.clearInterval(audioTimer);
    audioTimer = 0;
    audioToggle.setAttribute("aria-pressed", "false");
    audioLabel.textContent = "Play brief";
  }
}

audioToggle?.addEventListener("click", () => {
  const playing = audioToggle.getAttribute("aria-pressed") !== "true";
  audioToggle.setAttribute("aria-pressed", String(playing));
  audioLabel.textContent = playing ? "Pause brief" : "Play brief";
  if (playing) {
    audioTimer = window.setInterval(() => { elapsed += 4; paintAudio(); }, 500);
    trackDemo("demo_parent_brief_play");
  } else {
    window.clearInterval(audioTimer);
    audioTimer = 0;
  }
});
