const buttons = document.getElementById("buttons");
const noBtn = document.getElementById("noBtn");
const yesBtn = document.getElementById("yesBtn");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closeBtn");
const note = document.getElementById("note");
const page = document.getElementById("page");
const ideasList = document.getElementById("ideasList");
const ideaOverlay = document.getElementById("ideaOverlay");
const ideaCloseBtn = document.getElementById("ideaCloseBtn");
const ideaMessage = document.getElementById("ideaMessage");
const toast = document.getElementById("toast");
const IDEA_KEY = "valentineIdeaSelection";

const PROXIMITY_PX = 90;
const SAFE_PADDING = 10;
let isAccepted = false;
let isFleeing = false;

function getRandomPosition() {
  const area = buttons.getBoundingClientRect();
  const btn = noBtn.getBoundingClientRect();
  const yes = yesBtn.getBoundingClientRect();

  const maxX = area.width - btn.width - SAFE_PADDING * 2;
  const maxY = area.height - btn.height - SAFE_PADDING * 2;

  let x = 0;
  let y = 0;
  let tries = 0;

  do {
    x = SAFE_PADDING + Math.random() * Math.max(1, maxX);
    y = SAFE_PADDING + Math.random() * Math.max(1, maxY);
    tries += 1;

    const proposed = {
      left: area.left + x,
      right: area.left + x + btn.width,
      top: area.top + y,
      bottom: area.top + y + btn.height,
    };

    const overlapsYes = !(
      proposed.right < yes.left - 12 ||
      proposed.left > yes.right + 12 ||
      proposed.bottom < yes.top - 12 ||
      proposed.top > yes.bottom + 12
    );

    if (!overlapsYes) break;
  } while (tries < 12);

  return { x, y };
}

function moveNoButton() {
  if (isAccepted) return;
  if (!isFleeing) {
    isFleeing = true;
    noBtn.classList.add("flee");
  }
  const { x, y } = getRandomPosition();
  noBtn.style.left = `${x}px`;
  noBtn.style.top = `${y}px`;
}


function distanceToButton(clientX, clientY) {
  const rect = noBtn.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  return Math.sqrt(dx * dx + dy * dy);
}

function onPointerMove(event) {
  if (isAccepted) return;
  const distance = distanceToButton(event.clientX, event.clientY);
  if (distance < PROXIMITY_PX) {
    moveNoButton();
  }
}

function onTouchMove(event) {
  if (isAccepted) return;
  if (event.touches.length === 0) return;
  const touch = event.touches[0];
  const distance = distanceToButton(touch.clientX, touch.clientY);
  if (distance < PROXIMITY_PX) {
    moveNoButton();
  }
}

function acceptYes() {
  if (isAccepted) return;
  isAccepted = true;
  noBtn.hidden = true;
  buttons.hidden = true;
  note.hidden = false;
  page.classList.remove("locked");
  overlay.hidden = false;
}

function activateCarouselItem(item) {
  document.querySelectorAll(".carousel-item").forEach((el) => {
    el.classList.toggle("active", el === item);
  });
}

function initCarouselFocus() {
  const track = document.getElementById("carouselTrack");
  if (!track) return;

  const items = Array.from(track.querySelectorAll(".carousel-item"));
  if (items.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      let best = null;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!best || entry.intersectionRatio > best.intersectionRatio) {
            best = entry;
          }
        }
      });
      if (best) activateCarouselItem(best.target);
    },
    {
      root: track.parentElement,
      threshold: [0.3, 0.6, 0.9],
    }
  );

  items.forEach((item) => observer.observe(item));
  activateCarouselItem(items[0]);
}

noBtn.addEventListener("mouseenter", moveNoButton);
noBtn.addEventListener("touchstart", moveNoButton, { passive: true });

buttons.addEventListener("pointermove", onPointerMove);
buttons.addEventListener("touchmove", onTouchMove, { passive: true });

window.addEventListener("resize", () => {
  if (isAccepted) return;
  if (isFleeing) moveNoButton();
});

yesBtn.addEventListener("click", acceptYes);

closeBtn.addEventListener("click", () => {
  overlay.hidden = true;
});

function lockIdeaButtons(selectedIdea) {
  if (!ideasList) return;
  const buttons = Array.from(ideasList.querySelectorAll(".idea"));
  buttons.forEach((button) => {
    button.disabled = true;
    button.classList.add("is-locked");
    if (selectedIdea && button.dataset.idea === selectedIdea) {
      button.classList.add("is-selected");
    }
  });
}

function restoreIdeaSelection() {
  const saved = sessionStorage.getItem(IDEA_KEY);
  if (!saved) return;
  lockIdeaButtons(saved);
}

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyRIR2qEJm_0lRrkTscNzk-2jvxAP6BzEDcw__ow_PZG3RzELX6a5dZMGO0ElJCVFzbOA/exec";

async function sendIdeaSelection(idea) {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea }),
    });
    return true;
  } catch (error) {
    // Silent fail for local/offline viewing.
  }
  return false;
}

function showToast() {
  if (!toast) return;
  toast.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

if (ideasList) {
  ideasList.addEventListener("click", (event) => {
    const button = event.target.closest(".idea");
    if (!button) return;
    if (sessionStorage.getItem(IDEA_KEY)) return;
    const idea = button.dataset.idea || "That";
    ideaMessage.textContent = `${idea} sounds perfect. Can’t wait to do that with you. ❤️`;
    ideaOverlay.hidden = false;
    sessionStorage.setItem(IDEA_KEY, idea);
    lockIdeaButtons(idea);
    sendIdeaSelection(idea).then((ok) => {
      if (ok) showToast();
    });
  });
}

ideaCloseBtn.addEventListener("click", () => {
  ideaOverlay.hidden = true;
});

requestAnimationFrame(() => {
  initCarouselFocus();
  restoreIdeaSelection();
});
