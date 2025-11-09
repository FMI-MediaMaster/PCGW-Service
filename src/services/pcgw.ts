import fetch from 'node-fetch';
import errors from '@media-master/http-errors';
import {
    MediaOption,
    Query,
    GamesResponse,
    GameResponse,
} from '@types';

export default class PcgwService {
    private getOptions = async (name: string): Promise<MediaOption[]> => {
        // some games can't be found when the name contains -
        const gameName = name.replaceAll('-', ' ');

        const response = await fetch(new URL(`https://www.pcgamingwiki.com/w/api.php?action=query&format=json&list=search&srsearch=${gameName}`));
        if (!response.ok) return [];

        const games: GamesResponse = (await response.json()) as GamesResponse;
        if (!games.query || !games.query.search) return [];

        return (games.query.search as GameResponse[])
            .map(game => {
                if (game.snippet.includes('REDIRECT')) {
                    // Example: '#REDIRECT [[<span class="searchmatch">Blasphemous</span> 2]]\n' → "Blasphemous 2"
                    game.title = '';
                    const parts = game.snippet.split('</span>');
                    for (const part of parts) {
                        if (part.includes('>')) {
                            game.title += part.split('>')[1] + ' ';
                        }
                    }
                    game.title += parts[parts.length - 1]
                        .substring(0, parts[parts.length - 1].length - 3)
                        .trim();
                }

                return { name: game.title.trim() } as MediaOption;
            })
            .reduce<MediaOption[]>((uniqueOptions, option) => {
                // Prevent duplicates
                if (!uniqueOptions.some(game => game.name === option.name)) {
                    uniqueOptions.push(option);
                }
                return uniqueOptions;
            }, []);
    };

    private getInfo = async (id: string): Promise<object> => {
        return {};
    };

    public handle = async (method: string, query: Query): Promise<unknown> => {
        const methodMap: Record<string, (param: string) => Promise<unknown>> = {
            options: this.getOptions,
            info: this.getInfo,
        };

        if (!(method in methodMap)) {
            throw errors.notFound(
                'Invalid endpoint! Use /api/[options|info]'
            );
        }

        const param = query[method === 'options' ? 'name' : 'id'];
        if (param === undefined) throw errors.badRequest(`Missing parameter for the ${method} endpoint`);

        return await methodMap[method](param);
    };
}
