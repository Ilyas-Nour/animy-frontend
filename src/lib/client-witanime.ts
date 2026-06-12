export class ClientWitanimeExtractor {
    private static baseUrl = 'https://witanime.you';
    private static cachedEpisodesRoute = '/custom-api/v1/anime-episodes/green/blue/ldu/';
    private static cachedEpisodeDetailsRoute = '/custom-api/blue/ldo/frum/chd/not/loaded/v1/episode/';

    private static normalizeTitle(title: string): string {
        if (!title) return "";
        let normalized = title.split(':')[0]; 
        normalized = normalized.split('-')[0]; 
        normalized = normalized.split('Season')[0]; 
        normalized = normalized.split('Part')[0]; 
        return normalized.trim();
    }

    static async searchAnime(query: string) {
        try {
            const res = await fetch(`${this.baseUrl}/wp-json/custom-api/v1/search-anime?search=${encodeURIComponent(query)}`);
            return await res.json();
        } catch (e) {
            console.error('Witanime search error', e);
            return [];
        }
    }

    static async getEpisodes(slug: string) {
        try {
            const url = `${this.baseUrl}/wp-json${this.cachedEpisodesRoute}${slug}`;
            const res = await fetch(url);
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error('Failed to get Witanime episodes', e);
            return [];
        }
    }

    static async getEpisodeData(episodeId: number | string) {
        try {
            const url = `${this.baseUrl}/wp-json${this.cachedEpisodeDetailsRoute}${episodeId}`;
            const res = await fetch(url);
            return await res.json();
        } catch (e) {
            return null;
        }
    }

    static async getServers(animeTitle: string, episodeNumber: number | string) {
        let searchResults = await this.searchAnime(animeTitle);
        
        if (!searchResults || searchResults.length === 0) {
            const normalized = this.normalizeTitle(animeTitle);
            if (normalized !== animeTitle) {
                searchResults = await this.searchAnime(normalized);
            }
        }

        if (!searchResults || searchResults.length === 0) return [];

        const anime = searchResults[0];
        const episodeIds = await this.getEpisodes(anime.slug);
        const targetEpNum = Number(episodeNumber);
        
        // Binary Search
        let left = 0;
        let right = episodeIds.length - 1;
        let targetData = null;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const data = await this.getEpisodeData(episodeIds[mid]);
            if (!data?.meta) break;

            const currentNum = Number(data.meta.episode_number);
            
            if (currentNum === targetEpNum) {
                targetData = data;
                break;
            } else if (currentNum < targetEpNum) {
                left = mid + 1; // Since it's descending order? Wait, episodes are usually sorted latest to oldest or oldest to latest.
            } else {
                right = mid - 1;
            }
        }

        // If binary search fails (due to wrong sorting assumption), fallback to linear search
        if (!targetData) {
            for (let i = 0; i < Math.min(episodeIds.length, 50); i++) {
                const data = await this.getEpisodeData(episodeIds[i]);
                if (Number(data?.meta?.episode_number) === targetEpNum) {
                    targetData = data;
                    break;
                }
            }
        }

        if (!targetData) return [];

        const servers: any[] = [];
        if (targetData?.meta?.servers && Array.isArray(targetData.meta.servers)) {
            servers.push(...targetData.meta.servers);
        }
        if (targetData?.meta?.dhd && Array.isArray(targetData.meta.dhd)) {
            servers.push(...targetData.meta.dhd);
        }
        
        return servers.map((s: any) => {
            // Decode base64
            let embedUrl = s.url;
            try {
                if (!embedUrl.startsWith('http')) {
                    embedUrl = atob(s.url);
                }
            } catch (e) {}

            return {
                name: `Witanime (${s.name})`,
                provider: `witanime`,
                isNative: false,
                url: embedUrl
            };
        }).filter(s => s.url && s.url.startsWith('http'));
    }
}
