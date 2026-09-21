const https = require('https');
https.get('https://api.ani.zip/mappings?mal_id=21', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        const ep1 = json.episodes['1'];
        console.log(ep1.title);
    });
});
