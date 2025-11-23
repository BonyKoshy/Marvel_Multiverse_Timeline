// js/main.js
<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", () => {
  // --- STATE MANAGEMENT ---
  let decadeChart, typeChart;
  let activeTypeFilter = "all";
  let watchedItems = JSON.parse(localStorage.getItem("watchedItems")) || {};
=======
document.addEventListener('DOMContentLoaded', () => {
    // --- IMPORTANT ---
    // PASTE YOUR GEMINI API KEY HERE
    
    
    // --- STATE MANAGEMENT ---
    let decadeChart, typeChart;
    let activeTypeFilter = 'all';
    let watchedItems = JSON.parse(localStorage.getItem('watchedItems')) || {};
    let connectionMode = false;
    let selectedForConnection = [];
>>>>>>> b7b55a1661ec835e2a19c43eb7eaa0125091fa95

  // --- SELECTORS ---
  const timelineContainer = document.getElementById("timeline-container");
  const noResults = document.getElementById("no-results");
  const searchInput = document.getElementById("search-input");
  const eraSelect = document.getElementById("era-select");
  const universeSelect = document.getElementById("universe-select");
  const typeButtonsContainer = document.getElementById("type-buttons");
  const resetFiltersButton = document.getElementById("reset-filters");

  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const themeToggleDarkIcon = document.getElementById("theme-toggle-dark-icon");
  const themeToggleLightIcon = document.getElementById(
    "theme-toggle-light-icon"
  );

  // --- INITIALIZATION ---
  function init() {
    setupEventListeners();
    initDarkMode();
    populateFilters();
    createCharts();
    applyFilters();
  }

  // --- DARK MODE ---
  function initDarkMode() {
    if (
      localStorage.getItem("color-theme") === "dark" ||
      (!("color-theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      themeToggleLightIcon.style.display = "block";
      themeToggleDarkIcon.style.display = "none";
    } else {
      document.documentElement.classList.remove("dark");
      themeToggleLightIcon.style.display = "none";
      themeToggleDarkIcon.style.display = "block";
    }
  }

  function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("color-theme", isDark ? "dark" : "light");
    themeToggleLightIcon.style.display = isDark ? "block" : "none";
    themeToggleDarkIcon.style.display = isDark ? "none" : "block";

    if (decadeChart) decadeChart.destroy();
    if (typeChart) typeChart.destroy();
    createCharts();
    applyFilters();
  }

  // --- UI & RENDERING ---
  function getUniqueValues(key) {
    const values = marvelData.map((item) => item[key]);
    return [...new Set(values)].sort();
  }

  function populateFilters() {
    const eras = getUniqueValues("era");
    eras.forEach((era) => {
      const option = document.createElement("option");
      option.value = era;
      option.textContent = era.replace(/([A-Z])/g, " $1").trim();
      eraSelect.appendChild(option);
    });

    const universes = getUniqueValues("universe");
    universes.forEach((universe) => {
      const option = document.createElement("option");
      option.value = universe;
      option.textContent = universe;
      universeSelect.appendChild(option);
    });

    const types = ["all", ...getUniqueValues("type")];
    typeButtonsContainer.innerHTML = types
      .map(
        (type) => `
            <button data-type="${type}" class="type-button px-3 py-1 text-sm rounded-full border transition-colors duration-200 ${
          type === "all" ? "active" : ""
        }">
                ${type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
        `
      )
      .join("");
  }

  function renderTimeline(items) {
    timelineContainer.innerHTML = "";
    if (items.length === 0) {
      noResults.style.display = "block";
      return;
    }
    noResults.style.display = "none";

    items
      .sort((a, b) => a.startYear - b.startYear)
      .forEach((item) => {
        const isWatched = !!watchedItems[item.title];
        const div = document.createElement("div");
        div.className = `timeline-item relative mb-8 pl-8`;
        div.innerHTML = `
                <div data-title="${item.title}" class="timeline-card p-4 ${
          isWatched ? "watched" : ""
        }">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-xs font-semibold" style="color: var(--accent-primary-${
                              document.documentElement.classList.contains(
                                "dark"
                              )
                                ? "dark"
                                : "light"
                            });">${item.year}</p>
                            <h3 class="font-bold text-lg font-orbitron">${
                              item.title
                            }</h3>
                        </div>
                        <div class="flex-shrink-0 ml-4">
                            <input type="checkbox" data-title="${
                              item.title
                            }" class="watched-checkbox h-5 w-5 rounded-md cursor-pointer" ${
          isWatched ? "checked" : ""
        }>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1" style="color: var(--text-secondary-${
                      document.documentElement.classList.contains("dark")
                        ? "dark"
                        : "light"
                    });">
                        <span><strong>Type:</strong> ${item.type}</span>
                        <span><strong>Universe:</strong> ${item.universe}</span>
                    </div>
                </div>
            `;
        timelineContainer.appendChild(div);
      });
  }

  function updateProgress() {
    const progressBar = document.getElementById("progress-bar");
    const total = marvelData.length;
    const watchedCount = Object.keys(watchedItems).length;

    if (total === 0) {
      progressBar.style.width = "0%";
      progressBar.textContent = "0%";
      return;
    }

    const percentage = Math.round((watchedCount / total) * 100);
    progressBar.style.width = percentage + "%";
    progressBar.textContent = `${percentage}%`;
  }

  function updateCharts(items) {
    const isDark = document.documentElement.classList.contains("dark");
    const gridColor = isDark ? "rgba(0, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
    const textColor = isDark ? "#a0a0b0" : "#4b5563";

    const decadeData = items.reduce((acc, item) => {
      if (item.startYear > 0) {
        const decade = Math.floor(item.startYear / 10) * 10;
        acc[decade] = (acc[decade] || 0) + 1;
      }
      return acc;
    }, {});

    const sortedDecades = Object.keys(decadeData).sort((a, b) => a - b);
    decadeChart.data.labels = sortedDecades.map((d) => `${d}s`);
    decadeChart.data.datasets[0].data = sortedDecades.map((d) => decadeData[d]);
    decadeChart.options.scales.y.grid.color = gridColor;
    decadeChart.options.scales.x.grid.color = gridColor;
    decadeChart.options.scales.y.ticks.color = textColor;
    decadeChart.options.scales.x.ticks.color = textColor;
    decadeChart.options.plugins.legend.labels.color = textColor;
    decadeChart.update();

    const typeData = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});

    typeChart.data.labels = Object.keys(typeData);
    typeChart.data.datasets[0].data = Object.values(typeData);
    typeChart.options.plugins.legend.labels.color = textColor;
    typeChart.update();
  }

  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedEra = eraSelect.value;
    const selectedUniverse = universeSelect.value;

    const filteredData = marvelData.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm) &&
        (selectedEra === "all" || item.era === selectedEra) &&
        (selectedUniverse === "all" || item.universe === selectedUniverse) &&
        (activeTypeFilter === "all" || item.type === activeTypeFilter)
    );

    renderTimeline(filteredData);
    updateCharts(marvelData);
    updateProgress();
  }

  function createCharts() {
    const isDark = document.documentElement.classList.contains("dark");
    const gridColor = isDark ? "rgba(0, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
    const textColor = isDark ? "#a0a0b0" : "#4b5563";
    const accent = isDark ? "#00ffff" : "#4f46e5";

    const decadeCtx = document
      .getElementById("releasesByDecadeChart")
      .getContext("2d");
    decadeChart = new Chart(decadeCtx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "# of Releases",
            data: [],
            backgroundColor: accent,
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
            ticks: { color: textColor },
          },
          x: { grid: { color: gridColor }, ticks: { color: textColor } },
        },
        plugins: { legend: { labels: { color: textColor } } },
      },
    });

    const typeCtx = document.getElementById("mediaTypeChart").getContext("2d");
    typeChart = new Chart(typeCtx, {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [
          {
            label: "Media Types",
            data: [],
            backgroundColor: [
              "#00ffff",
              "#ff00ff",
              "#f59e0b",
              "#10b981",
              "#3b82f6",
              "#ec4899",
              "#8b5cf6",
            ],
            hoverOffset: 4,
            borderColor: isDark ? "#10182c" : "#f4f4f5",
            borderWidth: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: textColor, boxWidth: 15 },
          },
        },
      },
    });
  }

  function resetAll() {
    searchInput.value = "";
    eraSelect.value = "all";
    universeSelect.value = "all";
    activeTypeFilter = "all";
    document
      .querySelectorAll(".type-button")
      .forEach((btn) =>
        btn.classList.toggle("active", btn.dataset.type === "all")
      );
    applyFilters();
  }

  // --- EVENT LISTENERS & HANDLERS ---
  function handleTimelineClick(e) {
    const card = e.target.closest(".timeline-card");
    if (!card) return;

    const checkbox = e.target.closest(".watched-checkbox");
    if (checkbox) {
      const title = checkbox.dataset.title;
      if (checkbox.checked) {
        watchedItems[title] = true;
        card.classList.add("watched");
        const rect = checkbox.getBoundingClientRect();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: {
            x: (rect.left + rect.right) / 2 / window.innerWidth,
            y: (rect.top + rect.bottom) / 2 / window.innerHeight,
          },
        });
      } else {
        delete watchedItems[title];
        card.classList.remove("watched");
      }
      localStorage.setItem("watchedItems", JSON.stringify(watchedItems));
      updateProgress();
    }
  }

  function setupEventListeners() {
    darkModeToggle.addEventListener("click", toggleDarkMode);
    searchInput.addEventListener("input", applyFilters);
    eraSelect.addEventListener("change", applyFilters);
    universeSelect.addEventListener("change", applyFilters);
    resetFiltersButton.addEventListener("click", resetAll);

    typeButtonsContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("type-button")) {
        activeTypeFilter = e.target.dataset.type;
        document
          .querySelectorAll(".type-button")
          .forEach((btn) => btn.classList.remove("active"));
        e.target.classList.add("active");
        applyFilters();
      }
    });

    timelineContainer.addEventListener("click", handleTimelineClick);
  }

  init();
});
