export default class PlayerComponent extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="player">
                <button class="exit-fullscreen-btn hidden">Exit Fullscreen</button>
                <canvas id="visualizer" class="visualizer"></canvas>
                <div class="player-info">
                    <img id="album-art" src="favicon.png" alt="Album Art">
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
                <button id="download-btn"><i class="fa-solid fa-download"></i></button>
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
        const downloadBtn = this.querySelector('#download-btn');
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
        const canvas = this.querySelector('#visualizer');
        const ctx = canvas.getContext('2d');
        

        let currentSongIndex = -1;
        let playlist = [];
        let isRepeatEnabled = false;
        let isMuted = false;
        let audioContext;
        let analyser;
        let source;
        let animationId;
        let isAudioContextInitialized = false;

        // Initialize gesture handling variables
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        const minSwipeDistance = 50; // Minimum distance for a swipe to be registered
        let isControlArea = false; // Flag to check if touch started in control area

        // Add touch event listeners
        playerEl.addEventListener('touchstart', handleTouchStart, false);
        playerEl.addEventListener('touchmove', handleTouchMove, false);
        playerEl.addEventListener('touchend', handleTouchEnd, false);

        function handleTouchStart(event) {
            const touch = event.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;

            // Check if touch started in controls, progress bar, or volume area
            const target = event.target;
            isControlArea = target.closest('.controls') || 
                           target.closest('.progress-container') || 
                           target.closest('.volume-container') ||
                           target.closest('button');
        }

        function handleTouchMove(event) {
            // Only prevent default if not in control area to allow normal interaction with controls
            if (!isControlArea) {
                event.preventDefault();
            }
            const touch = event.touches[0];
            touchEndX = touch.clientX;
            touchEndY = touch.clientY;
        }

        function handleTouchEnd() {
            // If touch started in control area, ignore swipe
            if (isControlArea) {
                return;
            }

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);

            // Check if it's a horizontal swipe (for next/previous track)
            if (absDeltaX > minSwipeDistance && absDeltaX > absDeltaY) {
                if (deltaX > 0) {
                    // Swipe right - previous track
                    prevBtn.click();
                } else {
                    // Swipe left - next track
                    nextBtn.click();
                }
            }
            // Check if it's a vertical swipe
            else if (absDeltaY > minSwipeDistance && absDeltaY > absDeltaX) {
                if (deltaY > 0) {
                    // Swipe down - exit fullscreen
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                } else {
                    // Swipe up - enter fullscreen
                    if (!document.fullscreenElement) {
                        playerEl.requestFullscreen().catch(err => {
                            console.warn(`Error attempting to enable fullscreen: ${err.message}`);
                        });
                    }
                }
            }

            // Reset touch coordinates
            touchStartX = 0;
            touchStartY = 0;
            touchEndX = 0;
            touchEndY = 0;
            isControlArea = false;
        }

        // Modified initializeAudioContext to handle CORS
        const initializeAudioContext = async () => {
            try {
                // Create audio context if it doesn't exist
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    analyser = audioContext.createAnalyser();
                    analyser.fftSize = 256;
                }
        
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }
        
                // Only create new connections if not already initialized
                if (!isAudioContextInitialized) {
                    // Create new source and connections
                    source = audioContext.createMediaElementSource(audioPlayer);
                    source.connect(analyser);
                    analyser.connect(audioContext.destination);
                    isAudioContextInitialized = true;
                }
        
                return true;
            } catch (error) {
                console.warn('Audio context initialization failed:', error);
                createDummyAnalyser();
                return false;
            }
        };

        // Create a dummy analyser for when we can't access the audio data
        const createDummyAnalyser = () => {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            
            // Create an oscillator for dummy data
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0; // Mute the oscillator
            oscillator.connect(gainNode);
            gainNode.connect(analyser);
            oscillator.start();
        };

        const drawVisualizer = () => {
            if (!analyser) return;

            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            try {
                analyser.getByteFrequencyData(dataArray);
            } catch (error) {
                console.error('Error getting frequency data:', error);
                return;
            }

            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Set the center point
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            // Calculate radius based on smaller canvas dimension
            const radius = Math.min(centerX, centerY) * 0.8;

            // Draw frequency bars in a circle
            const barCount = bufferLength;
            const angleStep = (2 * Math.PI) / barCount;

            dataArray.forEach((value, index) => {
                const angle = index * angleStep;
                
                // Calculate bar height based on frequency data
                const barHeight = (value / 255) * (radius * 0.5);
                
                // Calculate start and end points for each bar
                const innerRadius = radius * 0.2; // Inner circle radius
                const outerRadius = innerRadius + barHeight;
                
                // Calculate points
                const x1 = centerX + Math.cos(angle) * innerRadius;
                const y1 = centerY + Math.sin(angle) * innerRadius;
                const x2 = centerX + Math.cos(angle) * outerRadius;
                const y2 = centerY + Math.sin(angle) * outerRadius;
                
                // Create gradient for each bar
                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, '#8a2be2');
                gradient.addColorStop(1, '#00bfff');
                
                // Draw the bar
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = gradient;
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                // Optional: Add glow effect
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00bfff';
            });

            // Draw center circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.18, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(138, 43, 226, 0.2)';
            ctx.fill();
            
            // Reset shadow effect
            ctx.shadowBlur = 0;

            animationId = requestAnimationFrame(drawVisualizer);
        };

        // Download functionality
        downloadBtn.addEventListener('click', async () => {
            if (currentSongIndex !== -1) {
                const song = playlist[currentSongIndex];
                try {
                    const response = await fetch(song.downloadUrl);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    const filename = `${song.name.replace(/[<>:"/\\|?*]/g, '')}.mp3`;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } catch (error) {
                    console.error('Download failed:', error);
                }
            }
        });

        document.addEventListener('addPlaylistSongs', (event) => {
            const songs = event.detail;
            let firstSongIndex = playlist.length;  
            
            songs.forEach(song => {
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

            if (currentSongIndex === -1 && playlist.length > 0) {
                currentSongIndex = firstSongIndex;
                loadSong(playlist[currentSongIndex]);
            }

            renderPlaylist();
        });

        const updateBackground = (imageUrl) => {
            if (playerEl) {
                playerEl.style.setProperty('--background-image', `url(${imageUrl})`);
                playerEl.style.backgroundImage = `url(${imageUrl})`;
            }
        };

        // Modified loadSong function
        const loadSong = async (song) => {
            songTitleEl.textContent = song.name;
            songArtistEl.textContent = song.artist || 'Unknown Artist';          
            albumArtEl.src = song.image || 'placeholder.png';
            updateBackground(song.image || 'placeholder.png');
        
            // Reset audio player state
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        
            try {
                // Set up audio with CORS handling
                audioPlayer.crossOrigin = "anonymous";
                
                // Create a proxy URL to handle CORS
                const proxyUrl = new URL(song.downloadUrl);
                proxyUrl.searchParams.append('timestamp', Date.now()); // Prevent caching issues
                
                // Set the source and load the audio
                audioPlayer.src = proxyUrl.toString();
                
                // Wait for the audio to be loaded
                await new Promise((resolve, reject) => {
                    audioPlayer.addEventListener('canplay', resolve, { once: true });
                    audioPlayer.addEventListener('error', reject, { once: true });
                });
        
                // Initialize audio context after successful load
                await initializeAudioContext();
                
                // Start playback
                await audioPlayer.play();
                playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
                drawVisualizer();
            } catch (error) {
                console.warn('Advanced audio features failed, falling back to basic playback:', error);
                
                // Fallback to basic playback without visualizer
                try {
                    audioPlayer.crossOrigin = null;
                    audioPlayer.src = song.downloadUrl;
                    await audioPlayer.play();
                    playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                } catch (fallbackError) {
                    console.error('Basic playback also failed:', fallbackError);
                    // Reset UI to initial state
                    playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                }
            }
        };
        

        

        playPauseBtn.addEventListener('click', () => {
            if (audioPlayer.paused) {
                audioPlayer.play();
                playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                drawVisualizer();
            } else {
                audioPlayer.pause();
                playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
            }
        });

        nextBtn.addEventListener('click', () => {
            currentSongIndex = (currentSongIndex + 1) % playlist.length;
            loadSong(playlist[currentSongIndex]);
        });

        prevBtn.addEventListener('click', () => {
            currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
            loadSong(playlist[currentSongIndex]);
        });

        repeatBtn.addEventListener('click', () => {
            isRepeatEnabled = !isRepeatEnabled;
            const repeatIcon = repeatBtn.querySelector('i');
            if (isRepeatEnabled) {
                repeatIcon.classList.remove('fa-repeat');
                repeatIcon.classList.add('fa-arrows-rotate');
                repeatBtn.style.color = 'green';
            } else {
                repeatIcon.classList.remove('fa-arrows-rotate');
                repeatIcon.classList.add('fa-repeat');
                repeatBtn.style.color = 'white';
            }
        });

        audioPlayer.addEventListener('ended', () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            if (isRepeatEnabled) {
                audioPlayer.currentTime = 0;
                audioPlayer.play();
                drawVisualizer();
            } else {
                nextBtn.click();
            }
        });

        audioPlayer.addEventListener('timeupdate', () => {
            if (audioPlayer.duration) {
                const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressBar.style.setProperty('--progress', `${progressPercent}%`);
                progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
                totalTimeEl.textContent = formatTime(audioPlayer.duration);
            }
        });

        progressBar.addEventListener('input', (e) => {
            const seekTime = (e.target.value / 100) * audioPlayer.duration;
            audioPlayer.currentTime = seekTime;
        });

        volumeControl.addEventListener('input', (e) => {
            audioPlayer.volume = e.target.value;
        });

        volumeIcon.addEventListener('click', () => {
            isMuted = !isMuted;
            audioPlayer.muted = isMuted;
            volumeIcon.classList.toggle('fa-volume-high', !isMuted);
            volumeIcon.classList.toggle('fa-volume-mute', isMuted);
        });

        const toggleModal = () => {
            playlistModal.classList.toggle('hidden');
        };

        playlistBtn.addEventListener('click', () => toggleModal());
        closeModalBtn.addEventListener('click', () => toggleModal());

        playlistModal.addEventListener('click', (event) => {
            if (event.target === playlistModal) {
                toggleModal();
            }
        });

        const renderPlaylist = () => {
            playlistList.innerHTML = playlist.map((song, index) => `
                <li>
                    <span>${song.name} - ${song.artist}</span>
                    <button class="remove-btn" data-index="${index}">Remove</button>
                </li>
            `).join('');
        };

        playlistList.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-btn')) {
                const index = parseInt(event.target.dataset.index, 10);
                playlist.splice(index, 1);
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
                    currentSongIndex--;
                }
                renderPlaylist();
            }
        });

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
                renderPlaylist();
            }
        });

        const controlButtons = this.querySelectorAll('.controls button, .progress-container input, .volume-container, .volume-container input');
        controlButtons.forEach((button) => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        });

        playerEl.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                playerEl.requestFullscreen();
            }
        });

        exitFullscreenBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            document.exitFullscreen();
        });

        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement === playerEl) {
                playerEl.classList.add('fullscreen-active');
                exitFullscreenBtn.classList.remove('hidden');
            } else {
                playerEl.classList.remove('fullscreen-active');
                exitFullscreenBtn.classList.add('hidden');
            }
        });
        
        const formatTime = (time) => {
            if (isNaN(time)) return '00:00';
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60).toString().padStart(2, '0');
            return `${minutes}:${seconds}`;
        };
    }
}

customElements.define('player-component', PlayerComponent);