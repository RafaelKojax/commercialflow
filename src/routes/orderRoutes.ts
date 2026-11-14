import  { Router } from 'express';
import { OrderController } from '../controllers/OrderController.js';

export const orderRoutes = Router();

orderRoutes.get('/', OrderController.list);
orderRoutes.get('/:id', OrderController.getById);
orderRoutes.post('/', OrderController.create);
orderRoutes.patch('/:id/status', OrderController.updateStatus);