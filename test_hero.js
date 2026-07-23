async function check() {
    console.log("Fetching top anime of all time...");
    const res = await fetch('https://api.jikan.moe/v4/top/anime?filter=bypopularity');
    const json = await res.json();
    const data = json.data;
    
    const uniquePool = data;
    console.log(`Found ${uniquePool.length} unique anime in pool.`);
    
    let valid = 0;
    for (let i = 0; i < uniquePool.length; i++) {
        const item = uniquePool[i];
        const id = item.mal_id || item.anilistId || item.id;
        try {
            const mRes = await fetch(`https://api.ani.zip/mappings?mal_id=${id}`);
            if (!mRes.ok) continue;
            const mData = await mRes.json();
            if (mData.images) {
                console.log(item.title, "Images coverTypes:", mData.images.map(i => i.coverType));
            }
            // Try Consumet API
            const cRes = await fetch(`https://api.consumet.org/meta/anilist/info/${item.anilistId || item.id}`);
            if (cRes.ok) {
                const cData = await cRes.json();
                if (cData.logo) {
                    console.log(`[CONSUMET VALID] ${item.title} - Logo: ${cData.logo}`);
                }
            }
        } catch (e) {
            // ignore
        }
    }
    console.log(`Total Valid: ${valid}`);
}

check();
