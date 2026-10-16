const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getSpotifyAccessToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}

async function fetchSongsFromSpotify() {
    const token = await getSpotifyAccessToken();
    const searchQueries = ['rock', 'pop', 'metal', 'hits', '80s', '90s', 'dance', 'indie', 'hip hop'];
    const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];
    const randomOffset = Math.floor(Math.random() * 500);

    const response = await fetch(`https://api.spotify.com/v1/search?q=${randomQuery}&type=track&limit=50&offset=${randomOffset}`, {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    
    const data = await response.json();
    if (!data.tracks || !data.tracks.items) return;

    const tracksToInsert = [];
    for (const track of data.tracks.items) {
        if (track.preview_url) {
            tracksToInsert.push({
                title: track.name,
                artist: track.artists.map(a => a.name).join(', '),
                preview_url: track.preview_url
            });
        }
    }

    if (tracksToInsert.length > 0) {
        await supabase.from('songs').insert(tracksToInsert);
        console.log(`Dodato ${tracksToInsert.length} pesama!`);
    }
}

fetchSongsFromSpotify();
