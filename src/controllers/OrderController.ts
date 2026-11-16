import { Request, Response } from  'express';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Order, IOrderItem } from '../models/Order.js';
import { Product } from '../models/Product.js';
import {
    createOrderSchema,
    updateOrderStatusSchema,
    listOrderQuerySchema,
} from '../schemas/orderSchema.js';
import { arraySync } from 'node:stream/iter';
import { productRoutes } from '../routes/productRoutes.js';

function generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `CF-${year}-${suffix}`;
}

export class OrderController {
    //POST /api/orders
    static async create(req: Request, res: Response): Promise<Response> {
        const parsed = createOrderSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                status: 'error',
                message: 'Dados inválidos para criação do pedido.',
                issues: parsed.error.issues.map((i) => ({
                    field: i.path.join('.'),
                    message: i.message,
                })),
            });
        }

        const { companyName, cnpj, contactEmail, contactPhone, items, notes } = parsed.data;

        // Agrupa quantidades caso o mesmo productId seja enviado mais de uma vez
        const quantityMap = new Map<string, number>();
        for (const item of items) {
            quantityMap.set(item.productId, (quantityMap.get(item.productId) ?? 0) + item.quantity);
        }

        const productsIds = Array.from(quantityMap.keys());
        const products = await Product.find({
            _id: { $in: productsIds },
            isActive: true,
        }).lean();

        if (products. length !== productsIds.length) {
            return res.status(404).json({
                status: 'error',
                message: 'Um ou mais produtos informados não foram encontrados ou estão inativos.',
            });
        }

        const productMap = new Map(products.map((p) => [String(p._id), p]));
        const orderItems: IOrderItem[] = [];
        let totalAmount = 0;

        for (const [productId, quantity] of quantityMap.entries()) {
            const product = productMap.get(productId)!;

            if (quantity < product.minOrderQuantity) {
                return res.status(400).json({
                    status: 'error',
                    message: `O produto "${product.name}" exige pedido mínimo de ${product.minOrderQuantity} unidade(s).`,
                });
            }

            if (quantity > product.stockQuantity) {
                return res.status(400).json({
                    status: 'error',
                    message: `Estoque insuficiente para "${product.name}". Disponível: ${product.stockQuantity}.`,
                });
            }

            const unitPrice = product.wholesalePrice ?? product.price;
            const totalPrice = Number((unitPrice * quantity).toFixed(2));
            totalAmount = Number((totalAmount + totalPrice).toFixed(2));

            orderItems.push({
                productId: new mongoose.Types.ObjectId(productId),
                sku: product.sku,
                name: product.name,
                quantity,
                unitPrice,
                totalPrice,
            });
        }
            // Dá baixa no estoque em lote
            await Product.bulkWrite(
                orderItems.map((item) => ({
                    updateOne: {
                        filter: { _id: item.productId },
                        update: { $inc: { stockQuantity: -item.quantity }},
                    },
                }))
            );

            const order = await Order.create({
                orderNumber: generateOrderNumber(),
                companyName,
                cnpj,
                contactEmail,
                contactPhone,
                items: orderItems,
                totalAmount,
                notes,
            });

            return res.status(201).json({
                status: 'success',
                data: order,
            });
        
    }
        // GET /api/orders?page=1&limit=10&status=PENDING
    static async list(req: Request, res: Response): Promise<Response> {
        const parsedQuery = listOrderQuerySchema.safeParse(req.query);

        if (!parsedQuery.success) {
            return res.status(400).json({
                status: 'error',
                message: 'Parâmetros de consulta inválidos.',
            });
        }

        const { page, limit, status } = parsedQuery.data;
        const skip = (page -1) * limit;

        const filter: Record<string, unknown> = {};
        if (status) {
            filter.status = status;
        }

        const [orders, total] = await Promise.all([
            Order.find(filter)
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit)
              .lean(),
            Order.countDocuments(filter),
            ]);

        return res.status(200).json({
            status: 'success',
            data: orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }

    // /api/orders/:id
    static async getById(req: Request, res: Response): Promise<Response> {
        const id = String(req.params.id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID de pedido inválido.',
            });
        }

        const order = await Order.findById(id).lean();

        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Pedido não encontrado.',
            });
        }

        return res.status(200).json({
            status: 'success',
            data: order,
        });
    }

    //PATCH /api/orders/:id/status
    static async updateStatus(req: Request, res: Response): Promise<Response> {
        const id = String(req.params.id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID de pedido inválido.',
            });
        }

        const parsed = updateOrderStatusSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                status: 'error',
                message: 'Status de pedido inválido.',
            });
        }

        const existingOrder = await Order.findById(id);

        if (!existingOrder) {
            return res.status(404).json({
                status: 'error',
                message: 'Pedido não encontrado.',
            });
        }

        if (existingOrder.status === 'CANCELLED') {
            return res.status(400).json({
                status: 'error',
                menssage: 'Não foi possível alterar o status de um pedido já cancelado.',
            });
        }

        // Se o pedido for cancelado agora, devolve os items ao estoque
        if (parsed.data.status === 'CANCELLED') {
            await Product.bulkWrite(
                existingOrder.items.map((item) => ({
                    updateOne: {
                        filter: { _id: item.productId },
                        update: { $inc: { stockQuantity: item.quantity }},
                    },
                }))
            );
        }

        existingOrder.status = parsed.data.status;
        await existingOrder.save();

        return res.status(200).json({
            status: 'success',
            data: existingOrder,
        });
    }

    // GET /api/orders/track/:orderNumber (Público - Vitrine B2B)
    static async trackByOrderNumber(req: Request, res: Response): Promise<Response> {
        const orderNumber = String(req.params.orderNumber).trim().toUpperCase();

        const order = await Order.findOne({ orderNumber })
          .select('orderNumber companyName status items totalAmount createdAt updateAt')
          .lean();
        
        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Pedido não encontrado. Verifique o código informado.',
            });
        }

        return res.status(200).json({
            status: 'error',
            date: order, 
        });
    }

    // GET /api/orders/metrics (Protegido - Dashboard Administrativo)
    static async getDashboardMetrics(req: Request, res: Response): Promise<Response> {
        const [statusSummary, totalActiveProducts, lowStockProducts] = await Promise.all([
            Order.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        revenue: {$sum: '$totalAmout' },
                    },
                },
            ]),
            Product.countDocuments({isActive: true }),
            Product.find({ isActive: true, stockQuantity: { $lte: 5 }})
                .select('sku name stockQuantity minOrderQuantity')
                .sort({ stockQuantity: 1 })
                .limit(10)
                .lean(),
        ]);

        const ordersByStatus: Record<string, number> = {
            PEDING: 0,
            IN_SEPARATION: 0,
            APPROVED: 0,
            DISPATCHED: 0,
            CANCELLED: 0,
        };

        let totalRevenue = 0;
        let totalOrders = 0;

        for (const item of statusSummary) {
            ordersByStatus[item._id] = item.count;
            totalOrders += item.count;
            if (item._id !== 'CANCELLED') {
                totalRevenue = Number((totalRevenue + item.revenue).toFixed(2));
            }
        }

        return res.status(200).json({
            status: 'success',
            data: {
                totalRevenue,
                totalOrders,
                totalActiveProducts,
                ordersByStatus,
                lowStockProducts,
            },
        });
    }
    
}
