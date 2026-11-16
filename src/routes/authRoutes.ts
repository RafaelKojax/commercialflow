import { Router } from 'express';
import { AuthController } from  '../controllers/AuthController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

export const authRoutes = Router();

authRoutes.post('/login', AuthController.login);
authRoutes.get('/me', requireAuth, AuthController.me);

