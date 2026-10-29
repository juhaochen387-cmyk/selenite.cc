document.addEventListener("DOMContentLoaded", loadGames);
document.addEventListener("DOMContentLoaded", guardGameGridsFromAds);

// AdSense in-feed auto ads see the uniform grid of .game tiles as a "feed" and
// inject an <ins> ad as a sibling tile, which breaks the flex layout. Strip any
// ad node that lands directly inside a game grid so ads never fill into the list.
function guardGameGridsFromAds() {
    const gridIds = ["games", "topGames", "starredgames", "recentgames"];
    const isAdNode = (node) => {
        if (!node || node.nodeType !== 1) return false;
        if (node.tagName === "INS") return true;
        if (node.classList && node.classList.contains("adsbygoogle")) return true;
        if (/^(aswift_|google_ads_|div-gpt-)/.test(node.id || "")) return true;
        if (typeof node.querySelector === "function" &&
            node.querySelector("ins.adsbygoogle, iframe[id^='google_ads_iframe'], iframe[id^='aswift_']")) return true;
        return false;
    };
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (isAdNode(node)) node.remove();
            }
        }
    });
    gridIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el, { childList: true });
    });
}

let elements = [];
let gameElements = [];
let topElements = [];
let isDev = [];
let pageData;
let starredGames = [];
let recentGames = [];
let globalPlays = null;
let selectedTags = new Set();

function getHiddenGames() {
    try {
        const parsed = JSON.parse(localStorage.getItem("selenite.hiddenGames") || "[]");
        return parsed;
    } catch {
        return [];
    }
}

function getRecentlyPlayed() {
    try {
        const parsed = JSON.parse(localStorage.getItem("selenite.recentlyPlayed") || "[]");
        return parsed;
    } catch {
        return [];
    }
}

async function loadGames() {
    if (type == "g") pageData = { path: "/resources/games.json", prefix: "semag", type: "g" };
    else if (type == "a") pageData = { path: "/resources/apps.json", prefix: "sppa", type: "a" };
    else { sAlert("this is not valid"); return; }

    let data = await (await fetch(pageData.path)).json();
    const topGamesDisabled = localStorage.getItem("selenite.disableTopGames") == "true";

    data.forEach((g, i) => { g._key = g.name.toUpperCase(); g._index = i; });
    data.sort((a, b) => a._key < b._key ? -1 : a._key > b._key ? 1 : 0);

    const gamesElement = document.getElementById("games");
    const topGElement = document.getElementById("topGames");
    const gamesFragment = document.createDocumentFragment();
    const topFragment = document.createDocumentFragment();

    const hiddenGames = pageData.type === "g" ? getHiddenGames() : [];
    const hiddenSet = new Set(hiddenGames);

    starredGames = JSON.parse(localStorage.getItem("selenite.starred") || "[]");
    if (hiddenGames.length > 0) {
        starredGames = starredGames.filter((game) => !hiddenSet.has(game));
        localStorage.setItem("selenite.starred", JSON.stringify(starredGames));
    }
    const starredSet = new Set(starredGames);

    data.forEach((element) => {
        if (hiddenSet.has(element.directory)) return;
        const isStarred = starredSet.has(element.directory);
        const newElement = document.createElement("a");
        newElement.dataset.target = element.directory;
        newElement.dataset.image = element.image;
        newElement.dataset.name = element._key;
        newElement.dataset.top = element.tags && element.tags.includes("top") ? "1" : "";
        newElement.dataset.index = element._index;
        newElement.dataset.tags = element.tags ? element.tags.join(",") : "";
        newElement.className = "game";
        newElement.href = `/loader.html?title=${encodeURIComponent(element.name)}&dir=${element.directory}&img=${element.image}&type=${pageData.type}`;

        const image = document.createElement("img");
        image.src = `/resources/${pageData.prefix}/${element.directory}/${element.image}`;
        image.loading = "lazy";
        image.onerror = function() { this.src = "/img/missing.svg"; };

        const holder = document.createElement("div");
        holder.id = "holder";
        const title = document.createElement("h1");
        title.innerText = element.name;
        holder.appendChild(title);

        const star = document.createElement("img");
        star.id = "star";
        star.className = "star";
        star.src = isStarred ? "/img/star-fill.svg" : "/img/star.svg";

        const warnings = document.createElement("warnings");
        newElement.appendChild(image);
        newElement.appendChild(holder);
        newElement.appendChild(warnings);
        holder.appendChild(star);

        if (element.tags) {
            [["18+", "thirteen", "18+"], ["13+", "thirteen", "13+"],
             ["horror", "horror", "😱"], ["gore", "gore", "🩸"]].forEach(([tag, cls, text]) => {
                if (element.tags.includes(tag)) {
                    const w = document.createElement("warning");
                    w.innerText = text;
                    w.className = cls;
                    warnings.appendChild(w);
                }
            });
            if (element.tags.includes("wip")) {
                isDev.push(element.directory);
                const w = document.createElement("warning");
                w.innerText = "WIP";
                w.className = "thirteen";
                warnings.appendChild(w);
            }
            if (element.tags.includes("top") && !topGamesDisabled) {
                topFragment.appendChild(newElement);
                topElements.push(newElement);
            } else {
                gamesFragment.appendChild(newElement);
                gameElements.push(newElement);
            }
        } else {
            gamesFragment.appendChild(newElement);
            gameElements.push(newElement);
        }

        elements.push(newElement);
        star.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            starEvent(e);
        });
    });

    gamesElement.appendChild(gamesFragment);
    if (topGElement) topGElement.appendChild(topFragment);
    const visibleGameCount = elements.length;
    const hiddenCount = hiddenGames.length;
    const itemLabel = pageData.type === "a" ? "apps" : "games";
    document.getElementById("gameCount").innerText = hiddenCount > 0
        ? `${visibleGameCount} ${itemLabel} loaded (${hiddenCount} hidden)`
        : `${visibleGameCount} ${itemLabel} loaded!`;
    document.getElementById("loadingMsg").style.display = "none";
    document.getElementById("allHeader").style.display = "block";
    const topHeader = document.getElementById("topHeader");
    if (topHeader && topElements.length > 0) topHeader.style.display = "block";
    if (isDev.length > 0) console.log(isDev.join(","));

    starredGames = JSON.parse(localStorage.getItem("selenite.starred") || "[]");
    if (starredGames.length > 0) {
        document.getElementById("starredHeader").style.display = "block";
        _rebuildStarred();
    }

    const recentHeader = document.getElementById("recentHeader");
    const recentGamesEl = document.getElementById("recentgames");
    if (recentHeader && recentGamesEl && localStorage.getItem("selenite.disableRecentlyPlayed") != "true") {
        const pageDirs = new Set(elements.map((el) => el.dataset.target));
        recentGames = getRecentlyPlayed().filter((dir) => !hiddenSet.has(dir) && pageDirs.has(dir));
        if (recentGames.length > 0) {
            recentHeader.style.display = "block";
            _rebuildRecent();
        }
    }

    const tagSet = new Set();
    data.forEach((element) => {
        if (hiddenSet.has(element.directory)) return;
        (element.tags || []).forEach((t) => { if (t !== "top") tagSet.add(t); });
    });
    renderTagFilters([...tagSet].sort());
}

function renderTagFilters(tags) {
    const chipsContainer = document.getElementById("tagChips");
    const chipsLabel = document.getElementById("tagChipsLabel");
    if (!chipsContainer) return;
    if (tags.length === 0) {
        chipsContainer.style.display = "none";
        if (chipsLabel) chipsLabel.style.display = "none";
        updateFiltersToggleLabel();
        return;
    }
    chipsContainer.innerHTML = "";
    const fragment = document.createDocumentFragment();
    tags.forEach((tag) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "tagChip";
        chip.innerText = tag;
        chip.dataset.tag = tag;
        chip.addEventListener("click", () => {
            if (selectedTags.has(tag)) {
                selectedTags.delete(tag);
                chip.classList.remove("active");
            } else {
                selectedTags.add(tag);
                chip.classList.add("active");
            }
            updateFiltersToggleLabel();
            applyFilters();
        });
        fragment.appendChild(chip);
    });
    chipsContainer.appendChild(fragment);
    updateFiltersToggleLabel();
}

function updateFiltersToggleLabel() {
    const toggleBtn = document.getElementById("filtersToggle");
    if (!toggleBtn) return;
    toggleBtn.innerText = selectedTags.size > 0 ? `filters (${selectedTags.size})` : "filters";
    toggleBtn.classList.toggle("hasActive", selectedTags.size > 0);
}

document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("filtersToggle");
    const panel = document.getElementById("tagFilters");
    if (!toggleBtn || !panel) return;
    toggleBtn.addEventListener("click", () => {
        const isOpen = panel.classList.toggle("open");
        toggleBtn.classList.toggle("open", isOpen);
    });
});

function elementMatchesFilters(el, input, selectedTags) {
    const matchesSearch = el.dataset.name.includes(input);
    const elTags = el.dataset.tags ? el.dataset.tags.split(",") : [];
    const matchesTags = selectedTags.size === 0 || elTags.some((t) => selectedTags.has(t));
    return matchesSearch && matchesTags;
}

// Filters a section built from cloned .game tiles (starred / recently played):
// hides individual clones that don't match, and hides the whole section
// (container + header) only if nothing inside it matches anymore.
function filterClonedSection(containerId, headerId, input, selectedTags) {
    const container = document.getElementById(containerId);
    const header = document.getElementById(headerId);
    if (!container) return;
    let anyVisible = false;
    container.querySelectorAll(".game").forEach((el) => {
        if (elementMatchesFilters(el, input, selectedTags)) {
            el.style.display = "flex";
            anyVisible = true;
        } else {
            el.style.display = "none";
        }
    });
    container.style.display = anyVisible ? "" : "none";
    if (header) header.style.display = anyVisible ? "block" : "none";
}

function applyFilters() {
    const searchInput = document.getElementById("gamesearch");
    const input = (searchInput ? searchInput.value : "").toUpperCase();
    let hidden = 0;
    elements.forEach((el) => {
        if (elementMatchesFilters(el, input, selectedTags)) {
            el.style.display = "flex";
        } else {
            el.style.display = "none";
            hidden++;
        }
    });
    document.getElementById("noResults").style.display = hidden >= elements.length ? "flex" : "none";

    // top games shares tiles with the main list (already filtered above via
    // `elements`) - its header just needs to track whether any survived.
    const topHeader = document.getElementById("topHeader");
    if (topHeader) {
        const anyTopVisible = topElements.some((el) => el.parentElement.id === "topGames" && el.style.display !== "none");
        topHeader.style.display = anyTopVisible ? "block" : "none";
    }

    filterClonedSection("starredgames", "starredHeader", input, selectedTags);
    filterClonedSection("recentgames", "recentHeader", input, selectedTags);
}

let searchRaf = null;
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("gamesearch").addEventListener("input", () => {
        if (searchRaf) cancelAnimationFrame(searchRaf);
        searchRaf = requestAnimationFrame(() => {
            applyFilters();
            searchRaf = null;
        });
    });
});

// cloneNode(true) does not copy event listeners, so the cloned stars need their
// click handler re-bound here rather than relying on each caller to do it.
function _rebuildList(containerId, dirs) {
    const container = document.getElementById(containerId);
    const gamesEl = document.getElementById("games");
    const topGEl = document.getElementById("topGames");
    container.innerHTML = "";
    const fragment = document.createDocumentFragment();
    dirs.forEach((dir) => {
        const el = gamesEl.querySelector(`a.game[data-target='${dir}']`) || (topGEl && topGEl.querySelector(`a.game[data-target='${dir}']`));
        if (el) fragment.appendChild(el.cloneNode(true));
    });
    container.appendChild(fragment);
    container.querySelectorAll("#star").forEach((e) => {
        e.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); starEvent(e); });
    });
}

function _rebuildStarred() {
    _rebuildList("starredgames", starredGames);
}

function _rebuildRecent() {
    _rebuildList("recentgames", recentGames.slice(0, 4));
}

function getTotalPlayTime(directory) {
    const playTime = JSON.parse(localStorage.getItem("selenite.playTime") || "{}");
    return Object.values(playTime).reduce((total, day) => total + (day[directory] || 0), 0);
}

function reSort(sortBy) {
    const gamesEl = document.getElementById("games");
    const topGEl = document.getElementById("topGames");
    const topHeader = document.getElementById("topHeader");

    if (sortBy === "az") {
        if (topGEl) {
            const frag = document.createDocumentFragment();
            topElements.forEach(el => frag.appendChild(el));
            topGEl.appendChild(frag);
            if (topHeader && topElements.length > 0) topHeader.style.display = "block";
        }
        const sorted = [...gameElements].sort((a, b) => a.dataset.name < b.dataset.name ? -1 : a.dataset.name > b.dataset.name ? 1 : 0);
        const frag = document.createDocumentFragment();
        sorted.forEach(el => frag.appendChild(el));
        gamesEl.appendChild(frag);
        applyFilters();
        return;
    }

    if (topHeader) topHeader.style.display = "none";
    const all = [...gameElements, ...topElements];
    if (sortBy === "za") {
        all.sort((a, b) => a.dataset.name > b.dataset.name ? -1 : a.dataset.name < b.dataset.name ? 1 : 0);
    } else if (sortBy === "played") {
        all.sort((a, b) => getTotalPlayTime(b.dataset.target) - getTotalPlayTime(a.dataset.target));
    } else if (sortBy === "global") {
        if (!globalPlays) return;
        all.sort((a, b) => (globalPlays.get(b.dataset.target) || 0) - (globalPlays.get(a.dataset.target) || 0));
    } else if (sortBy === "new") {
        all.sort((a, b) => a.dataset.index - b.dataset.index);
    }
    const fragment = document.createDocumentFragment();
    all.forEach(el => fragment.appendChild(el));
    gamesEl.appendChild(fragment);
    applyFilters();
}

document.addEventListener("DOMContentLoaded", () => {
    const sortSelect = document.getElementById("gamesort");
    if (!sortSelect) return;
    sortSelect.addEventListener("change", async () => {
        if (sortSelect.value === "global" && !globalPlays) {
            sortSelect.disabled = true;
            try {
                const data = await (await fetch("/api/analytics/get")).json();
                globalPlays = new Map(data.map(e => [e.name, e.plays]));
            } finally {
                sortSelect.disabled = false;
            }
        }
        reSort(sortSelect.value);
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const randomBtn = document.getElementById("randomGame");
    if (!randomBtn) return;
    randomBtn.addEventListener("click", () => {
        if (elements.length === 0) return;
        const visible = elements.filter((el) => el.style.display !== "none");
        const pool = visible.length > 0 ? visible : elements;
        const random = pool[Math.floor(Math.random() * pool.length)];
        location.href = random.href;
    });
});

function starEvent(e) {
    const game = e.target.parentNode.parentNode.getAttribute("data-target");
    starredGames = JSON.parse(localStorage.getItem("selenite.starred") || "[]");
    const header = document.getElementById("starredHeader");

    if (starredGames.indexOf(game) == -1) {
        starredGames.push(game);
        starredGames.sort();
        header.style.display = "block";
        e.target.src = "/img/star-fill.svg";
    } else {
        starredGames.splice(starredGames.indexOf(game), 1);
        document.querySelectorAll(`a.game[data-target='${game}'] #star`).forEach((s) => { s.src = "/img/star.svg"; });
        header.style.display = starredGames.length > 0 ? "block" : "none";
    }

    localStorage.setItem("selenite.starred", JSON.stringify(starredGames));
    document.querySelectorAll(`a.game[data-target='${game}'] #star`).forEach(s => {s.src=starredGames.includes(game)?"/img/star-fill.svg":"/img/star.svg";});
    _rebuildStarred();
    applyFilters();
}
