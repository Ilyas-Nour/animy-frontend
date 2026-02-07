async function testReddit() {
    try {
        console.log('Fetching Reddit via rss2json Proxy...');
        const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.reddit.com/r/animenews/hot.rss');
        const json = await response.json();

        console.log('Items:', json.items.length);
        json.items.slice(0, 3).forEach((item, i) => {
            console.log(`\n[${i}] Title:`, item.title.substring(0, 30));
            console.log('    Thumbnail:', item.thumbnail);
            // Check for image in content
            const imgMatch = item.content.match(/src="([^"]+)"/);
            console.log('    Content Img:', imgMatch ? imgMatch[1] : 'None');
            console.log('    Enclosure:', item.enclosure);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

testReddit();
