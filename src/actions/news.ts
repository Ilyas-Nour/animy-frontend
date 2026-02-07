'use server'

export async function fetchRedditPosts() {
    console.log('[News Action] Initializing Multi-Channel Fetch...')

    // Channel 1: Primary JSON (Hot)
    let posts = await fetchViaJson('https://www.reddit.com/r/animenews/hot.json?limit=50&raw_json=1')

    // Channel 2: Secondary JSON (New)
    if (!posts || posts.length === 0) {
        console.warn('[News Action] Channel 1 failed, trying Channel 2 (New)...')
        posts = await fetchViaJson('https://www.reddit.com/r/animenews/new.json?limit=50&raw_json=1')
    }

    // Channel 3: Tertiary (RSS Fallback)
    if (!posts || posts.length === 0) {
        console.warn('[News Action] Channel 2 failed, trying Channel 3 (RSS Proxy)...')
        posts = await fetchFallbackRSS()
    }

    console.log(`[News Action] Final Dispatch: ${posts?.length || 0} posts delivered.`)
    return posts || []
}

async function fetchViaJson(url: string) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Animy/1.0',
                'Accept': 'application/json'
            },
            next: { revalidate: 60 } // Faster revalidate for debugging
        })

        if (!response.ok) {
            console.error(`[News Action] JSON Fetch Failed (${response.status}): ${url}`)
            return null
        }

        const data = await response.json()
        const children = data.data?.children || []

        return children.map((child: any) => {
            try {
                const item = child.data
                if (!item || !item.title) return null

                let imageUrl = null
                if (item.preview?.images?.[0]?.source?.url) {
                    imageUrl = item.preview.images[0].source.url
                } else if (item.thumbnail && !['self', 'default', 'nsfw'].includes(item.thumbnail)) {
                    imageUrl = item.thumbnail
                }

                return {
                    id: item.id || Math.random().toString(36).substring(7),
                    url: item.url.startsWith('http') ? item.url : `https://www.reddit.com${item.permalink}`,
                    title: item.title,
                    created_utc: item.created_utc || Date.now() / 1000,
                    author: item.author || 'unknown',
                    thumbnail: imageUrl,
                    image_url: imageUrl,
                    score: item.score || 0,
                    stickied: !!item.stickied
                }
            } catch (e) {
                return null
            }
        }).filter(Boolean)
    } catch (error) {
        console.error(`[News Action] JSON Error (${url}):`, error)
        return null
    }
}

async function fetchFallbackRSS() {
    try {
        // Try multiple RSS proxies if one fails
        const proxies = [
            'https://api.rss2json.com/v1/api.json?rss_url=https://www.reddit.com/r/animenews/hot.rss&count=50',
            'https://api.rss2json.com/v1/api.json?rss_url=https://www.reddit.com/r/animenews/new.rss&count=50'
        ]

        for (const proxyUrl of proxies) {
            const response = await fetch(proxyUrl)
            const data = await response.json()

            if (data.status === 'ok' && data.items?.length > 0) {
                return data.items.map((item: any) => {
                    const idPart = item.guid?.split('/comments/')[1]?.split('/')[0] || item.guid || Math.random().toString(36).substring(7)
                    let imageUrl = item.enclosure?.thumbnail || item.enclosure?.link || item.thumbnail
                    if (['self', 'default', 'nsfw'].includes(imageUrl)) imageUrl = null

                    return {
                        id: idPart,
                        url: item.link,
                        title: item.title,
                        created_utc: item.pubDate ? new Date(item.pubDate).getTime() / 1000 : Date.now() / 1000,
                        author: item.author || 'unknown',
                        thumbnail: imageUrl,
                        image_url: imageUrl,
                        score: 0,
                        stickied: false
                    }
                })
            }
        }
        return []
    } catch (e) {
        console.error('[News Action] All fallbacks failed.', e)
        return []
    }
}
