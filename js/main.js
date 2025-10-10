// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    // --- IMPORTANT ---
    // PASTE YOUR GEMINI API KEY HERE
    
    
    // --- STATE MANAGEMENT ---
    let decadeChart, typeChart;
    let activeTypeFilter = 'all';
    let watchedItems = JSON.parse(localStorage.getItem('watchedItems')) || {};
    let connectionMode = false;
    let selectedForConnection = [];

    // --- SELECTORS ---
    const timelineContainer = document.getElementById('timeline-container');
    const noResults = document.getElementById('no-results');
    const searchInput = document.getElementById('search-input');
    const eraSelect = document.getElementById('era-select');
    const universeSelect = document.getElementById('universe-select');
    const typeButtonsContainer = document.getElementById('type-buttons');
    const resetFiltersButton = document.getElementById('reset-filters');
    const suggestWatchBtn = document.getElementById('suggest-watch-btn');
    const connectionsBtn = document.getElementById('connections-btn');
    
    const modal = document.getElementById('gemini-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalClose = modal.querySelector('.modal-close');
    const modalLoader = document.getElementById('modal-loader');
    const modalLoaderText = document.getElementById('modal-loader-text');
    const modalContent = document.getElementById('modal-content');

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

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
        if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            themeToggleLightIcon.style.display = 'block';
            themeToggleDarkIcon.style.display = 'none';
        } else {
            document.documentElement.classList.remove('dark');
            themeToggleLightIcon.style.display = 'none';
            themeToggleDarkIcon.style.display = 'block';
        }
    }

    function toggleDarkMode() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
        themeToggleLightIcon.style.display = isDark ? 'block' : 'none';
        themeToggleDarkIcon.style.display = isDark ? 'none' : 'block';
        
        if(decadeChart) decadeChart.destroy();
        if(typeChart) typeChart.destroy();
        createCharts();
        applyFilters();
    }
    
    // --- UI & RENDERING ---
    function getUniqueValues(key) {
        const values = marvelData.map(item => item[key]);
        return [...new Set(values)].sort();
    }

    function populateFilters() {
        const eras = getUniqueValues('era');
        eras.forEach(era => {
            const option = document.createElement('option');
            option.value = era;
            option.textContent = era.replace(/([A-Z])/g, ' $1').trim();
            eraSelect.appendChild(option);
        });

        const universes = getUniqueValues('universe');
        universes.forEach(universe => {
            const option = document.createElement('option');
            option.value = universe;
            option.textContent = universe;
            universeSelect.appendChild(option);
        });

        const types = ['all', ...getUniqueValues('type')];
        typeButtonsContainer.innerHTML = types.map(type => `
            <button data-type="${type}" class="type-button px-3 py-1 text-sm rounded-full border transition-colors duration-200 ${type === 'all' ? 'active' : ''}">
                ${type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
        `).join('');
    }

    function renderTimeline(items) {
        timelineContainer.innerHTML = '';
        if (items.length === 0) {
            noResults.style.display = 'block';
            return;
        }
        noResults.style.display = 'none';

        items.sort((a, b) => a.startYear - b.startYear).forEach(item => {
            const isWatched = !!watchedItems[item.title];
            const div = document.createElement('div');
            div.className = `timeline-item relative mb-8 pl-8`;
            div.innerHTML = `
                <div data-title="${item.title}" class="timeline-card p-4 ${isWatched ? 'watched' : ''}">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-xs font-semibold" style="color: var(--accent-primary-${document.documentElement.classList.contains('dark') ? 'dark' : 'light'});">${item.year}</p>
                            <h3 class="font-bold text-lg font-orbitron">${item.title}</h3>
                        </div>
                        <div class="flex-shrink-0 ml-4">
                            <input type="checkbox" data-title="${item.title}" class="watched-checkbox h-5 w-5 rounded-md cursor-pointer" ${isWatched ? 'checked' : ''}>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1" style="color: var(--text-secondary-${document.documentElement.classList.contains('dark') ? 'dark' : 'light'});">
                        <span><strong>Type:</strong> ${item.type}</span>
                        <span><strong>Universe:</strong> ${item.universe}</span>
                    </div>
                    <div class="mt-4">
                        <button data-title="${item.title}" data-type="${item.type}" class="get-synopsis-btn text-sm font-semibold py-1 px-3 rounded-full transition duration-200">
                            ✨ Get Synopsis
                        </button>
                    </div>
                </div>
            `;
            timelineContainer.appendChild(div);
        });
    }

    function updateProgress() {
        const progressBar = document.getElementById('progress-bar');
        const total = marvelData.length;
        const watchedCount = Object.keys(watchedItems).length;
        
        if (total === 0) {
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
            return;
        }

        const percentage = Math.round((watchedCount / total) * 100);
        progressBar.style.width = percentage + '%';
        progressBar.textContent = `${percentage}%`;
    }

    function updateCharts(items) {
        const isDark = document.documentElement.classList.contains('dark');
        const gridColor = isDark ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDark ? '#a0a0b0' : '#4b5563';

        const decadeData = items.reduce((acc, item) => {
            if (item.startYear > 0) {
                const decade = Math.floor(item.startYear / 10) * 10;
                acc[decade] = (acc[decade] || 0) + 1;
            }
            return acc;
        }, {});

        const sortedDecades = Object.keys(decadeData).sort((a,b) => a - b);
        decadeChart.data.labels = sortedDecades.map(d => `${d}s`);
        decadeChart.data.datasets[0].data = sortedDecades.map(d => decadeData[d]);
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

        const filteredData = marvelData.filter(item => 
            item.title.toLowerCase().includes(searchTerm) &&
            (selectedEra === 'all' || item.era === selectedEra) &&
            (selectedUniverse === 'all' || item.universe === selectedUniverse) &&
            (activeTypeFilter === 'all' || item.type === activeTypeFilter)
        );

        renderTimeline(filteredData);
        updateCharts(marvelData);
        updateProgress();
    }
    
    function createCharts() {
        const isDark = document.documentElement.classList.contains('dark');
        const gridColor = isDark ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDark ? '#a0a0b0' : '#4b5563';
        const accent = isDark ? '#00ffff' : '#4f46e5';

        const decadeCtx = document.getElementById('releasesByDecadeChart').getContext('2d');
        decadeChart = new Chart(decadeCtx, {
            type: 'bar',
            data: { labels: [], datasets: [{ label: '# of Releases', data: [], backgroundColor: accent, borderWidth: 0 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } }, x: { grid: { color: gridColor }, ticks: { color: textColor } } },
                plugins: { legend: { labels: { color: textColor } } }
            }
        });

        const typeCtx = document.getElementById('mediaTypeChart').getContext('2d');
        typeChart = new Chart(typeCtx, {
            type: 'doughnut',
            data: { labels: [], datasets: [{ label: 'Media Types', data: [], backgroundColor: ['#00ffff', '#ff00ff', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'], hoverOffset: 4, borderColor: isDark ? '#10182c' : '#f4f4f5', borderWidth: 4 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: textColor, boxWidth: 15 } } }
            }
        });
    }

    function resetAll() {
        searchInput.value = '';
        eraSelect.value = 'all';
        universeSelect.value = 'all';
        activeTypeFilter = 'all';
        document.querySelectorAll('.type-button').forEach(btn => btn.classList.toggle('active', btn.dataset.type === 'all'));
        applyFilters();
    }

    // --- GEMINI API & MODAL FUNCTIONS ---
    function showLoadingModal(title, loaderText) {
        modal.style.display = 'flex';
        modalLoader.style.display = 'block';
        modalContent.style.display = 'none';
        modalTitle.textContent = title;
        modalLoaderText.textContent = loaderText;
    }

    function showModalContent(content) {
        modalLoader.style.display = 'none';
        modalContent.style.display = 'block';
        modalContent.textContent = content;
    }

    async function fetchWithBackoff(url, options, retries = 3, delay = 1000) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchWithBackoff(url, options, retries - 1, delay * 2);
            }
            throw error;
        }
    }
    
    async function callGemini(prompt) {
        // This URL points to your new proxy function.
        // Netlify automatically makes it available at this path.
        const proxyUrl = `/.netlify/functions/proxy-gemini`;
        
        try {
            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt }) // Send the prompt in the body
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Proxy error: ${errorText}`);
            }
            
            const result = await response.json();
            return result.candidates[0].content.parts[0].text;

        } catch (error) {
            console.error("API call through proxy failed:", error);
            return "Intel could not be retrieved at this time. Please try again later.";
        }
    }

    async function fetchSynopsis(title, type) {
        showLoadingModal(`Synopsis for ${title}`, 'GENERATING INTEL...');
        const prompt = `Provide a concise, spoiler-free synopsis for the ${type} titled "${title}". Focus on the main plot setup and characters.`;
        const synopsis = await callGemini(prompt);
        showModalContent(synopsis);
    }

    async function suggestNextWatch() {
        const watchedTitles = Object.keys(watchedItems);
        if (watchedTitles.length === 0) {
            alert("You haven't watched anything yet! Mark some items as watched to get a suggestion.");
            return;
        }
        const unwatchedTitles = marvelData.filter(item => !watchedItems[item.title]).map(item => item.title);

        showLoadingModal('Suggestion', 'ANALYZING YOUR WATCH HISTORY...');
        const prompt = `Based on this list of watched Marvel properties: ${watchedTitles.join(', ')}. \n\nAnd this list of unwatched properties: ${unwatchedTitles.join(', ')}. \n\nWhat is the single best property to watch next and why? Provide a single title and a one-paragraph explanation.`;
        const suggestion = await callGemini(prompt);
        showModalContent(suggestion);
    }

    async function findConnections() {
        const [item1, item2] = selectedForConnection;
        showLoadingModal(`Connecting ${item1} & ${item2}`, 'ANALYZING TIMELINE CONNECTIONS...');
        const prompt = `Briefly explain the main story, character, or thematic connections between the Marvel properties "${item1}" and "${item2}".`;
        const connections = await callGemini(prompt);
        showModalContent(connections);
        
        toggleConnectionMode(); 
    }

    // --- EVENT LISTENERS & HANDLERS ---
    function toggleConnectionMode() {
        connectionMode = !connectionMode;
        document.body.classList.toggle('connection-mode', connectionMode);
        connectionsBtn.classList.toggle('active', connectionMode);
        
        selectedForConnection = [];
        document.querySelectorAll('.timeline-card.selected').forEach(card => card.classList.remove('selected'));

        if (connectionMode) {
            alert("Connection Mode Activated: Select two items from the timeline to find the connections between them.");
        }
    }

    function handleTimelineClick(e) {
        const card = e.target.closest('.timeline-card');
        if (!card) return;

        if (connectionMode) {
            const title = card.dataset.title;
            const index = selectedForConnection.indexOf(title);

            if (index > -1) {
                selectedForConnection.splice(index, 1);
                card.classList.remove('selected');
            } else {
                selectedForConnection.push(title);
                card.classList.add('selected');
            }

            if (selectedForConnection.length === 2) {
                findConnections();
            }
        } else {
            const synopsisButton = e.target.closest('.get-synopsis-btn');
            if (synopsisButton) {
                fetchSynopsis(synopsisButton.dataset.title, synopsisButton.dataset.type);
                return;
            }

            const checkbox = e.target.closest('.watched-checkbox');
            if (checkbox) {
                const title = checkbox.dataset.title;
                if (checkbox.checked) {
                    watchedItems[title] = true;
                    card.classList.add('watched');
                    const rect = checkbox.getBoundingClientRect();
                    confetti({ particleCount: 100, spread: 70, origin: { x: (rect.left + rect.right) / 2 / window.innerWidth, y: (rect.top + rect.bottom) / 2 / window.innerHeight } });
                } else {
                    delete watchedItems[title];
                    card.classList.remove('watched');
                }
                localStorage.setItem('watchedItems', JSON.stringify(watchedItems));
                updateProgress();
            }
        }
    }

    function setupEventListeners() {
        darkModeToggle.addEventListener('click', toggleDarkMode);
        searchInput.addEventListener('input', applyFilters);
        eraSelect.addEventListener('change', applyFilters);
        universeSelect.addEventListener('change', applyFilters);
        resetFiltersButton.addEventListener('click', resetAll);
        suggestWatchBtn.addEventListener('click', suggestNextWatch);
        connectionsBtn.addEventListener('click', toggleConnectionMode);
        
        modalClose.addEventListener('click', () => modal.style.display = 'none');
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

        typeButtonsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('type-button')) {
                activeTypeFilter = e.target.dataset.type;
                document.querySelectorAll('.type-button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                applyFilters();
            }
        });

        timelineContainer.addEventListener('click', handleTimelineClick);
    }

    init();
});
