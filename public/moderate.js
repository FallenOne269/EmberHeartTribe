const authForm = document.querySelector("#moderate-auth");
const tokenInput = document.querySelector("#owner-token");
const statusNode = document.querySelector("#moderate-status");
const listNode = document.querySelector("#moderate-list");
const refreshButton = document.querySelector("#moderate-refresh");
let ownerToken = "";

function setStatus(message, type = "") {
  statusNode.textContent = message;
  statusNode.dataset.type = type;
}

function formatDate(iso) {
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(iso));
}

function render(stories) {
  listNode.replaceChildren();
  if (!stories.length) {
    const empty = document.createElement("p");
    empty.className = "moderate-empty";
    empty.textContent = "No stories to moderate.";
    listNode.append(empty);
    return;
  }
  stories.forEach((story) => {
    const card = document.createElement("article");
    card.className = "moderate-card";
    card.dataset.id = story.id;
    const meta = document.createElement("p");
    meta.className = "moderate-meta";
    const reports = story.reportCount ? ` · ${story.reportCount} report${story.reportCount === 1 ? "" : "s"}` : "";
    meta.textContent = `${story.kind === "received" ? "Kindness I received" : "Kindness I gave"} · ${formatDate(story.createdAt)}${story.hidden ? " · hidden" : ""}${reports}`;
    const body = document.createElement("p");
    body.className = "moderate-body";
    body.textContent = story.body;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "moderate-delete";
    button.textContent = "Delete story";
    button.addEventListener("click", async () => {
      button.disabled = true;
      const response = await fetch(`/api/stories/${story.id}`, { method: "DELETE", headers: { "x-stories-admin-token": ownerToken } });
      if (response.ok) {
        card.remove();
        setStatus("Story deleted.", "success");
      } else {
        button.disabled = false;
        setStatus("That story could not be deleted.", "error");
      }
    });
    card.append(meta, body, button);
    listNode.append(card);
  });
}

async function loadModerationStories() {
  setStatus("Loading stories…");
  const response = await fetch("/api/stories?includeHidden=1", { headers: { "x-stories-admin-token": ownerToken } });
  if (!response.ok) throw new Error();
  const data = await response.json();
  setStatus(`${data.stories.length} stor${data.stories.length === 1 ? "y" : "ies"} loaded.`, "success");
  render(data.stories);
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  ownerToken = tokenInput.value;
  try {
    await loadModerationStories();
  } catch {
    ownerToken = "";
    setStatus("The owner token was not accepted.", "error");
    return;
  }
  tokenInput.value = "";
  authForm.hidden = true;
  refreshButton.hidden = false;
});

refreshButton.addEventListener("click", async () => {
  refreshButton.disabled = true;
  try {
    await loadModerationStories();
  } catch {
    setStatus("Stories could not be refreshed.", "error");
  } finally {
    refreshButton.disabled = false;
  }
});
