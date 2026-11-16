import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
    sub: string;
    role: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            status: 'error',
            message: 'Token de autenticação não fornecido.',
        });
        return;
    }

    const token = authHeader.slice(7);
    const jwtSecret = process.env.JWT_SECRET || 'commercialflow-dev-secret-2026';

    try {
        const decoded = jwt.verify(token, jwtSecret) as TokenPayload;
        res.locals.adminId = decoded.sub;
        next();
    } catch {
        res.status(401).json({
            status: 'error',
            message: 'Token inválido ou expirado.',
        });
    }
}