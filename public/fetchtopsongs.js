import { fetchPlaylistSongs } from './api.js';

// List of playlist URLs
const playlistUrls = [
    'https://www.jiosaavn.com/featured/hindi-hit-songs/ZodsPn39CSjwxP8tCU-flw__',
    'https://www.jiosaavn.com/featured/best-of-romance-hindi/SBKnUgjNeMIwkg5tVhI3fw__',
    'https://www.jiosaavn.com/featured/best-of-indipop-hindi/xHa-oM3ldXAwkg5tVhI3fw__',
    'https://www.jiosaavn.com/featured/english:_india_superhits_top_50/aXoCADwITrUCObrEMJSxEw__',
    'https://www.jiosaavn.com/featured/jhakaas-remakes/7e2LtwVBX6JFo9wdEAzFBA__'
];

// Store the playlists in memory
let playlists = [];

// Function to toggle loader
function toggleLoader(show) {
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.classList.toggle('loading', show);
    }
}

// Fetch the playlist details
async function fetchPlaylistDetails(url) {
    const response = await fetch(`https://jio-saavn-api-rho.vercel.app/playlist/?query=${url}`);
    const data = await response.json();

    return {
        name: data.listname,
        image: data.image,
        url: data.perma_url,
        id: data.listid
    };
}

// Display the list of playlists
function displayPlaylists(playlists) {
    const playlistContainer = document.getElementById('playlist-container');
    const songContainer = document.getElementById('song-container');
    
    // Clear the song container when showing playlists
    songContainer.innerHTML = '';
    
    playlistContainer.innerHTML = playlists.map(playlist => `
        <div class="playlist-card" data-id="${playlist.id}" data-url="${playlist.url}">
            <img src="${playlist.image}" alt="${playlist.name}">
            <div class="playlist-info">
                <h4>${playlist.name}</h4>
                <button class="add-all-songs-btn">Add All Songs</button>
            </div>
        </div>
    `).join('');

    // Add event listeners for both playlist card clicks and "Add All Songs" buttons
    const playlistCards = document.querySelectorAll('.playlist-card');
    playlistCards.forEach(card => {
        // Event listener for viewing playlist songs
        card.addEventListener('click', async (e) => {
            // Ignore if clicking the "Add All Songs" button
            if (e.target.classList.contains('add-all-songs-btn')) {
                return;
            }
            
            const playlistUrl = card.dataset.url;
            toggleLoader(true);

            try {
                const songs = await fetchPlaylistSongs(playlistUrl);
                displaySongs(songs, playlistUrl);
            } catch (error) {
                console.error('Error fetching songs:', error);
            } finally {
                toggleLoader(false);
            }
        });

        // Separate event listener for "Add All Songs" button
        const addAllBtn = card.querySelector('.add-all-songs-btn');
        addAllBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent playlist card click
            const playlistUrl = card.dataset.url;
            toggleLoader(true);

            try {
                const songs = await fetchPlaylistSongs(playlistUrl);
                // Dispatch event to add all songs to player
                const event = new CustomEvent('addPlaylistSongs', {
                    detail: songs
                });
                document.dispatchEvent(event);
            } catch (error) {
                console.error('Error fetching songs:', error);
            } finally {
                toggleLoader(false);
            }
        });
    });
}

// Display songs for the selected playlist
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
            <button class="add-all-songs-btn">Add All Songs</button>
        `;
        playlistContainer.appendChild(playlistInfo);

        // Add event listener for "Add All Songs" button in playlist view
        const addAllBtn = playlistInfo.querySelector('.add-all-songs-btn');
        addAllBtn.addEventListener('click', () => {
            const event = new CustomEvent('addPlaylistSongs', {
                detail: songs
            });
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

    // Add event listener for back button
    const backBtn = document.getElementById('back-btn');
    backBtn.addEventListener('click', () => {
        displayPlaylists(playlists);
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    try {
        toggleLoader(true);
        const playlistDetailsPromises = playlistUrls.map(url => fetchPlaylistDetails(url));
        playlists = await Promise.all(playlistDetailsPromises);
        toggleLoader(false);
        displayPlaylists(playlists);
    } catch (error) {
        console.error('Error fetching playlists:', error);
        toggleLoader(false);
    }
});