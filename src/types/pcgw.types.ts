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

interface Spec {
    minimum: string,
    recommended: string,
};

export interface Requirements {
    target?: Spec,
    os?: Spec,
    cpu?: Spec,
    ram?: Spec,
    space?: Spec,
    gpu?: Spec,
};

export interface PcgwParseResponse {
    parse?: {
        text?: {
            ['*']?: string;
        };
    };
}

export type Platform = 'windows' | 'os_x' | 'linux';

export type GameInfo = {
    link: string;
} & {
    [key in Platform]: Requirements;
};

