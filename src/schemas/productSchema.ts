import { validate, z } from  'zod';

export const createProductSchema = z.object({
    sku: z
        .string()
        .min(2, 'SKU deve ter pelo menos 2 caracteres')
        .max(30)
        .transform((val) => val.trim().toUpperCase()),
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracterers').max(120).trim(),
    description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(2000),
    category: z.string().min(2, 'Categoria obrigatória').max(60).trim(),
    price: z.number().nonnegative('Preço não pode ser negativo'),
    wholesalePrice: z.number().nonnegative().optional(),
    minOrderQuantity: z.number().int().min(0).default(0),
    stockQuantity: z.number().min(0).default(0),
    imageUrl: z.string().url('URL de imagem inválida').or(z.literal('')).default(''),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    category: z.string().trim().optional(),
    search: z.string().trim().optional(),
});

