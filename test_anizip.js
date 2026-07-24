

async function test() {
    const res = await fetch('https://api.ani.zip/mappings?mal_id=52991'); // Frieren
    const data = await res.json();
    console.log(data.images.map(img => img.coverType));
    
    const fanart = data.images.find(i => i.coverType === 'Fanart');
    const banner = data.images.find(i => i.coverType === 'Banner');
    const clearlogo = data.images.find(i => i.coverType === 'Clearlogo');
    console.log({ fanart: fanart?.url, banner: banner?.url, clearlogo: clearlogo?.url });
}
test();
