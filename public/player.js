export default class PlayerComponent extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="player">
                <button class="exit-fullscreen-btn hidden">Exit Fullscreen</button>
                <div class="player-info">
                    <img id="album-art" src="placeholder.png" alt="Album Art">
                    <div>
                        <h3 id="song-title">Now Playing</h3>
                        <p id="song-artist">Artist</p>
                    </div>
                </div>
                <div class="controls">
                    <button id="repeat-btn"><i class="fa-solid fa-repeat"></i></button>
                    <button id="prev-btn"><i class="fa-solid fa-backward"></i></button>
                    <button id="play-pause-btn"><i class="fa-solid fa-play"></i></button>
                    <button id="next-btn"><i class="fa-solid fa-forward"></i></button>
                    <button id="playlist-btn"><i class="fa-solid fa-music"></i></button>
                </div>
                <div class="progress-container">
                <span id="current-time">00:00</span>
                    <input type="range" id="progress-bar" min="0" max="100" value="0">
                      <span id="total-time">00:00</span>
                </div>
                <div class="volume-container">
                    <label id="volume-icon"><i class="fa-solid fa-volume-high"></i></label>
                    <input type="range" id="volume-control" min="0" max="1" step="0.01" value="0.5">
                </div>
                <audio id="audio-player"></audio>
            </div>
            <div id="playlist-modal" class="modal hidden">
                <div class="modal-content">
                    <h3>Playlist</h3>
                    <ul id="playlist-list"></ul>
                    <button id="close-modal-btn">Close</button>
                </div>
            </div>
        `;

        const audioPlayer = this.querySelector('#audio-player');
        const playPauseBtn = this.querySelector('#play-pause-btn');
        const prevBtn = this.querySelector('#prev-btn');
        const nextBtn = this.querySelector('#next-btn');
        const repeatBtn = this.querySelector('#repeat-btn');
        const playlistBtn = this.querySelector('#playlist-btn');
        const playlistModal = this.querySelector('#playlist-modal');
        const closeModalBtn = this.querySelector('#close-modal-btn');
        const playlistList = this.querySelector('#playlist-list');
        const progressBar = this.querySelector('#progress-bar');
        const currentTimeEl = this.querySelector('#current-time');
        const totalTimeEl = this.querySelector('#total-time');
        const volumeControl = this.querySelector('#volume-control');
        const volumeIcon = this.querySelector('#volume-icon i');
        const songTitleEl = this.querySelector('#song-title');
        const songArtistEl = this.querySelector('#song-artist');
        const albumArtEl = this.querySelector('#album-art');
        const playerEl = this.querySelector('.player');
        const exitFullscreenBtn = this.querySelector('.exit-fullscreen-btn');
        

        let currentSongIndex = -1;
        let playlist = [];
        let isRepeatEnabled = false;
        let isMuted = false;
        
        document.addEventListener('addPlaylistSongs', (event) => {
            const songs = event.detail;
            let firstSongIndex = playlist.length;  // Remember where new songs start
            
            // Add all songs to the playlist
            songs.forEach(song => {
                // Check if song already exists in playlist
                const exists = playlist.some(existingSong => 
                    existingSong.downloadUrl === song.downloadUrl
                );
                
                if (!exists) {
                    playlist.push({
                        name: song.name,
                        downloadUrl: song.downloadUrl,
                        artist: song.artist,
                        image: song.image
                    });
                }
            });

            // If playlist was empty, start playing the first song
            if (currentSongIndex === -1 && playlist.length > 0) {
                currentSongIndex = firstSongIndex;
                loadSong(playlist[currentSongIndex]);
            }

            // Update the playlist display
            renderPlaylist();
        });

            // Update background with album art
            const updateBackground = (imageUrl) => {
                if (playerEl) {
                    // Set CSS variable for the background image
                    playerEl.style.setProperty('--background-image', `url(${imageUrl})`);
                    playerEl.style.backgroundImage = `url(${imageUrl})`;
                }
            };

        // Load and play a song
        // Add this to your loadSong function
        const loadSong = (song) => {
            songTitleEl.textContent = song.name;
            songArtistEl.textContent = song.artist || 'Unknown Artist';          
            albumArtEl.src = song.image || 'placeholder.png';
            audioPlayer.src = song.downloadUrl;
            updateBackground(song.image || 'placeholder.png');
            audioPlayer.play();
            playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        };

        // Play/Pause functionality
        playPauseBtn.addEventListener('click', () => {
            if (audioPlayer.paused) {
                audioPlayer.play();
                playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            } else {
                audioPlayer.pause();
                playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            }
        });

        // Next song
        nextBtn.addEventListener('click', () => {
            currentSongIndex = (currentSongIndex + 1) % playlist.length;
            loadSong(playlist[currentSongIndex]);
        });

        // Previous song
        prevBtn.addEventListener('click', () => {
            currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
            loadSong(playlist[currentSongIndex]);
        });

        // Repeat button functionality
        repeatBtn.addEventListener('click', () => {
            isRepeatEnabled = !isRepeatEnabled;
            const repeatIcon = repeatBtn.querySelector('i');
            if (isRepeatEnabled) {
                repeatIcon.classList.remove('fa-repeat');
                repeatIcon.classList.add('fa-arrows-rotate');
                repeatBtn.style.color = 'green'; // Change color to green
            } else {
                repeatIcon.classList.remove('fa-arrows-rotate');
                repeatIcon.classList.add('fa-repeat');
                repeatBtn.style.color = 'white'; // Reset color to white
            }
        });

        // Handle repeat functionality
        audioPlayer.addEventListener('ended', () => {
            if (isRepeatEnabled) {
                audioPlayer.currentTime = 0;
                audioPlayer.play();
            } else {
                nextBtn.click();
            }
        });

        // Update progress bar and time
        audioPlayer.addEventListener('timeupdate', () => {
            if (audioPlayer.duration) {
                const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressBar.style.setProperty('--progress', `${progressPercent}%`);
                progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
                totalTimeEl.textContent = formatTime(audioPlayer.duration);
            }
        });

        // Seek functionality
        progressBar.addEventListener('input', (e) => {
            const seekTime = (e.target.value / 100) * audioPlayer.duration;
            audioPlayer.currentTime = seekTime;
        });

        // Volume control
        volumeControl.addEventListener('input', (e) => {
            audioPlayer.volume = e.target.value;
        });

        // Mute functionality
        volumeIcon.addEventListener('click', () => {
            isMuted = !isMuted;
            audioPlayer.muted = isMuted;
            volumeIcon.classList.toggle('fa-volume-high', !isMuted);
            volumeIcon.classList.toggle('fa-volume-mute', isMuted);
        });

        // Toggle playlist modal
        const toggleModal = () => {
            playlistModal.classList.toggle('hidden');
        };

        playlistBtn.addEventListener('click', () => toggleModal());
        closeModalBtn.addEventListener('click', () => toggleModal());

        // Close playlist modal when clicking outside
        playlistModal.addEventListener('click', (event) => {
            if (event.target === playlistModal) {
                toggleModal();
            }
        });

        // Render playlist in the modal
        const renderPlaylist = () => {
            playlistList.innerHTML = playlist.map((song, index) => `
                <li>
                    <span>${song.name} - ${song.artist}</span>
                    <button class="remove-btn" data-index="${index}">Remove</button>
                </li>
            `).join('');
        };

        // Remove song from playlist
        playlistList.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-btn')) {
                const index = parseInt(event.target.dataset.index, 10);
                playlist.splice(index, 1); // Remove the song
                if (currentSongIndex === index) {
                    audioPlayer.pause();
                    if (playlist.length > 0) {
                        currentSongIndex = 0;
                        loadSong(playlist[currentSongIndex]);
                    } else {
                        currentSongIndex = -1;
                        songTitleEl.textContent = 'Now Playing';
                        songArtistEl.textContent = 'Artist';
                        albumArtEl.src = 'placeholder.png';
                        audioPlayer.src = '';
                    }
                } else if (currentSongIndex > index) {
                    currentSongIndex--; // Adjust index
                }
                renderPlaylist();
            }
        });

        // Play a song when clicked from the search results
        document.body.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON' && event.target.dataset.url) {
                const songUrl = event.target.dataset.url;
                const songName = event.target.dataset.name;
                const songArtist = event.target.dataset.artist;
                const songImage = event.target.dataset.image;

                const songIndex = playlist.findIndex(song => song.downloadUrl === songUrl);

                if (songIndex !== -1) {
                    currentSongIndex = songIndex;
                } else {
                    playlist.push({ name: songName, downloadUrl: songUrl, artist: songArtist, image: songImage });
                    currentSongIndex = playlist.length - 1;
                }

                loadSong(playlist[currentSongIndex]);
                renderPlaylist(); // Render playlist after adding a song
            }
        });

        // Prevent fullscreen toggle when clicking on control buttons
        const controlButtons = this.querySelectorAll('.controls button, .progress-container input, .volume-container, .volume-container input');
        controlButtons.forEach((button) => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        });

        // Toggle fullscreen mode on player click
        playerEl.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                playerEl.requestFullscreen();
            }
        });

        // Exit fullscreen when clicking the button
        exitFullscreenBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent triggering player click
            document.exitFullscreen();
        });

        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement === playerEl) {
                // Player is in fullscreen mode
                playerEl.classList.add('fullscreen-active');
                exitFullscreenBtn.classList.remove('hidden');
            } else {
                // Player is NOT in fullscreen mode
                playerEl.classList.remove('fullscreen-active');
                exitFullscreenBtn.classList.add('hidden');
            }
        });
        
        

        // Format time in MM:SS
        const formatTime = (time) => {
            if (isNaN(time)) return '00:00';
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60).toString().padStart(2, '0');
            return `${minutes}:${seconds}`;
        };
    }
}
customElements.define('player-component', PlayerComponent);
