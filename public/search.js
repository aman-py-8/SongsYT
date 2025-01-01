import { fetchSongs } from './api.js';

export default class SearchComponent extends HTMLElement {
    constructor() {
        super();
        this.cache = new Map();
    }

    async connectedCallback() {
        // Create loader HTML directly instead of fetching
        const loaderHtml = `
            <style>
                .loader {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #6200ea;
                    border-radius: 50%;
                    width: clamp(20px, 8vw, 40px);
                    height: clamp(20px, 8vw, 40px);
                    animation: spin 1s linear infinite;
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    display: none;
                    z-index: 1001;
                }

                @keyframes spin {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(360deg); }
                }

                .loading {
                    display: block;
                }

                @media (max-width: 768px) {
                    .loader {
                        width: clamp(20px, 6vw, 35px);
                        height: clamp(20px, 6vw, 35px);
                    }
                }

                @media (max-width: 480px) {
                    .loader {
                        width: clamp(20px, 5vw, 30px);
                        height: clamp(20px, 5vw, 30px);
                    }
                }
            </style>
            <div class="loader"></div>
        `;

        this.innerHTML = `
            <div class="search-bar">
                <div class="search-input-container">
                    <input type="text" id="search-input" placeholder="Search songs...">
                    <button class="clear-btn" id="clear-btn">
                        <img src="static/icons/clear.png" alt="Clear search">
                    </button>
                </div>
                <button id="search-btn" class="search-btn">Search</button>
                <ul id="suggestions-list" class="suggestions"></ul>
            </div>
            <div id="search-results" class="search-results"></div>
            ${loaderHtml}
        `;

        const searchInput = this.querySelector('#search-input');
        const searchButton = this.querySelector('#search-btn');
        const suggestionsList = this.querySelector('#suggestions-list');
        const clearButton = this.querySelector('#clear-btn');
        const resultsDiv = this.querySelector('#search-results');
        const loader = this.querySelector('.loader');

        // Make toggleLoader a class method so it's accessible everywhere
        this.toggleLoader = (show) => {
            if (show) {
                loader.classList.add('loading');
            } else {
                loader.classList.remove('loading');
            }
        };

        // Fetch suggestions on input
        searchInput.addEventListener('keyup', async (event) => {
            const query = searchInput.value.trim();

            if (query.length < 1) {
                suggestionsList.style.display = 'none';
                resultsDiv.innerHTML = '';
                return;
            }

            this.toggleLoader(true);
            const suggestions = await this.getCachedSuggestions(query);
            this.toggleLoader(false);

            this.displaySuggestions(suggestions, searchInput, suggestionsList);

            if (event.key === 'Enter') {
                searchButton.click();
            }
        });

        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            suggestionsList.style.display = 'none';
            resultsDiv.innerHTML = '';
        });

        searchButton.addEventListener('click', async () => {
            const query = searchInput.value.trim();

            if (query.length < 1) {
                resultsDiv.innerHTML = '';
                return;
            }

            suggestionsList.style.display = 'none';
            this.toggleLoader(true);
            const results = await this.getCachedResults(query);
            this.toggleLoader(false);

            this.displayResults(results, resultsDiv);
        });

        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                suggestionsList.style.display = 'none';
            }
        });
    }

    // Rest of the methods remain the same
    async getCachedSuggestions(query) {
        if (this.cache.has(`suggestions-${query}`)) {
            return this.cache.get(`suggestions-${query}`);
        }

        const suggestions = await this.fetchSuggestions(query);
        this.cache.set(`suggestions-${query}`, suggestions);
        return suggestions;
    }

    async getCachedResults(query) {
        if (this.cache.has(`results-${query}`)) {
            return this.cache.get(`results-${query}`);
        }

        const results = await fetchSongs(query);
        this.cache.set(`results-${query}`, results);
        return results;
    }

    async fetchSuggestions(query) {
        if (query.length < 1 || query.length > 64) return [];

        try {
            const response = await fetch(`https://jio-saavn-api-rho.vercel.app/get-suggestions?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            return data.suggestions.map(suggestion => suggestion[0]);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            return [];
        }
    }

    displaySuggestions(suggestions, searchInput, suggestionsList) {
        suggestionsList.innerHTML = '';

        if (suggestions.length === 0) {
            suggestionsList.style.display = 'none';
            return;
        }

        suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.textContent = suggestion;
            li.addEventListener('click', async () => {
                searchInput.value = suggestion;
                this.toggleLoader(true); // Using class method
                const results = await this.getCachedResults(suggestion);
                this.toggleLoader(false); // Using class method
                this.displayResults(results, this.querySelector('#search-results'));
                suggestionsList.style.display = 'none';
            });
            suggestionsList.appendChild(li);
        });

        suggestionsList.style.display = 'block';
    }

    displayResults(results, resultsDiv) {
        resultsDiv.innerHTML = results.map(song => {
            if (!song.downloadUrl) {
                return `<div>
                    <p>${song.name}</p>
                    <p>${song.artist}</p>
                    <p><em>Audio not available</em></p>
                </div>`;
            }
            return `<div>
                <img src="${song.image}" alt="${song.name}" />
                <p>${song.name}</p>
                <p>${song.artist}</p>
                <button data-url="${song.downloadUrl}" data-name="${song.name}" data-artist="${song.artist}" data-image="${song.image}">Play</button>
            </div>`;
        }).join('');
    }
}

customElements.define('search-component', SearchComponent);