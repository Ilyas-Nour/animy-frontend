export class WitanimeExtractor {
    private static baseUrl = 'https://witanime.you';
    private static cachedEpisodesRoute: string | null = null;
    private static cachedEpisodeDetailsRoute: string | null = null;

    static async discoverRoutes() {
        if (this.cachedEpisodesRoute && this.cachedEpisodeDetailsRoute) return;

        try {
            const res = await fetch(`${this.baseUrl}/wp-json`, { next: { revalidate: 3600 } });
            const data = await res.json();
            
            if (data && data.routes) {
                const routes = Object.keys(data.routes);
                
                const episodesRoute = routes.find(r => r.includes('anime-episodes'));
                if (episodesRoute) {
                    this.cachedEpisodesRoute = episodesRoute.split('(?P<')[0];
                }

                const detailsRoute = routes.find(r => r.includes('episode/(?P<'));
                if (detailsRoute) {
                    this.cachedEpisodeDetailsRoute = detailsRoute.split('(?P<')[0];
                }
            }
        } catch (e) {
            console.error('Failed to discover Witanime routes', e);
        }
    }

    static async searchAnime(query: string) {
        try {
            const res = await fetch(`${this.baseUrl}/wp-json/custom-api/v1/search-anime?search=${encodeURIComponent(query)}`);
            return await res.json();
        } catch (e) {
            return [];
        }
    }

    static async getEpisodes(slug: string) {
        await this.discoverRoutes();
        const route = this.cachedEpisodesRoute || '/custom-api/v1/anime-episodes/green/blue/ldu/';
        const url = `${this.baseUrl}/wp-json${route}${slug}`;
        
        try {
            const res = await fetch(url);
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error('Failed to get Witanime episodes', e);
            return [];
        }
    }

    static async getEpisodeData(episodeId: number | string) {
        await this.discoverRoutes();
        const route = this.cachedEpisodeDetailsRoute || '/custom-api/blue/ldo/frum/chd/not/loaded/v1/episode/';
        const url = `${this.baseUrl}/wp-json${route}${episodeId}`;
        
        try {
            const res = await fetch(url);
            return await res.json();
        } catch (e) {
            console.error('Failed to get Witanime servers', e);
            return null;
        }
    }

    static async getServersForAnimeEpisode(title: string, episodeNumber: number | string) {
        const searchResults = await this.searchAnime(title);
        if (!searchResults || searchResults.length === 0) return [];

        const anime = searchResults[0];
        const episodeIds = await this.getEpisodes(anime.slug);
        
        const targetEpNum = Number(episodeNumber);
        
        // Optimize: Check the expected index first
        let expectedIndex = targetEpNum - 1;
        if (expectedIndex >= 0 && expectedIndex < episodeIds.length) {
            const data = await this.getEpisodeData(episodeIds[expectedIndex]);
            if (Number(data?.meta?.episode_number) === targetEpNum) {
                return this.extractServersFromData(data);
            }
        }
        
        // Fallback to Binary Search
        let left = 0;
        let right = episodeIds.length - 1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const data = await this.getEpisodeData(episodeIds[mid]);
            const currentNum = Number(data?.meta?.episode_number);
            
            if (currentNum === targetEpNum) {
                return this.extractServersFromData(data);
            } else if (currentNum < targetEpNum) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        return [];
    }

    private static extractServersFromData(data: any) {
        const servers: any[] = [];
        if (data?.meta?.servers && Array.isArray(data.meta.servers)) {
            servers.push(...data.meta.servers);
        }
        if (data?.meta?.dhd && Array.isArray(data.meta.dhd)) {
            servers.push(...data.meta.dhd);
        }
        
        return servers.map((s: any) => ({
            name: `Witanime - ${s.name}`,
            provider: 'witanime',
            isNative: false,
            url: s.url
        }));
    }
}
