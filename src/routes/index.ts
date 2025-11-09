import { Router } from 'express';
import pcgwController from '@controllers/pcgw';

const routes: Router = Router();

routes.use('/:method', pcgwController.handler);

export default routes;

