import { validate, z } from  'zod';
import mongoose from 'mongoose';

const objectIdSchema = z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: 'ID de produto inválido.',
    });

export const createOrderSchema = z.object({
    companyName: z
        .string()
        .min(2, 'Razão social ou nome da empresa é obrigatório.')
        .max(150)
        .trim(),
    cnpj: z
        .string()
        .transform((val) => val.replace(/\D/g, ''))
        .refine((val) => val.length === 14, {
            message: 'CNPJ deve conter exatamente 14 dígitos numéricos.',
        }),
    contactEmail: z.string().email('E-mail corporativo inválido.').trim().toLowerCase(),
    contactPhone: z
        .string()
        .min(10, 'Telefone de contato deve ter DDD + número.')
        .max(20)
        .trim(),
    items: z
        .array(
            z.object({
                productId: objectIdSchema,
                quantity: z.number().int().min(1, 'A quantidade mínima por item é 1.'),
            })
        )
        .min(1, 'O pedido deve conter pelo menos 1 item.'),
    notes: z.string().max(1000).optional(),
});

export const updateOrderStatusSchema = z.object({
    status: z.enum([
        'PENDING',
        'IN_SEPARATION',
        'APPROVED',
        'DISPATCHED',
        'CANCELLED',
    ]),
});

export const listOrderQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    status: z
        .enum(['PENDING', 'IN_SEPARATION', 'APPROVED', 'DISPATCHED', 'CANCELLED'])
        .optional(),
});