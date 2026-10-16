const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wsxnbjmffbrfwhovtrla.supabase.co';
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fetchSongsFromSpotify() {
    const credentials = Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64');

    // 1. Dobijanje Spotify tokena
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + credentials,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
        console.error('Spotify token error:', tokenData);
        return;
    }
    const token = tokenData.access_token;

    // 2. Pretraga pesama
    const searchQueries = ['rock', 'pop', 'metal', 'hits', '80s', '90s', 'dance', 'indie', 'hip hop'];
    const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];
    
    const res = await fetch(`https://api.spotify.com/v1/search?q=${randomQuery}&type=track&limit=30`, {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    
    const data = await res.json();
    if (!data.tracks || !data.tracks.items) {
        console.error('Search error:', data);
        return;
    }

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

    // 3. Upis u Supabase
    if (tracksToInsert.length > 0) {
        const { error } = await supabase.from('songs').insert(tracksToInsert);
        if (error) {
            console.error('Supabase error:', error);
        } else {
            console.log(`Uspešno dodato ${tracksToInsert.length} pesama u bazu!`);
        }
    } else {
        console.log('Nema pesama sa preview linkom u ovom krugu.');
    }
}

fetchSongsFromSpotify();
