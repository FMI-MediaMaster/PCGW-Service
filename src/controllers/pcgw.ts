import { Request, Response } from 'express';
import PcgwService from '@services/pcgw';

export default class PcgwController {
    static async handler(req: Request, res: Response): Promise<void> {
        const pcgw: PcgwService = new PcgwService();
        res.ok(await pcgw.handle(req.params.method, req.query) as object);
    };
};
