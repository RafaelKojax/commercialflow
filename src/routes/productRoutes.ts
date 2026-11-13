import { Router } from 'express';
import { ProductController } from '../controllers/ProductController.js';

export const productRoutes = Router();

productRoutes.get('/', ProductController.list);
productRoutes.get('/:id', ProductController.getById);
productRoutes.get('/', ProductController.create);
productRoutes.get('/:id', ProductController.update);
productRoutes.get('/:id', ProductController.remove);
