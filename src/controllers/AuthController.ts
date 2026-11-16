import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { loginSchema } from '../schemas/authSchema.js';
import { request } from 'node:http';

export class AuthController {
    //POST /api/auth/login
    static async login(req: Request, res: Response): Promise<Response> {
        const parsed = loginSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                status: 'error',
                message: 'Credenciais em formato inválido.',
                issues: parsed.error.issues.map((i) => ({
                    field: i.path.join('.'),
                    message: i.message,
                })),
            });
        }

        const { email, password } = parsed.data;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'E-mail ou senha incorretos.',
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'E-mail ou senha incorretos.',
            });
        }

        const jwtSecret = process.env.JWT_SECRET || 'commercialflow-dev-secret-2026';
        const token = jwt.sign(
            { sub: String(user._id), role: user.role },
            jwtSecret,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            status: 'success',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email:user.email,
                    role: user.role,
                },
            },
        });
    }

    // GET /api/auth/me
    static async me(req: Request, res: Response): Promise<Response> {
        const adminId = res.locals.adminId as string;
        const user = await User.findById(adminId).select('-passwordHash').lean();

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Usuario não encontrado',
            });
        }

        return res.status(200).json({
            status: 'success',
            data: user,
        });
    }
}