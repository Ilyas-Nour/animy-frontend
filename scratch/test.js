const fetch = require('node-fetch');

async function test() {
    const query = `
            query($page: Int, $perPage: Int, $seasonYear: Int, $season: MediaSeason) {
                Page(page: $page, perPage: $perPage) {
                    pageInfo { total perPage currentPage lastPage hasNextPage }
                    media(type: ANIME, seasonYear: $seasonYear, season: $season, sort: POPULARITY_DESC) {
                        id idMal title { english romaji native } coverImage { extraLarge large medium color }
                        format source episodes duration status meanScore popularity description
                        seasonYear season genres trailer { id site }
                        studios(isMain: true) { nodes { id name } }
                    }
                }
            }
        `;
    const variables = {
        page: 1,
        perPage: 24,
        seasonYear: 2026,
        season: "SUMMER"
    };

    const res = await fetch("https://graphql.anilist.co", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
}

test();
