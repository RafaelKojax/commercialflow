import  { Router } from 'express';
import { OrderController } from '../controllers/OrderController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

export const orderRoutes = Router();

// Vitrine pública
orderRoutes.post('/', OrderController.create);
orderRoutes.get('/track/:orderNumber', OrderController.trackByOrderNumber);


orderRoutes.get('/metrics', requireAuth, OrderController.getDashboardMetrics);
orderRoutes.get('/', requireAuth, OrderController.list);
orderRoutes.patch('/:id', requireAuth, OrderController.getById);
orderRoutes.patch('/:id/status', requireAuth, OrderController.updateStatus);