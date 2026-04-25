export interface Manga {
    mal_id: number;
    url: string;
    images: {
        jpg: {
            image_url: string;
            small_image_url: string;
            large_image_url: string;
        };
        webp: {
            image_url: string;
            small_image_url: string;
            large_image_url: string;
        };
    };
    title: string;
    title_english?: string;
    title_japanese?: string;
    type: string;
    chapters?: number;
    volumes?: number;
    status: string;
    publishing: boolean;
    published: {
        from: string;
        to: string;
        string: string;
    };
    score?: number;
    scored_by?: number;
    rank?: number;
    popularity?: number;
    members?: number;
    favorites?: number;
    synopsis?: string;
    background?: string;
    authors: Author[];
    serializations: Serialization[];
    genres: Genre[];
    explicit_genres: Genre[];
    themes: Genre[];
    demographics: Genre[];
    relations?: any[];
    recommendations?: any[];
}

export interface Author {
    mal_id: number;
    type: string;
    name: string;
    url: string;
}

export interface Serialization {
    mal_id: number;
    type: string;
    name: string;
    url: string;
}

export interface Genre {
    mal_id: number;
    type: string;
    name: string;
    url: string;
}

export interface MangaSearchResponse {
    data: Manga[];
    pagination: {
        last_visible_page: number;
        has_next_page: boolean;
        current_page: number;
        items: {
            count: number;
            total: number;
            per_page: number;
        };
    };
}
