import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import errors from '@media-master/http-errors';
import {
    Query,
    GameInfo,
    Platform,
    MediaOption,
    GamesResponse,
    GameResponse,
    Requirements,
    PcgwParseResponse
} from '@types';

export default class PcgwService {
    private readonly queries: string[] = ['windows', 'os_x', 'linux'];;

    private getOptions = async (name: string): Promise<MediaOption[]> => {
        // Some games can't be found when the name contains -
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

    private getInfo = async (gameName: string): Promise<GameInfo> => {
        if (!gameName) throw errors.notFound('Game not found');

        const apiUrl = 'https://www.pcgamingwiki.com/w/api.php' +
            `?action=parse&format=json&prop=text&page=${encodeURIComponent(gameName.replaceAll(' ', '_'))}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw errors.notFound('Game not found');

        const json = (await response.json()) as PcgwParseResponse;
        if (!json.parse?.text?.['*']) throw errors.notFound('Game not found');

        const html = json.parse.text['*'];
        const document = new JSDOM(html).window.document;
        const link = `https://www.pcgamingwiki.com/wiki/${encodeURIComponent(gameName.replaceAll(' ', '_'))}`;

        const gameInfo = {
            link,
            ...Object.fromEntries(this.queries.map(q => [q, {}])),
        } as GameInfo;

        for (const query of this.queries) {
            const sysReqsTable = document.querySelector(`#table-sysreqs-${query}`);
            if (!sysReqsTable) continue;

            const sysReqs: Requirements = {};
            const remapCategory = (category: string): string =>
                category === 'HDD/SSD' ? 'space' : category.toLowerCase();

            sysReqsTable
                .querySelectorAll('.template-infotable-body, .table-sysreqs-body-row')
                .forEach(row => {
                    const fullCategory =
                        row
                            .querySelector('.table-sysreqs-body-parameter')
                            ?.textContent?.trim() ?? '';

                    let category = fullCategory;
                    if (fullCategory.includes('(')) {
                        category = fullCategory.split('(')[1].split(')')[0];
                    }
                    category = remapCategory(category);

                    sysReqs[category as keyof Requirements] = {
                        minimum: row
                            .querySelector('.table-sysreqs-body-minimum')
                            ?.textContent?.trim() ?? '',
                        recommended: row
                            .querySelector('.table-sysreqs-body-recommended')
                            ?.textContent?.trim() ?? '',
                    };
                });

            gameInfo[query as Platform] = sysReqs;
        }

        return gameInfo;
    };

    public handle = async (method: string, query: Query): Promise<unknown> => {
        const methodMap: Record<string, (param: string) => Promise<unknown>> = {
            options: this.getOptions,
            info: this.getInfo,
        };

        if (!(method in methodMap)) {
            throw errors.notFound(
                'Invalid endpoint! Use /[options|info]'
            );
        }

        const param = query[method === 'options' ? 'name' : 'id'];
        if (param === undefined) throw errors.badRequest(`Missing parameter for the ${method} endpoint`);

        return await methodMap[method](param);
    };
}
