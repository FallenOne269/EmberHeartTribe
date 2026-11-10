document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = link.getAttribute("href");
    if (!target || target === "#join-link-coming-soon") return;
    const section = document.querySelector(target);
    if (section) {
      event.preventDefault();
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

const audio = document.querySelector("#ember-audio");
const playToggle = document.querySelector("#play-toggle");
const seek = document.querySelector("#audio-seek");
const currentTime = document.querySelector("#audio-current");
const duration = document.querySelector("#audio-duration");
const status = document.querySelector("#audio-status");
const trackArt = document.querySelector(".track-art");

if (audio && playToggle && seek && currentTime && duration && status && trackArt) {
  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainder}`;
  };

  const setPlayingState = (isPlaying) => {
    playToggle.classList.toggle("is-playing", isPlaying);
    playToggle.setAttribute("aria-pressed", String(isPlaying));
    playToggle.setAttribute("aria-label", isPlaying ? "Pause Ember Heart track" : "Play Ember Heart track");
    status.textContent = isPlaying ? "Now playing" : "Ready to play";
    trackArt.classList.toggle("is-playing", isPlaying);
  };

  playToggle.addEventListener("click", async () => {
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch {
      status.textContent = "Tap play to listen";
    }
  });

  audio.addEventListener("loadedmetadata", () => {
    duration.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("timeupdate", () => {
    currentTime.textContent = formatTime(audio.currentTime);
    seek.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  });

  seek.addEventListener("input", () => {
    if (audio.duration) audio.currentTime = (Number(seek.value) / 100) * audio.duration;
  });

  audio.addEventListener("play", () => setPlayingState(true));
  audio.addEventListener("pause", () => setPlayingState(false));
  audio.addEventListener("ended", () => {
    setPlayingState(false);
    seek.value = 0;
    currentTime.textContent = "0:00";
    status.textContent = "Play it again";
  });
  audio.addEventListener("error", () => {
    status.textContent = "Track unavailable";
    playToggle.disabled = true;
  });
}

const storyForm = document.querySelector("#story-form");
const storyBody = document.querySelector("#story-body");
const storyCount = document.querySelector("#story-count");
const storyStatus = document.querySelector("#story-form-status");
const storyList = document.querySelector("#story-list");

function storyVisitorToken() {
  try {
    const key = "ember-heart-story-visitor";
    let value = localStorage.getItem(key);
    if (!value) {
      value = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
      localStorage.setItem(key, value);
    }
    return value;
  } catch {
    return `${Date.now()}-${Math.random()}-${Math.random()}`;
  }
}

const visitorToken = storyVisitorToken();

function storyDate(iso) {
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(iso));
}

function setStoryStatus(message, type = "") {
  if (!storyStatus) return;
  storyStatus.textContent = message;
  storyStatus.dataset.type = type;
}

function renderStory(story) {
  const card = document.createElement("article");
  card.className = "story-card";
  card.dataset.id = story.id;

  const top = document.createElement("div");
  top.className = "story-card-top";
  const tag = document.createElement("span");
  tag.className = "story-tag";
  tag.textContent = story.kind === "received" ? "Kindness I received" : "Kindness I gave";
  const date = document.createElement("time");
  date.className = "story-date";
  date.dateTime = story.createdAt;
  date.textContent = storyDate(story.createdAt);
  top.append(tag, date);

  const body = document.createElement("p");
  body.className = "story-card-body";
  body.textContent = story.body;

  const actions = document.createElement("div");
  actions.className = "story-actions";
  const heart = document.createElement("button");
  heart.type = "button";
  heart.className = "story-heart";
  heart.setAttribute("aria-label", "Heart this story");
  heart.setAttribute("aria-pressed", "false");
  heart.textContent = "♥";
  heart.addEventListener("click", async () => {
    heart.disabled = true;
    try {
      const response = await fetch(`/api/stories/${story.id}/heart`, { method: "POST" });
      if (!response.ok) throw new Error();
      heart.classList.add("is-hearted");
      heart.setAttribute("aria-pressed", "true");
    } catch {
      heart.disabled = false;
    }
  });
  const share = document.createElement("button");
  share.type = "button";
  share.className = "story-share";
  share.setAttribute("aria-label", "Share this story");
  share.textContent = "Share";
  share.addEventListener("click", async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#stories`;
    const shareText = `${story.body}\n\nFrom Ember Heart Tribe — Stories from the Ruins.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "A story from Ember Heart Tribe", text: shareText, url: shareUrl });
        share.textContent = "Shared";
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        share.textContent = "Copied";
      } else {
        throw new Error();
      }
      setTimeout(() => { share.textContent = "Share"; }, 1800);
    } catch (error) {
      if (error?.name !== "AbortError") setStoryStatus("Sharing is unavailable here. You can copy the story text instead.", "error");
    }
  });
  const report = document.createElement("button");
  report.type = "button";
  report.className = "story-report";
  report.textContent = "Report";
  report.addEventListener("click", async () => {
    report.disabled = true;
    try {
      const response = await fetch(`/api/stories/${story.id}/report`, { method: "POST" });
      if (!response.ok) throw new Error();
      report.textContent = "Reported";
      report.classList.add("is-reported");
    } catch {
      report.disabled = false;
      report.textContent = "Try again";
    }
  });
  actions.append(heart, share, report);
  card.append(top, body, actions);
  return card;
}

function renderStories(stories) {
  if (!storyList) return;
  storyList.replaceChildren();
  if (!stories.length) {
    const empty = document.createElement("p");
    empty.className = "stories-empty";
    empty.textContent = "No stories yet. Be the first to leave one by the fire.";
    storyList.append(empty);
    return;
  }
  stories.forEach((story) => storyList.append(renderStory(story)));
}

async function loadStories() {
  if (!storyList) return;
  try {
    const response = await fetch("/api/stories", { cache: "no-store" });
    if (!response.ok) throw new Error();
    const data = await response.json();
    renderStories(data.stories);
  } catch {
    const error = document.createElement("p");
    error.className = "stories-empty stories-empty--error";
    error.textContent = "The fire is quiet for a moment. Stories will return soon.";
    storyList.replaceChildren(error);
  }
}

if (storyForm && storyBody) {
  const updateCount = () => { storyCount.textContent = `${storyBody.value.length} / 500`; };
  storyBody.addEventListener("input", updateCount);
  updateCount();
  storyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = storyForm.querySelector("button[type=submit]");
    const selected = storyForm.querySelector("input[name=kind]:checked");
    submit.disabled = true;
    setStoryStatus("Leaving it by the fire…");
    try {
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Story-Visitor": visitorToken },
        body: JSON.stringify({ body: storyBody.value, kind: selected?.value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "That story could not be posted.");
      storyBody.value = "";
      updateCount();
      setStoryStatus("Your story is by the fire.", "success");
      const empty = storyList.querySelector(".stories-empty");
      if (empty) storyList.replaceChildren();
      storyList.prepend(renderStory(data.story));
    } catch (error) {
      setStoryStatus(error.message, "error");
    } finally {
      submit.disabled = false;
    }
  });
}

loadStories();
