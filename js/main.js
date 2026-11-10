// js/main.js - Marvel Multiverse Holo-Database (Doomsday Edition)
document.addEventListener("DOMContentLoaded", () => {
  // --- STATE MANAGEMENT ---
  let decadeChart = null;
  let typeChart = null;
  let selectedTypes = new Set(); // Multi-select media formats
  let sortAscending = true;
  let unwatchedOnly = false;
  let watchedItems = JSON.parse(localStorage.getItem("watchedItems")) || {};
  let autoDockTimeout = null;

  // --- SELECTORS ---
  // Timeline & Counters
  const timelineContainer = document.getElementById("timeline-container");
  const timelineCounter = document.getElementById("timeline-counter");
  const noResults = document.getElementById("no-results");
  const noResultsResetBtn = document.getElementById("no-results-reset-btn");

  // Desktop Filter Selectors
  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("clear-search-btn");
  const eraSelect = document.getElementById("era-select");
  const universeSelect = document.getElementById("universe-select");
  const typeButtonsContainer = document.getElementById("type-buttons");
  const clearFormatsBtn = document.getElementById("clear-formats-btn");
  const unwatchedToggle = document.getElementById("unwatched-toggle");
  const sortOrderToggle = document.getElementById("sort-order-toggle");
  const resetFiltersButton = document.getElementById("reset-filters");

  // Mobile Drawer Selectors
  const openMobileFilterBtn = document.getElementById("open-mobile-filter-btn");
  const closeMobileDrawerBtn = document.getElementById("close-mobile-drawer-btn");
  const applyMobileFilterBtn = document.getElementById("apply-mobile-filter-btn");
  const mobileDrawerBackdrop = document.getElementById("mobile-drawer-backdrop");
  const mobileSearchInput = document.getElementById("mobile-search-input");
  const mobileEraSelect = document.getElementById("mobile-era-select");
  const mobileUniverseSelect = document.getElementById("mobile-universe-select");
  const mobileTypeButtonsContainer = document.getElementById("mobile-type-buttons");
  const mobileUnwatchedToggle = document.getElementById("mobile-unwatched-toggle");

  // Doomsday Modal & Header Pill Selectors
  const doomsdayModalBackdrop = document.getElementById("doomsday-modal-backdrop");
  const closeDoomsdayModalBtn = document.getElementById("close-doomsday-modal-btn");
  const minimizeDoomsdayModalBtn = document.getElementById("minimize-doomsday-modal-btn");
  const doomsdayTriggerBtn = document.getElementById("doomsday-trigger-btn");
  const doomHeaderCountdown = document.getElementById("doom-header-countdown");
  const doomModalDays = document.getElementById("doom-modal-days");
  const doomModalHours = document.getElementById("doom-modal-hours");
  const doomModalMinutes = document.getElementById("doom-modal-minutes");
  const doomModalSeconds = document.getElementById("doom-modal-seconds");

  // Theme & Analytics Selectors
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const themeToggleDarkIcon = document.getElementById("theme-toggle-dark-icon");
  const themeToggleLightIcon = document.getElementById("theme-toggle-light-icon");
  const toggleAnalyticsBtn = document.getElementById("toggle-analytics-btn");
  const analyticsSection = document.getElementById("analytics-section");
  const markAllWatchedBtn = document.getElementById("mark-all-watched-btn");
  const clearAllWatchedBtn = document.getElementById("clear-all-watched-btn");

  // ==========================================================
  // SVG LINE ICONS LIBRARY (NO EMOJIS)
  // ==========================================================
  function getSvgIcon(name, extraClasses = "w-3.5 h-3.5") {
    switch (name) {
      case "film":
        return `<svg class="${extraClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18"/><line x1="7" x2="7" y1="2" y2="22"/><line x1="17" x2="17" y1="2" y2="22"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="2" x2="7" y1="7" y2="7"/><line x1="2" x2="7" y1="17" y2="17"/><line x1="17" x2="22" y1="17" y2="17"/><line x1="17" x2="22" y1="7" y2="7"/></svg>`;
      case "tv":
        return `<svg class="${extraClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="7" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>`;
      case "comic":
        return `<svg class="${extraClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>`;
      case "short":
        return `<svg class="${extraClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
      case "animated-series":
        return `<svg class="${extraClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`;
      case "animated-film":
        return `<svg class="${extraClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`;
      case "animated-short":
        return `<svg class="${extraClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="M12 18v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="m16.24 16.24 2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="m16.24 7.76 2.83-2.83"/></svg>`;
      case "digital":
        return `<svg class="${extraClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`;
      case "special":
        return `<svg class="${extraClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
      case "clock":
        return `<svg class="${extraClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
      case "globe":
        return `<svg class="${extraClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
      case "lock":
        return `<svg class="${extraClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
      case "arrow-up":
        return `<svg class="${extraClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;
      case "arrow-down":
        return `<svg class="${extraClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`;
      default:
        return `<svg class="${extraClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
    }
  }

  function getTypeIconName(type) {
    switch (type) {
      case "Film": return "film";
      case "TV Series": return "tv";
      case "Comic": return "comic";
      case "Short": return "short";
      case "Animated Series": return "animated-series";
      case "Animated Film": return "animated-film";
      case "Animated Short": return "animated-short";
      case "Digital": return "digital";
      case "Special": return "special";
      default: return "film";
    }
  }

  // --- INITIALIZATION ---
  function init() {
    initDarkMode();
    initDoomsdayTimer();
    initDoomsdayModalLifecycle();
    initAnalyticsToggle();
    populateFilters();
    setupEventListeners();
    createCharts();
    applyFilters();
  }

  // ==========================================================
  // 1. DOOMSDAY POPUP & COUNTDOWN
  // ==========================================================
  const DOOMSDAY_TARGET = new Date("2026-12-18T00:00:00Z").getTime();
  let wasDoomsdayReleased = new Date().getTime() >= DOOMSDAY_TARGET;

  function initDoomsdayTimer() {
    function updateCountdown() {
      const now = new Date().getTime();
      const distance = DOOMSDAY_TARGET - now;

      if (distance <= 0) {
        if (doomModalDays) doomModalDays.textContent = "00";
        if (doomModalHours) doomModalHours.textContent = "00";
        if (doomModalMinutes) doomModalMinutes.textContent = "00";
        if (doomModalSeconds) doomModalSeconds.textContent = "00";
        if (doomHeaderCountdown) doomHeaderCountdown.textContent = "NOW";

        // Automatically unlock the Doomsday checkbox when target is reached
        if (!wasDoomsdayReleased) {
          wasDoomsdayReleased = true;
          applyFilters();
        }
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (doomModalDays) doomModalDays.textContent = days.toLocaleString();
      if (doomModalHours) doomModalHours.textContent = String(hours).padStart(2, "0");
      if (doomModalMinutes) doomModalMinutes.textContent = String(minutes).padStart(2, "0");
      if (doomModalSeconds) doomModalSeconds.textContent = String(seconds).padStart(2, "0");

      if (doomHeaderCountdown) doomHeaderCountdown.textContent = `${days}d ${hours}h`;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  function openDoomsdayModal() {
    if (doomsdayModalBackdrop) {
      if (autoDockTimeout) clearTimeout(autoDockTimeout);
      const modalCard = document.getElementById("doomsday-modal-card");
      if (modalCard) {
        modalCard.classList.remove("docking");
        modalCard.style.removeProperty("--dock-x");
        modalCard.style.removeProperty("--dock-y");
      }
      doomsdayModalBackdrop.classList.add("active");
    }
  }

  function closeDoomsdayModal() {
    if (doomsdayModalBackdrop) {
      doomsdayModalBackdrop.classList.remove("active");
    }
  }

  function dockDoomsdayModal() {
    if (!doomsdayModalBackdrop || !doomsdayTriggerBtn) {
      closeDoomsdayModal();
      return;
    }
    const modalCard = document.getElementById("doomsday-modal-card");
    if (!modalCard) {
      closeDoomsdayModal();
      return;
    }

    // Calculate translation vector from center of modal to center of trigger button
    const modalRect = modalCard.getBoundingClientRect();
    const triggerRect = doomsdayTriggerBtn.getBoundingClientRect();

    const modalCenterX = modalRect.left + modalRect.width / 2;
    const modalCenterY = modalRect.top + modalRect.height / 2;
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const triggerCenterY = triggerRect.top + triggerRect.height / 2;

    const deltaX = triggerCenterX - modalCenterX;
    const deltaY = triggerCenterY - modalCenterY;

    modalCard.style.setProperty("--dock-x", `${deltaX}px`);
    modalCard.style.setProperty("--dock-y", `${deltaY}px`);
    modalCard.classList.add("docking");

    setTimeout(() => {
      closeDoomsdayModal();
      modalCard.classList.remove("docking");
      modalCard.style.removeProperty("--dock-x");
      modalCard.style.removeProperty("--dock-y");

      // Visual feedback: flash/ping the header pill to acknowledge receipt
      doomsdayTriggerBtn.classList.add("dock-received");
      setTimeout(() => {
        doomsdayTriggerBtn.classList.remove("dock-received");
      }, 1100);
    }, 420);
  }

  function initDoomsdayModalLifecycle() {
    // Show modal when the page loads at first, then shrinks to the header pill
    setTimeout(() => {
      openDoomsdayModal();
      autoDockTimeout = setTimeout(() => {
        dockDoomsdayModal();
      }, 4000);
    }, 350);

    // Modal triggers
    if (doomsdayTriggerBtn) {
      doomsdayTriggerBtn.addEventListener("click", openDoomsdayModal);
    }
    if (closeDoomsdayModalBtn) {
      closeDoomsdayModalBtn.addEventListener("click", dockDoomsdayModal);
    }
    if (minimizeDoomsdayModalBtn) {
      minimizeDoomsdayModalBtn.addEventListener("click", dockDoomsdayModal);
    }

    // Close/dock on backdrop click
    if (doomsdayModalBackdrop) {
      doomsdayModalBackdrop.addEventListener("click", (e) => {
        if (e.target === doomsdayModalBackdrop) {
          dockDoomsdayModal();
        }
      });
    }

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        dockDoomsdayModal();
        closeMobileDrawer();
      }
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
    const isCollapsed = localStorage.getItem("analytics-collapsed") !== "false"; // Default hidden
    if (!isCollapsed && analyticsSection) {
      analyticsSection.classList.remove("hidden");
      toggleAnalyticsBtn.classList.add("border-emerald-500", "text-emerald-500");
    }

    if (toggleAnalyticsBtn && analyticsSection) {
      toggleAnalyticsBtn.addEventListener("click", () => {
        const isHidden = analyticsSection.classList.toggle("hidden");
        localStorage.setItem("analytics-collapsed", isHidden ? "true" : "false");
        toggleAnalyticsBtn.classList.toggle("border-emerald-500", !isHidden);
        toggleAnalyticsBtn.classList.toggle("text-emerald-500", !isHidden);
      });
    }
  }

  // ==========================================================
  // 3. FILTER POPULATION (DESKTOP & MOBILE)
  // ==========================================================
  function getUniqueValues(key) {
    const values = marvelData.map((item) => item[key]);
    return [...new Set(values)];
  }

  function populateFilters() {
    // Unique Eras
    const eras = getUniqueValues("era");
    eras.forEach((era) => {
      const opt = document.createElement("option");
      opt.value = era;
      opt.textContent = era;
      eraSelect.appendChild(opt);

      const mOpt = opt.cloneNode(true);
      mobileEraSelect.appendChild(mOpt);
    });

    // Unique Universes
    const universes = getUniqueValues("universe").sort();
    universes.forEach((universe) => {
      const opt = document.createElement("option");
      opt.value = universe;
      opt.textContent = universe;
      universeSelect.appendChild(opt);

      const mOpt = opt.cloneNode(true);
      mobileUniverseSelect.appendChild(mOpt);
    });

    // Unique Types for Multi-Select Pills
    const types = getUniqueValues("type").sort();
    renderFormatPills(types);
  }

  function renderFormatPills(types) {
    const renderPillHTML = (type) => {
      const icon = getSvgIcon(getTypeIconName(type), "w-3.5 h-3.5 flex-shrink-0");
      const isSelected = selectedTypes.has(type);
      return `
        <button type="button" data-type="${type}" class="media-pill ${isSelected ? "active" : ""}">
          ${icon}
          <span>${type}</span>
        </button>
      `;
    };

    const pillsHTML = types.map(renderPillHTML).join("");
    typeButtonsContainer.innerHTML = pillsHTML;
    mobileTypeButtonsContainer.innerHTML = pillsHTML;
  }

  // ==========================================================
  // 4. TIMELINE RENDERING
  // ==========================================================
  function renderTimeline(items) {
    timelineContainer.innerHTML = "";

    if (items.length === 0) {
      noResults.classList.remove("hidden");
      timelineCounter.textContent = "0 entries";
      return;
    }

    noResults.classList.add("hidden");
    timelineCounter.textContent = `${items.length} of ${marvelData.length} entries`;

    // Group items by Era with clean headers
    let currentEra = null;
    const now = new Date().getTime();
    const isDoomsdayReleased = now >= DOOMSDAY_TARGET;

    items.forEach((item) => {
      if (item.era !== currentEra) {
        currentEra = item.era;
        const eraCount = items.filter((i) => i.era === currentEra).length;

        const eraDiv = document.createElement("div");
        eraDiv.className = "era-divider";
        eraDiv.innerHTML = `
          <div class="era-banner">
            <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            <h3 class="era-title">${currentEra}</h3>
            <span class="text-[11px] font-tech font-bold text-slate-500 ml-1">
              (${eraCount})
            </span>
          </div>
        `;
        timelineContainer.appendChild(eraDiv);
      }

      // Render Card
      const isWatched = !!watchedItems[item.title];
      const isDoomsday = item.title.includes("Doomsday");
      const iconSvg = getSvgIcon(getTypeIconName(item.type), "w-3 h-3 flex-shrink-0");
      const clockSvg = getSvgIcon("clock", "w-3 h-3 flex-shrink-0 text-emerald-500");
      const globeSvg = getSvgIcon("globe", "w-3 h-3 flex-shrink-0 text-slate-400");
      const lockSvg = getSvgIcon("lock", "w-3 h-3 flex-shrink-0 text-emerald-500");

      // Right action: LOCKED indicator for unreleased Doomsday, or Checkbox when released
      let rightActionHTML = "";
      if (isDoomsday && !isDoomsdayReleased) {
        rightActionHTML = `
          <div class="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-tech font-bold text-[11px] tracking-wider select-none" title="Classified until theatrical premiere (December 18, 2026)">
            ${lockSvg}
            <span>LOCKED</span>
          </div>
        `;
      } else {
        rightActionHTML = `
          <label class="cursor-pointer" title="Mark as Watched">
            <input
              type="checkbox"
              data-title="${item.title}"
              class="watched-checkbox custom-checkbox"
              ${isWatched ? "checked" : ""}
            />
          </label>
        `;
      }

      const cardDiv = document.createElement("div");
      cardDiv.className = "timeline-item";
      cardDiv.innerHTML = `
        <div class="timeline-node"></div>
        <div data-title="${item.title}" class="timeline-card ${isWatched ? "watched" : ""}">
          <div class="flex justify-between items-start gap-2.5 sm:gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap mb-1.5">
                <span class="badge-year inline-flex items-center gap-1">${clockSvg} ${item.year}</span>
                <span class="badge-tag inline-flex items-center gap-1">${globeSvg} ${item.universe}</span>
                <span class="badge-tag inline-flex items-center gap-1">${iconSvg} ${item.type}</span>
              </div>
              <h4 class="card-title font-orbitron font-bold text-xs xs:text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-wide leading-snug break-words">
                ${item.title}
              </h4>
            </div>

            <div class="flex-shrink-0 flex items-center pt-0.5">
              ${rightActionHTML}
            </div>
          </div>
        </div>
      `;
      timelineContainer.appendChild(cardDiv);
    });
  }

  // ==========================================================
  // 5. PROGRESS & CLEARANCE LEVEL
  // ==========================================================
  function updateProgress() {
    const total = marvelData.length;
    const watchedCount = Object.keys(watchedItems).length;
    const percentage = total > 0 ? Math.round((watchedCount / total) * 100) : 0;

    // Header counter
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
    if (clearancePct) clearancePct.textContent = `${percentage}% (${watchedCount}/${total})`;

    // Rank text
    let rankText = "Level 1 - Civilian Contact";
    if (percentage >= 100) rankText = "Omnipresent - The Watcher";
    else if (percentage >= 85) rankText = "Level 10 - S.H.I.E.L.D. Director";
    else if (percentage >= 70) rankText = "Level 8 - Regional Specialist";
    else if (percentage >= 50) rankText = "Level 7 - Tactical Command";
    else if (percentage >= 30) rankText = "Level 5 - Strike Team Operative";
    else if (percentage >= 15) rankText = "Level 3 - Field Agent";
    else if (percentage > 0) rankText = "Level 2 - Recruited Asset";

    if (clearanceRank) clearanceRank.textContent = rankText;
  }

  // ==========================================================
  // 6. CHARTS (DOOMSDAY EMERALD / TITANIUM PALETTE)
  // ==========================================================
  function createCharts() {
    const isDark = document.documentElement.classList.contains("dark");
    const gridColor = isDark ? "rgba(16, 185, 129, 0.08)" : "rgba(0, 0, 0, 0.05)";
    const textColor = isDark ? "#94a3b8" : "#475569";
    const accent = isDark ? "#10b981" : "#059669";

    const decadeCtx = document.getElementById("releasesByDecadeChart")?.getContext("2d");
    if (decadeCtx) {
      decadeChart = new Chart(decadeCtx, {
        type: "bar",
        data: {
          labels: [],
          datasets: [
            {
              label: "Entries",
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
              ticks: { color: textColor, font: { family: "Rajdhani", size: 11 } },
            },
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: "Rajdhani", size: 11 } },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isDark ? "#0d1322" : "#ffffff",
              titleColor: "#10b981",
              bodyColor: isDark ? "#f8fafc" : "#0f172a",
              borderColor: "#10b981",
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
              label: "Format Count",
              data: [],
              backgroundColor: [
                "#10b981",
                "#059669",
                "#34d399",
                "#047857",
                "#6ee7b7",
                "#064e3b",
                "#022c22",
                "#a7f3d0",
                "#64748b",
              ],
              hoverOffset: 6,
              borderColor: isDark ? "#0d1322" : "#ffffff",
              borderWidth: 2,
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
                boxWidth: 10,
                font: { family: "Rajdhani", size: 11, weight: "bold" },
              },
            },
            tooltip: {
              backgroundColor: isDark ? "#0d1322" : "#ffffff",
              titleColor: "#10b981",
              bodyColor: isDark ? "#f8fafc" : "#0f172a",
              borderColor: "#10b981",
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
  // 7. FILTER APPLICATION
  // ==========================================================
  function updateSortButton() {
    if (!sortOrderToggle) return;
    sortOrderToggle.innerHTML = `
      <span>${sortAscending ? "Past → Future" : "Future → Past"}</span>
      ${getSvgIcon(sortAscending ? "arrow-up" : "arrow-down", "w-3.5 h-3.5")}
    `;
  }

  function applyFilters() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedEra = eraSelect.value;
    const selectedUniverse = universeSelect.value;

    clearSearchBtn.classList.toggle("hidden", searchTerm.length === 0);

    const filtered = marvelData.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm) ||
        item.year.toLowerCase().includes(searchTerm) ||
        item.universe.toLowerCase().includes(searchTerm) ||
        item.era.toLowerCase().includes(searchTerm);

      const matchesEra = selectedEra === "all" || item.era === selectedEra;
      const matchesUniverse = selectedUniverse === "all" || item.universe === selectedUniverse;
      const matchesType = selectedTypes.size === 0 || selectedTypes.has(item.type);
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
    mobileSearchInput.value = "";
    clearSearchBtn.classList.add("hidden");
    eraSelect.value = "all";
    mobileEraSelect.value = "all";
    universeSelect.value = "all";
    mobileUniverseSelect.value = "all";
    selectedTypes.clear();
    sortAscending = true;
    unwatchedOnly = false;
    unwatchedToggle.checked = false;
    mobileUnwatchedToggle.checked = false;
    updateSortButton();

    document
      .querySelectorAll(".media-pill")
      .forEach((btn) => btn.classList.remove("active"));

    applyFilters();
  }

  // ==========================================================
  // 8. MOBILE DRAWER HANDLING
  // ==========================================================
  function openMobileDrawer() {
    if (mobileDrawerBackdrop) {
      mobileDrawerBackdrop.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  function closeMobileDrawer() {
    if (mobileDrawerBackdrop) {
      mobileDrawerBackdrop.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  // ==========================================================
  // 9. EVENT LISTENERS
  // ==========================================================
  function setupEventListeners() {
    // Dark mode toggle
    darkModeToggle.addEventListener("click", toggleDarkMode);

    // Desktop search & filter controls
    searchInput.addEventListener("input", () => {
      mobileSearchInput.value = searchInput.value;
      applyFilters();
    });
    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      mobileSearchInput.value = "";
      applyFilters();
    });

    eraSelect.addEventListener("change", () => {
      mobileEraSelect.value = eraSelect.value;
      applyFilters();
    });
    universeSelect.addEventListener("change", () => {
      mobileUniverseSelect.value = universeSelect.value;
      applyFilters();
    });

    // Mobile drawer sync
    mobileSearchInput.addEventListener("input", () => {
      searchInput.value = mobileSearchInput.value;
      applyFilters();
    });
    mobileEraSelect.addEventListener("change", () => {
      eraSelect.value = mobileEraSelect.value;
      applyFilters();
    });
    mobileUniverseSelect.addEventListener("change", () => {
      universeSelect.value = mobileUniverseSelect.value;
      applyFilters();
    });

    // Mobile drawer open/close
    if (openMobileFilterBtn) openMobileFilterBtn.addEventListener("click", openMobileDrawer);
    if (closeMobileDrawerBtn) closeMobileDrawerBtn.addEventListener("click", closeMobileDrawer);
    if (applyMobileFilterBtn) applyMobileFilterBtn.addEventListener("click", closeMobileDrawer);
    if (mobileDrawerBackdrop) {
      mobileDrawerBackdrop.addEventListener("click", (e) => {
        if (e.target === mobileDrawerBackdrop) closeMobileDrawer();
      });
    }

    // Reset filters
    resetFiltersButton.addEventListener("click", resetAll);
    noResultsResetBtn.addEventListener("click", resetAll);

    // Unwatched toggles
    unwatchedToggle.addEventListener("change", (e) => {
      unwatchedOnly = e.target.checked;
      mobileUnwatchedToggle.checked = unwatchedOnly;
      applyFilters();
    });
    mobileUnwatchedToggle.addEventListener("change", (e) => {
      unwatchedOnly = e.target.checked;
      unwatchedToggle.checked = unwatchedOnly;
      applyFilters();
    });

    // Sort toggle
    sortOrderToggle.addEventListener("click", () => {
      sortAscending = !sortAscending;
      updateSortButton();
      applyFilters();
    });

    // Multi-Select Media Format Handler
    const handleFormatPillClick = (btn) => {
      const type = btn.dataset.type;
      if (selectedTypes.has(type)) {
        selectedTypes.delete(type);
      } else {
        selectedTypes.add(type);
      }

      // Sync active classes across desktop and mobile pills
      document.querySelectorAll(`.media-pill[data-type="${type}"]`).forEach((b) => {
        b.classList.toggle("active", selectedTypes.has(type));
      });

      applyFilters();
    };

    typeButtonsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".media-pill");
      if (btn) handleFormatPillClick(btn);
    });

    mobileTypeButtonsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".media-pill");
      if (btn) handleFormatPillClick(btn);
    });

    if (clearFormatsBtn) {
      clearFormatsBtn.addEventListener("click", () => {
        selectedTypes.clear();
        document.querySelectorAll(".media-pill").forEach((b) => b.classList.remove("active"));
        applyFilters();
      });
    }

    // Watched Checkbox & Card Click
    timelineContainer.addEventListener("click", (e) => {
      const card = e.target.closest(".timeline-card");
      const checkbox = e.target.closest(".watched-checkbox");

      // If user clicked Avengers: Doomsday card (outside checkbox), open the Doomsday modal!
      if (card && !checkbox && card.dataset.title && card.dataset.title.includes("Doomsday")) {
        openDoomsdayModal();
        return;
      }

      if (!checkbox) return;

      const title = checkbox.dataset.title;
      if (checkbox.checked) {
        watchedItems[title] = true;
        if (card) card.classList.add("watched");

        // Confetti burst
        const rect = checkbox.getBoundingClientRect();
        confetti({
          particleCount: 60,
          spread: 50,
          origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          },
          colors: ["#10b981", "#34d399", "#fbbf24"],
        });
      } else {
        delete watchedItems[title];
        if (card) card.classList.remove("watched");
      }

      localStorage.setItem("watchedItems", JSON.stringify(watchedItems));
      updateProgress();

      if (unwatchedOnly) {
        applyFilters();
      }
    });

    // Bulk Actions
    markAllWatchedBtn.addEventListener("click", () => {
      if (confirm("Mark all 179 Marvel Multiverse entries as watched?")) {
        marvelData.forEach((item) => {
          watchedItems[item.title] = true;
        });
        localStorage.setItem("watchedItems", JSON.stringify(watchedItems));
        applyFilters();
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
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
