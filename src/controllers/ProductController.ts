import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import {
    createProductSchema,
    updateProductSchema,
    listProductQuerySchema,
} from '../schemas/productSchema.js';

export class ProductController {
    //POST /api/products
    static async create(req: Request, res: Response): Promise<Response> {
        const parsed = createProductSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                status: 'error',
                message: 'Dados inválidos para cadastro do produto',
                issues: parsed.error.issues.map((i) => ({
                    field: i.path.join('.'),
                    message: i.message,
                })),
            });
        }

        const product = await Product.create(parsed.data);

        return res.status(201).json({
            status: 'success',
            data: product,
        });
    }
    //GET /api/products?page=1&limit=10&category=...&search=...
    static async list(req: Request, res: Response): Promise<Response> {
        const parseQuery = listProductQuerySchema.safeParse(req.query);

        if (!parseQuery.success) {
            return res.status(400).json({
                status: 'error',
                message: 'Parâmetros de consulta inválidos.',
            });
        }

        const { page, limit, category, search } = parseQuery.data;
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = { isActive: true };

        if (search) {
            filter.$text = { $search: search };
        }

        const [products, total] = await Promise.all([
            Product.find(filter)
              .sort(search ? { score: { $meta: 'textScore' }} : { createdAt: -1 })
              .skip(skip)
              .limit(limit)
              .lean(),
            Product.countDocuments(filter),
        ]);

        return res.status(200).json({
            status: 'success',
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }

    // GET /api/products/:id
    static async getById(req: Request, res: Response): Promise<Response> {
        const id = String(req.params.id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID de produto inválido',
            });
        }

        const product = await Product.findOne({ _id: id, isActive: true }).lean();

        if (!product) {
            return res.status(404).json({
                status: 'error',
                message: 'Produto não encontrado',
            });
        }

        return res.status(200).json({
            status: 'success',
            data: 'product',
        });
    }

    // PATCH /api/products/:id

    static async update(req: Request, res: Response): Promise<Response> {
        const id = String(req.params.id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID de produto inválido',
            });
        }

        const parsed = updateProductSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                status: 'error',
                message: 'Dados inválidos para atualização.',
                issues: parsed.error.issues.map((i) => ({
                    field: i.path.join('.'),
                    message: i.message,
                })),
            });
        }

        const updated = await Product.findByIdAndUpdate(id, parsed.data, {
            new: true,
            runValidatetors: true,
        }).lean();

        if (!updated) {
            return res.status(404).json({
                status: 'error',
                message: 'Produto não encontrado.',
            });
        }

        return res.status(200).json({
            status: 'success',
            data: updated,
        });
    }

    // DELETE /api/products/:id (Soft delete)
    static async remove(req: Request, res: Response): Promise<Response> {
        const id = String(req.params.id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID de produto inválido.',
            });
        }

        const product = await Product.findByIdAndUpdate(
            id,
            { isAtive: false },
            { new: true }
        ).lean();

        if (!product) {
            return res.status(404).json({
                status: 'error',
                message: 'Produto não encontrado.',
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Producto desativado do catálogo com sucesso,',
        });
    }
}