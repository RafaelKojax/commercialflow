import { Router } from 'express';
import { ProductController } from '../controllers/ProductController.js';

export const productRoutes = Router();

productRoutes.get('/', ProductController.list);
productRoutes.get('/:id', ProductController.getById);
productRoutes.post('/', ProductController.create);
productRoutes.patch('/:id', ProductController.update);
productRoutes.delete('/:id', ProductController.remove);
