// Define the audio player class
class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.isPlaying = false;
        this.progressBar = document.querySelector('.progress-bar');
        this.progress = document.querySelector('.progress');
        this.currentTimeElement = document.getElementById('currentTime');
        this.durationElement = document.getElementById('duration');
        this.playPauseButton = document.getElementById('playPauseButton');
        this.downloadButton = document.getElementById('downloadButton');
        this.audio.ontimeupdate = () => this.updateProgress();
    }

    // Fetch MP3 URL from RapidAPI using YouTube video ID
    async fetchMp3Url(youtubeId) {
        const url = `https://youtube-mp36.p.rapidapi.com/dl?id=${youtubeId}`;
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': 'cf0e21ed93mshf2ca29aa9105d66p1f41d2jsn182a9d41c8a8',
                'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
            }
        };

        try {
            const response = await fetch(url, options);
            const result = await response.json();
            return result.link; // Return MP3 URL
        } catch (error) {
            console.error("Error fetching MP3 URL:", error);
        }
    }

    // Load song data (title, artist, artwork) and MP3 URL
    async loadSong(song) {
        document.getElementById('songTitle').textContent = song.title;
        document.getElementById('artistName').textContent = song.artist;
        document.getElementById('albumArt').src = song.artwork;
        
        // Update player background to album art with blur and dark overlay
        const player = document.getElementById('player');
        player.style.backgroundImage = `url(${song.artwork}), linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5))`;
        player.style.backgroundSize = 'cover'; // Ensure the image covers the entire player
        player.style.backgroundPosition = 'center'; // Center the image
        player.style.backgroundRepeat = 'no-repeat'; // Prevent image repetition
        player.style.filter = 'none'; // Remove blur from the whole player

        // Add a div overlay for the blur effect
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundImage = `url(${song.artwork})`;
        overlay.style.backgroundSize = 'cover';
        overlay.style.backgroundPosition = 'center';
        overlay.style.filter = 'blur(5px)'; // Apply blur to the image itself
        overlay.style.zIndex = '-1'; // Ensure the overlay is behind the content

        // Append the overlay to the player
        player.appendChild(overlay);

        // Set a transition for smoother background change
        player.style.transition = 'background-image 0.5s ease';

        // Fetch MP3 URL using YouTube ID
        const mp3Url = await this.fetchMp3Url(song.youtubeId);
        if (mp3Url) {
            this.audio.src = mp3Url;
            this.audio.load();
            this.audio.play();
            this.isPlaying = true;
            this.playPauseButton.textContent = '❚❚';

            // Show the download button
            this.downloadButton.style.display = 'inline-block';
            this.downloadButton.onclick = () => window.location.href = mp3Url;
        }
    }

    // Toggle Play/Pause
    togglePlay() {
        if (this.isPlaying) {
            this.audio.pause();
            this.playPauseButton.textContent = '►';
        } else {
            this.audio.play();
            this.playPauseButton.textContent = '❚❚';
        }
        this.isPlaying = !this.isPlaying;
    }

    // Format time (minutes:seconds)
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    // Update progress bar as audio plays
    updateProgress() {
        const progressPercentage = (this.audio.currentTime / this.audio.duration) * 100;
        this.progress.style.width = progressPercentage + '%';
        this.currentTimeElement.textContent = this.formatTime(this.audio.currentTime);
    }

    // Seek function to allow user to click on progress bar
    seek(event) {
        const progressWidth = this.progressBar.offsetWidth;
        const clickPosition = event.offsetX;
        const newTime = (clickPosition / progressWidth) * this.audio.duration;
        this.audio.currentTime = newTime;
    }

    // Set volume
    setVolume(value) {
        this.audio.volume = value;
    }
}

// Initialize the player
const player = new AudioPlayer();

// Function to search songs from YouTube API
async function searchSongs(query) {
    const apiKey = 'AIzaSyBqDUyoILfLF_p3m6SOpNwErC-vQJ5kbyQ';
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.items.map(item => ({
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        youtubeId: item.id.videoId,
        artwork: item.snippet.thumbnails.medium.url
    }));
}

// Display search results
async function handleSearch() {
    const query = document.getElementById('searchInput').value;
    const songs = await searchSongs(query);

     // Hide trending videos
     document.getElementById('trending-section').style.display = 'none';

    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    songs.forEach((song) => {
        const songElement = document.createElement('div');
        songElement.className = 'song';
        songElement.innerHTML = `
            <img src="${song.artwork}" alt="${song.title}">
            <div class="song-info">
                <h4>${song.title}</h4>
                <p>${song.artist}</p>
            </div>
            <button class="play-btn">Play <i class="fa-solid fa-circle-play"></i> </button>
        `;

        // Add play button click handler
        songElement.querySelector('.play-btn').addEventListener('click', () => {
            player.loadSong(song);
        });

        resultsContainer.appendChild(songElement);
    });
    // Show a message if no results are found
    if (songs.length === 0) {
        resultsContainer.innerHTML = '<p>No results found.</p>';
    }
}

// Fetch Trending Music Videos
async function fetchTrendingVideos() {
    const apiKey = 'AIzaSyBqDUyoILfLF_p3m6SOpNwErC-vQJ5kbyQ';
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&chart=mostPopular&regionCode=US&videoCategoryId=10&maxResults=10&key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.items.map(video => ({
            title: video.snippet.title,
            artist: video.snippet.channelTitle,
            youtubeId: video.id,
            artwork: video.snippet.thumbnails.medium.url
        }));
    } catch (error) {
        console.error("Error fetching trending videos:", error);
    }
}

// Display Trending Videos
async function displayTrendingVideos() {
    const trendingVideos = await fetchTrendingVideos();
    const trendingContainer = document.getElementById('trending');
   

    trendingVideos.forEach((video) => {
        const videoElement = document.createElement('div');
        videoElement.className = 'song';
        videoElement.innerHTML = `
            <img src="${video.artwork}" alt="${video.title}">
            <div>
                <h4>${video.title}</h4>
                <p>${video.artist}</p>
            </div>
            <button class="play-btn">Play <i class="fa-solid fa-circle-play"></i> </button>
        `;

        // Add play button click handler
        videoElement.querySelector('.play-btn').addEventListener('click', () => {
            player.loadSong(video);
        });

        trendingContainer.appendChild(videoElement);
    });
}

// Function to toggle full-screen mode
function toggleFullScreen() {
    const player = document.getElementById('player');

    // Check if the player is already in full-screen mode
    if (!document.fullscreenElement) {
        // Enter full-screen mode
        if (player.requestFullscreen) {
            player.requestFullscreen();
        } else if (player.mozRequestFullScreen) { // Firefox
            player.mozRequestFullScreen();
        } else if (player.webkitRequestFullscreen) { // Chrome, Safari and Opera
            player.webkitRequestFullscreen();
        } else if (player.msRequestFullscreen) { // IE/Edge
            player.msRequestFullscreen();
        }

        // Add fullscreen class for styling
        player.classList.add('fullscreen');
    } else {
        // Exit full-screen mode
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
        }

        // Remove fullscreen class
        player.classList.remove('fullscreen');
    }
}

// Fetch and display trending videos on page load
document.addEventListener('DOMContentLoaded', () => {
    displayTrendingVideos();
});

// Event listeners
document.getElementById('searchBtn').addEventListener('click', handleSearch);
document.getElementById('playPauseButton').addEventListener('click', () => player.togglePlay());
document.querySelector('.progress-bar').addEventListener('click', (e) => player.seek(e));
document.getElementById('volume').addEventListener('input', (e) => player.setVolume(e.target.value));
document.getElementById('searchInput').addEventListener('input', (event) => {
    if (event.target.value.trim() === '') {
        // Clear search results and show trending videos
        document.getElementById('results').innerHTML = '';
        document.getElementById('trending-section').style.display = 'inline';
    }
});
// Event listener for the full-screen button
document.getElementById('fullscreenBtn').addEventListener('click', toggleFullScreen);

// Detect when full-screen mode changes (for UI updates, if needed)
document.addEventListener('fullscreenchange', function() {
    const player = document.getElementById('player');
    if (!document.fullscreenElement) {
        player.classList.remove('fullscreen');
    }
});


