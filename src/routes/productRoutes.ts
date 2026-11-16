import { Router } from 'express';
import { ProductController } from '../controllers/ProductController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

export const productRoutes = Router();

// Vitrine pública
productRoutes.get('/', ProductController.list);
productRoutes.get('/:id', ProductController.getById);

// Backoffice protegido
productRoutes.post('/', ProductController.create);
productRoutes.patch('/:id', ProductController.update);
productRoutes.delete('/:id', ProductController.remove);
