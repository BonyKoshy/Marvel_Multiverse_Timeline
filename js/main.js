// js/main.js - Marvel Multiverse Holo-Database Main Logic
document.addEventListener("DOMContentLoaded", () => {
  // --- STATE MANAGEMENT ---
  let decadeChart = null;
  let typeChart = null;
  let activeTypeFilter = "all";
  let sortAscending = true;
  let unwatchedOnly = false;
  let watchedItems = JSON.parse(localStorage.getItem("watchedItems")) || {};

  // --- SELECTORS ---
  const timelineContainer = document.getElementById("timeline-container");
  const timelineCounter = document.getElementById("timeline-counter");
  const noResults = document.getElementById("no-results");
  const noResultsResetBtn = document.getElementById("no-results-reset-btn");
  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("clear-search-btn");
  const eraSelect = document.getElementById("era-select");
  const universeSelect = document.getElementById("universe-select");
  const typeButtonsContainer = document.getElementById("type-buttons");
  const eraNavPillsContainer = document.getElementById("era-nav-pills");
  const unwatchedToggle = document.getElementById("unwatched-toggle");
  const sortOrderToggle = document.getElementById("sort-order-toggle");
  const resetFiltersButton = document.getElementById("reset-filters");

  // Doomsday Timer Selectors
  const doomDaysEl = document.getElementById("doom-days");
  const doomHoursEl = document.getElementById("doom-hours");
  const doomMinutesEl = document.getElementById("doom-minutes");
  const doomSecondsEl = document.getElementById("doom-seconds");
  const toggleDoomsdayBtn = document.getElementById("toggle-doomsday-banner");
  const doomsdayWidget = document.getElementById("doomsday-widget");
  const doomsdayTimerDisplay = document.getElementById("doomsday-timer-display");
  const doomChevron = document.getElementById("doom-chevron");

  // Header & Analytics
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const themeToggleDarkIcon = document.getElementById("theme-toggle-dark-icon");
  const themeToggleLightIcon = document.getElementById("theme-toggle-light-icon");
  const toggleAnalyticsBtn = document.getElementById("toggle-analytics-btn");
  const analyticsSection = document.getElementById("analytics-section");
  const markAllWatchedBtn = document.getElementById("mark-all-watched-btn");
  const clearAllWatchedBtn = document.getElementById("clear-all-watched-btn");

  // Media Type Icons Map
  const typeIcons = {
    all: "🌐",
    Film: "🎬",
    "TV Series": "📺",
    Comic: "📚",
    Short: "⏱️",
    "Animated Series": "🎨",
    "Animated Film": "🌟",
    "Animated Short": "✨",
    Digital: "💻",
    Special: "⚡"
  };

  // --- INITIALIZATION ---
  function init() {
    initDarkMode();
    initDoomsdayTimer();
    initAnalyticsToggle();
    populateFilters();
    populateEraJumpNav();
    setupEventListeners();
    createCharts();
    applyFilters();
  }

  // ==========================================================
  // 1. DOOMSDAY COUNTDOWN TIMER
  // ==========================================================
  function initDoomsdayTimer() {
    // Avengers: Doomsday Theatrical Release Target: Dec 18, 2026 00:00:00 UTC
    const doomsdayTarget = new Date("2026-12-18T00:00:00Z").getTime();

    function updateCountdown() {
      const now = new Date().getTime();
      const distance = doomsdayTarget - now;

      if (distance <= 0) {
        doomDaysEl.textContent = "00";
        doomHoursEl.textContent = "00";
        doomMinutesEl.textContent = "00";
        doomSecondsEl.textContent = "00";
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      doomDaysEl.textContent = days.toLocaleString();
      doomHoursEl.textContent = String(hours).padStart(2, "0");
      doomMinutesEl.textContent = String(minutes).padStart(2, "0");
      doomSecondsEl.textContent = String(seconds).padStart(2, "0");
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Collapsed State from localStorage
    const isCollapsed = localStorage.getItem("doomsday-collapsed") === "true";
    if (isCollapsed && doomsdayTimerDisplay) {
      doomsdayTimerDisplay.classList.add("hidden");
      doomChevron.classList.add("rotate-180");
    }

    toggleDoomsdayBtn.addEventListener("click", () => {
      const hidden = doomsdayTimerDisplay.classList.toggle("hidden");
      doomChevron.classList.toggle("rotate-180", hidden);
      localStorage.setItem("doomsday-collapsed", hidden ? "true" : "false");
    });
  }

  // ==========================================================
  // 2. THEME & DISPLAY PREFERENCES
  // ==========================================================
  function initDarkMode() {
    const savedTheme = localStorage.getItem("color-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);

    if (isDark) {
      document.documentElement.classList.add("dark");
      themeToggleLightIcon.classList.remove("hidden");
      themeToggleDarkIcon.classList.add("hidden");
    } else {
      document.documentElement.classList.remove("dark");
      themeToggleLightIcon.classList.add("hidden");
      themeToggleDarkIcon.classList.remove("hidden");
    }
  }

  function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("color-theme", isDark ? "dark" : "light");
    themeToggleLightIcon.classList.toggle("hidden", !isDark);
    themeToggleDarkIcon.classList.toggle("hidden", isDark);

    if (decadeChart) decadeChart.destroy();
    if (typeChart) typeChart.destroy();
    createCharts();
    applyFilters();
  }

  function initAnalyticsToggle() {
    const isCollapsed = localStorage.getItem("analytics-collapsed") === "true";
    if (isCollapsed && analyticsSection) {
      analyticsSection.classList.add("hidden");
    }

    if (toggleAnalyticsBtn && analyticsSection) {
      toggleAnalyticsBtn.addEventListener("click", () => {
        const hidden = analyticsSection.classList.toggle("hidden");
        localStorage.setItem("analytics-collapsed", hidden ? "true" : "false");
        toggleAnalyticsBtn.classList.toggle("border-cyan-400", !hidden);
        toggleAnalyticsBtn.classList.toggle("text-cyan-400", !hidden);
      });
    }
  }

  // ==========================================================
  // 3. FILTER PROTOCOLS & CONTROLS
  // ==========================================================
  function getUniqueValues(key) {
    const values = marvelData.map((item) => item[key]);
    return [...new Set(values)];
  }

  function populateFilters() {
    // Eras in chronological order
    const eras = getUniqueValues("era");
    eras.forEach((era) => {
      const option = document.createElement("option");
      option.value = era;
      option.textContent = era;
      eraSelect.appendChild(option);
    });

    // Universes sorted alphabetically
    const universes = getUniqueValues("universe").sort();
    universes.forEach((universe) => {
      const option = document.createElement("option");
      option.value = universe;
      option.textContent = universe;
      universeSelect.appendChild(option);
    });

    // Types with icons
    const types = ["all", ...getUniqueValues("type").sort()];
    typeButtonsContainer.innerHTML = types
      .map((type) => {
        const icon = typeIcons[type] || "🔹";
        return `
          <button data-type="${type}" class="media-pill ${type === "all" ? "active" : ""}">
            <span>${icon}</span>
            <span>${type === "all" ? "All Formats" : type}</span>
          </button>
        `;
      })
      .join("");
  }

  function populateEraJumpNav() {
    const eras = getUniqueValues("era");
    eraNavPillsContainer.innerHTML = eras
      .map((era) => {
        const safeId = era.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
        return `
          <button data-target="era-${safeId}" class="era-chip">
            ${era}
          </button>
        `;
      })
      .join("");
  }

  // ==========================================================
  // 4. TIMELINE RENDERING
  // ==========================================================
  function renderTimeline(items) {
    timelineContainer.innerHTML = "";

    if (items.length === 0) {
      noResults.classList.remove("hidden");
      timelineCounter.textContent = "0 entries found";
      return;
    }

    noResults.classList.add("hidden");
    timelineCounter.textContent = `Displaying ${items.length} of ${marvelData.length} archived entries`;

    // Group items by Era to create clear visual chapters
    let currentEra = null;

    items.forEach((item, index) => {
      // Check if era changed, if so create Era Banner
      if (item.era !== currentEra) {
        currentEra = item.era;
        const safeId = currentEra.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
        const eraItemsCount = items.filter((i) => i.era === currentEra).length;

        const eraDiv = document.createElement("div");
        eraDiv.id = `era-${safeId}`;
        eraDiv.className = "era-divider";
        eraDiv.innerHTML = `
          <div class="era-banner">
            <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f5ff]"></span>
            <h3 class="era-title text-slate-900 dark:text-cyan-400">${currentEra}</h3>
            <span class="text-xs font-tech font-bold text-slate-500 uppercase tracking-wider ml-1">
              (${eraItemsCount} ${eraItemsCount === 1 ? "entry" : "entries"})
            </span>
          </div>
        `;
        timelineContainer.appendChild(eraDiv);
      }

      // Render Item Card
      const isWatched = !!watchedItems[item.title];
      const typeIcon = typeIcons[item.type] || "🔹";

      const cardDiv = document.createElement("div");
      cardDiv.className = "timeline-item relative mb-5 pl-8";
      cardDiv.innerHTML = `
        <div class="timeline-node"></div>
        <div data-title="${item.title}" class="timeline-card ${isWatched ? "watched" : ""}">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1.5">
                <span class="badge-year">
                  ⏱️ ${item.year}
                </span>
                <span class="badge-tag badge-universe">
                  🌐 ${item.universe}
                </span>
                <span class="badge-tag badge-type">
                  ${typeIcon} ${item.type}
                </span>
              </div>
              <h4 class="timeline-title font-orbitron font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-wide truncate">
                ${item.title}
              </h4>
            </div>

            <!-- Watched Toggle Checkbox -->
            <div class="flex-shrink-0 flex items-center gap-2 pt-1">
              <label class="cursor-pointer" title="Mark as Watched / Completed">
                <input
                  type="checkbox"
                  data-title="${item.title}"
                  class="watched-checkbox custom-checkbox"
                  ${isWatched ? "checked" : ""}
                />
              </label>
            </div>
          </div>
        </div>
      `;
      timelineContainer.appendChild(cardDiv);
    });
  }

  // ==========================================================
  // 5. PROGRESS & GAMIFIED CLEARANCE RANK
  // ==========================================================
  function updateProgress() {
    const total = marvelData.length;
    const watchedCount = Object.keys(watchedItems).length;
    const percentage = total > 0 ? Math.round((watchedCount / total) * 100) : 0;

    // Header counters
    const headerWatched = document.getElementById("header-watched-count");
    const headerTotal = document.getElementById("header-total-count");
    const headerPct = document.getElementById("header-progress-pct");
    if (headerWatched) headerWatched.textContent = watchedCount;
    if (headerTotal) headerTotal.textContent = total;
    if (headerPct) headerPct.textContent = `${percentage}%`;

    // Analytics progress meter
    const progressBarFill = document.getElementById("progress-bar-fill");
    const clearancePct = document.getElementById("clearance-percentage");
    const clearanceRank = document.getElementById("clearance-rank");

    if (progressBarFill) progressBarFill.style.width = `${percentage}%`;
    if (clearancePct) clearancePct.textContent = `${percentage}% Complete (${watchedCount}/${total})`;

    // Determine Clearance Rank
    let rankText = "Level 1 - Civilian Contact";
    if (percentage >= 100) rankText = "Omnipresent - The Watcher (Multiverse Cleared!)";
    else if (percentage >= 85) rankText = "Level 10 - S.H.I.E.L.D. Director (Fury Clearance)";
    else if (percentage >= 70) rankText = "Level 8 - Regional Specialist";
    else if (percentage >= 50) rankText = "Level 7 - Tactical Command (Coulson Clearance)";
    else if (percentage >= 30) rankText = "Level 5 - Strike Team Operative";
    else if (percentage >= 15) rankText = "Level 3 - Field Agent";
    else if (percentage > 0) rankText = "Level 2 - Recruited Asset";

    if (clearanceRank) clearanceRank.textContent = rankText;
  }

  // ==========================================================
  // 6. ANALYTICS & CHARTS
  // ==========================================================
  function createCharts() {
    const isDark = document.documentElement.classList.contains("dark");
    const gridColor = isDark ? "rgba(0, 245, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";
    const textColor = isDark ? "#94a3b8" : "#475569";
    const accent = isDark ? "#00f5ff" : "#0284c7";

    const decadeCtx = document.getElementById("releasesByDecadeChart")?.getContext("2d");
    if (decadeCtx) {
      decadeChart = new Chart(decadeCtx, {
        type: "bar",
        data: {
          labels: [],
          datasets: [
            {
              label: "Timeline Entries",
              data: [],
              backgroundColor: accent,
              borderRadius: 6,
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: "Rajdhani", size: 12 } },
            },
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: "Rajdhani", size: 12 } },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isDark ? "#0b1120" : "#ffffff",
              titleColor: isDark ? "#00f5ff" : "#0284c7",
              bodyColor: isDark ? "#f8fafc" : "#0f172a",
              borderColor: isDark ? "#00f5ff" : "#0284c7",
              borderWidth: 1,
              titleFont: { family: "Orbitron" },
              bodyFont: { family: "Rajdhani" },
            },
          },
        },
      });
    }

    const typeCtx = document.getElementById("mediaTypeChart")?.getContext("2d");
    if (typeCtx) {
      typeChart = new Chart(typeCtx, {
        type: "doughnut",
        data: {
          labels: [],
          datasets: [
            {
              label: "Format Distribution",
              data: [],
              backgroundColor: [
                "#00f5ff",
                "#b366ff",
                "#10b981",
                "#f59e0b",
                "#ef4444",
                "#38bdf8",
                "#e879f9",
                "#facc15",
                "#64748b",
              ],
              hoverOffset: 6,
              borderColor: isDark ? "#0b1120" : "#ffffff",
              borderWidth: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: textColor,
                boxWidth: 12,
                font: { family: "Rajdhani", size: 11, weight: "bold" },
              },
            },
            tooltip: {
              backgroundColor: isDark ? "#0b1120" : "#ffffff",
              titleColor: isDark ? "#00f5ff" : "#0284c7",
              bodyColor: isDark ? "#f8fafc" : "#0f172a",
              borderColor: isDark ? "#00f5ff" : "#0284c7",
              borderWidth: 1,
            },
          },
        },
      });
    }
  }

  function updateCharts(items) {
    if (!decadeChart || !typeChart) return;

    // Decade grouping
    const decadeData = items.reduce((acc, item) => {
      if (item.startYear > 0) {
        const decade = Math.floor(item.startYear / 10) * 10;
        acc[decade] = (acc[decade] || 0) + 1;
      } else {
        acc["Ancient (BC)"] = (acc["Ancient (BC)"] || 0) + 1;
      }
      return acc;
    }, {});

    const sortedDecades = Object.keys(decadeData).sort((a, b) => {
      if (a === "Ancient (BC)") return -1;
      if (b === "Ancient (BC)") return 1;
      return Number(a) - Number(b);
    });

    decadeChart.data.labels = sortedDecades.map((d) => (d === "Ancient (BC)" ? d : `${d}s`));
    decadeChart.data.datasets[0].data = sortedDecades.map((d) => decadeData[d]);
    decadeChart.update();

    // Media type grouping
    const typeData = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});

    typeChart.data.labels = Object.keys(typeData);
    typeChart.data.datasets[0].data = Object.values(typeData);
    typeChart.update();
  }

  // ==========================================================
  // 7. FILTER APPLICATION & EVENT HANDLING
  // ==========================================================
  function applyFilters() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedEra = eraSelect.value;
    const selectedUniverse = universeSelect.value;

    // Toggle Clear button visibility
    clearSearchBtn.classList.toggle("hidden", searchTerm.length === 0);

    const filtered = marvelData.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm) ||
        item.year.toLowerCase().includes(searchTerm) ||
        item.universe.toLowerCase().includes(searchTerm) ||
        item.era.toLowerCase().includes(searchTerm);

      const matchesEra = selectedEra === "all" || item.era === selectedEra;
      const matchesUniverse = selectedUniverse === "all" || item.universe === selectedUniverse;
      const matchesType = activeTypeFilter === "all" || item.type === activeTypeFilter;
      const matchesUnwatched = !unwatchedOnly || !watchedItems[item.title];

      return matchesSearch && matchesEra && matchesUniverse && matchesType && matchesUnwatched;
    });

    // Sort order
    const sorted = [...filtered].sort((a, b) => {
      return sortAscending ? a.startYear - b.startYear : b.startYear - a.startYear;
    });

    renderTimeline(sorted);
    updateCharts(filtered);
    updateProgress();
  }

  function resetAll() {
    searchInput.value = "";
    clearSearchBtn.classList.add("hidden");
    eraSelect.value = "all";
    universeSelect.value = "all";
    activeTypeFilter = "all";
    sortAscending = true;
    unwatchedOnly = false;
    unwatchedToggle.checked = false;
    sortOrderToggle.textContent = "Past → Future ▲";

    document
      .querySelectorAll(".media-pill")
      .forEach((btn) => btn.classList.toggle("active", btn.dataset.type === "all"));

    applyFilters();
  }

  // Handle Watched Checkbox Click
  function handleTimelineClick(e) {
    const checkbox = e.target.closest(".watched-checkbox");
    if (!checkbox) return;

    const title = checkbox.dataset.title;
    const card = checkbox.closest(".timeline-card");

    if (checkbox.checked) {
      watchedItems[title] = true;
      if (card) card.classList.add("watched");

      // Confetti burst
      const rect = checkbox.getBoundingClientRect();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        colors: ["#00f5ff", "#10b981", "#b366ff", "#fbbf24"],
      });
    } else {
      delete watchedItems[title];
      if (card) card.classList.remove("watched");
    }

    localStorage.setItem("watchedItems", JSON.stringify(watchedItems));
    updateProgress();

    // If unwatched-only is active, re-filter
    if (unwatchedOnly) {
      applyFilters();
    }
  }

  function setupEventListeners() {
    // Dark mode toggle
    darkModeToggle.addEventListener("click", toggleDarkMode);

    // Search & Filter controls
    searchInput.addEventListener("input", applyFilters);
    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      applyFilters();
    });

    eraSelect.addEventListener("change", applyFilters);
    universeSelect.addEventListener("change", applyFilters);
    resetFiltersButton.addEventListener("click", resetAll);
    noResultsResetBtn.addEventListener("click", resetAll);

    // Unwatched toggle
    unwatchedToggle.addEventListener("change", (e) => {
      unwatchedOnly = e.target.checked;
      applyFilters();
    });

    // Sort Order toggle
    sortOrderToggle.addEventListener("click", () => {
      sortAscending = !sortAscending;
      sortOrderToggle.textContent = sortAscending ? "Past → Future ▲" : "Future → Past ▼";
      applyFilters();
    });

    // Media Type filter buttons
    typeButtonsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".media-pill");
      if (!btn) return;
      activeTypeFilter = btn.dataset.type;
      document
        .querySelectorAll(".media-pill")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilters();
    });

    // Quick Era Jump Navigation
    eraNavPillsContainer.addEventListener("click", (e) => {
      const chip = e.target.closest(".era-chip");
      if (!chip) return;
      const targetId = chip.dataset.target;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    // Watched card clicks
    timelineContainer.addEventListener("click", handleTimelineClick);

    // Bulk Actions
    markAllWatchedBtn.addEventListener("click", () => {
      if (confirm("Mark all 179 Marvel Multiverse entries as watched?")) {
        marvelData.forEach((item) => {
          watchedItems[item.title] = true;
        });
        localStorage.setItem("watchedItems", JSON.stringify(watchedItems));
        applyFilters();
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      }
    });

    clearAllWatchedBtn.addEventListener("click", () => {
      if (confirm("Reset watch progress for all entries?")) {
        watchedItems = {};
        localStorage.removeItem("watchedItems");
        applyFilters();
      }
    });
  }

  // Run initialization
  init();
});