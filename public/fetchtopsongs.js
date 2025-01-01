import { fetchPlaylistSongs } from './api.js';

const playlistUrls = [
    'https://www.jiosaavn.com/featured/hindi-hit-songs/ZodsPn39CSjwxP8tCU-flw__',
    'https://www.jiosaavn.com/featured/best-of-romance-hindi/SBKnUgjNeMIwkg5tVhI3fw__',
    'https://www.jiosaavn.com/featured/best-of-indipop-hindi/xHa-oM3ldXAwkg5tVhI3fw__',
    'https://www.jiosaavn.com/featured/english:_india_superhits_top_50/aXoCADwITrUCObrEMJSxEw__',
    'https://www.jiosaavn.com/featured/jhakaas-remakes/7e2LtwVBX6JFo9wdEAzFBA__'
];

let playlists = [];

const cache = {
    playlists: new Map(),
    songs: new Map()
};

const loader = document.querySelector('.loader');
const app = document.getElementById('app');

function showLoader() {
    loader.classList.add('loading');
    app.classList.add('loading');
}

function hideLoader() {
    loader.classList.remove('loading');
    app.classList.remove('loading');
}

async function fetchPlaylistDetails(url) {
    if (cache.playlists.has(url)) {
        return cache.playlists.get(url);
    }

    showLoader();
    try {
        const response = await fetch(`https://jio-saavn-api-rho.vercel.app/playlist/?query=${url}`);
        const data = await response.json();

        const playlist = {
            name: data.listname,
            image: data.image,
            url: data.perma_url,
            id: data.listid
        };

        cache.playlists.set(url, playlist);
        return playlist;
    } finally {
        hideLoader();
    }
}

async function fetchCachedSongs(playlistUrl) {
    if (cache.songs.has(playlistUrl)) {
        return cache.songs.get(playlistUrl);
    }

    showLoader();
    try {
        const songs = await fetchPlaylistSongs(playlistUrl);
        cache.songs.set(playlistUrl, songs);
        return songs;
    } finally {
        hideLoader();
    }
}

function displayPlaylists(playlists) {
    const playlistContainer = document.getElementById('playlist-container');
    const songContainer = document.getElementById('song-container');
    
    songContainer.innerHTML = '';
    
    playlistContainer.innerHTML = playlists.map(playlist => `
        <div class="playlist-card" data-id="${playlist.id}" data-url="${playlist.url}">
            <img src="${playlist.image}" alt="${playlist.name}">
            <div class="playlist-info">
                <h4>${playlist.name}</h4>
                <button class="add-all-songs-btn">Play All Songs</button>
            </div>
        </div>
    `).join('');

    const playlistCards = document.querySelectorAll('.playlist-card');
    playlistCards.forEach(card => {
        card.addEventListener('click', async (e) => {
            if (e.target.classList.contains('add-all-songs-btn')) return;

            const playlistUrl = card.dataset.url;

            try {
                const songs = await fetchCachedSongs(playlistUrl);
                displaySongs(songs, playlistUrl);
            } catch (error) {
                console.error('Error fetching songs:', error);
            }
        });

        const addAllBtn = card.querySelector('.add-all-songs-btn');
        addAllBtn.addEventListener('click', async (e) => {
            e.stopPropagation();

            const playlistUrl = card.dataset.url;

            try {
                const songs = await fetchCachedSongs(playlistUrl);
                const event = new CustomEvent('addPlaylistSongs', { detail: songs });
                document.dispatchEvent(event);
            } catch (error) {
                console.error('Error fetching songs:', error);
            }
        });
    });
}

function displaySongs(songs, playlistUrl) {
    const playlistContainer = document.getElementById('playlist-container');
    const songContainer = document.getElementById('song-container');
    playlistContainer.innerHTML = '';
    songContainer.innerHTML = '';

    const currentPlaylist = playlists.find(playlist => playlist.url === playlistUrl);

    if (currentPlaylist) {
        const playlistInfo = document.createElement('div');
        playlistInfo.classList.add('playlist-info');
        playlistInfo.innerHTML = `
            <button id="back-btn">Back to Playlists</button>
            <h2>${currentPlaylist.name}</h2>
            <img src="${currentPlaylist.image}" alt="${currentPlaylist.name}">
            <button class="add-all-songs-btn">Play All Songs</button>
        `;
        playlistContainer.appendChild(playlistInfo);

        const addAllBtn = playlistInfo.querySelector('.add-all-songs-btn');
        addAllBtn.addEventListener('click', () => {
            const event = new CustomEvent('addPlaylistSongs', { detail: songs });
            document.dispatchEvent(event);
        });
    }

    songContainer.innerHTML = songs.map(song => `
        <div class="song-card">
            <img src="${song.image}" alt="${song.name}">
            <div class="song-info">
                <h4>${song.name}</h4>
                <p>${song.artist}</p>
                <button class="song-play-btn" data-url="${song.downloadUrl}" data-name="${song.name}" data-artist="${song.artist}" data-image="${song.image}">Play</button>
            </div>
        </div>
    `).join('');

    const backBtn = document.getElementById('back-btn');
    backBtn.addEventListener('click', () => {
        displayPlaylists(playlists);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        showLoader();
        const playlistDetailsPromises = playlistUrls.map(url => fetchPlaylistDetails(url));
        playlists = await Promise.all(playlistDetailsPromises);
        displayPlaylists(playlists);
    } catch (error) {
        console.error('Error fetching playlists:', error);
    } finally {
        hideLoader();
    }
});