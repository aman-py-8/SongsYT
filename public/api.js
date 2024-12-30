export async function fetchSongs(query) {
    try {
        const url = `https://jio-saavn-api-rho.vercel.app/result/?query=${query}`;
        const response = await fetch(url, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        // Process the results
        if (Array.isArray(data)) {
            const results = data.map(item => ({
                id: item.id,
                name: item.song, // Changed from title to song
                image: item.image,
                downloadUrl: item.media_url,
                artist: item.singers,
            }));
            return results;
        } else {
            console.error('Invalid response structure:', data);
            return [];
        }
    } catch (error) {
        console.error('Error fetching songs:', error);
        return [];
    }
}

export async function fetchPlaylistSongs(playlistUrl) {
    try {
        // Construct the URL for fetching playlist data
        const url = `https://jio-saavn-api-rho.vercel.app/playlist/?query=${playlistUrl}`;
        const response = await fetch(url, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Check if the response contains songs
        if (data && data.songs && Array.isArray(data.songs)) {
            const results = data.songs.map(item => ({
                id: item.id,
                name: item.song,
                image: item.image,
                downloadUrl: item.media_url,
                artist: item.singers || Object.keys(item.artistMap).join(', ')
            }));
            return results;
        } else {
            console.error('Invalid response structure:', data);
            return [];
        }
    } catch (error) {
        console.error('Error fetching playlist songs:', error);
        return [];
    }
}
