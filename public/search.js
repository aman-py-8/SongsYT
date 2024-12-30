import { fetchSongs } from './api.js';

export default class SearchComponent extends HTMLElement {
    async connectedCallback() {
        // Load the loader component
        const loaderResponse = await fetch('loader.html');
        const loaderHtml = await loaderResponse.text();
        
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

        const toggleLoader = (show) => {
            loader.classList.toggle('loading', show);
        };

        // Fetch suggestions on input
        searchInput.addEventListener('keyup', async (event) => {
            const query = searchInput.value.trim();

            if (query.length < 1) {
                suggestionsList.style.display = 'none';
                resultsDiv.innerHTML = '';
                return;
            }

            toggleLoader(true);
            const suggestions = await this.fetchSuggestions(query);
            toggleLoader(false);

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
            toggleLoader(true);
            const results = await fetchSongs(query);
            toggleLoader(false);

            this.displayResults(results, resultsDiv);
        });

        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                suggestionsList.style.display = 'none';
            }
        });
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
                const results = await fetchSongs(suggestion);
                this.displayResults(results, document.querySelector('#search-results'));
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