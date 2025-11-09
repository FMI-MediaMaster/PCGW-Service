export interface MediaOption {
    name: string;
};

export interface Query {
    name?: string;
    id?: string;
};

export interface GameResponse {
    title: string;
    snippet: string;
};

interface PcgwQuery {
    search: GameResponse[]
};

export interface GamesResponse {
    query?: PcgwQuery
};
