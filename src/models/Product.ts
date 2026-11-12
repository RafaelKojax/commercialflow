import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    sku: string;
    name: string;
    description: string;
    category: string;
    price: number;
    wholesalePrice?: number;
    minOrderQuantity: number;
    stockQuantity: number;
    imageUrl: string;
    isActive: boolean;
    createdAt: Date;
    updateAt: Date;
}

const ProductSchema = new Schema<IProduct>(
    {
        sku: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        wholesalePrice: {
            type: Number,
            min: 0
        },
        minOrderQuantity: {
            type: Number,
            default: 1,
            min: 1
        },
        stockQuantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        },
    },
    { timestamps: true }
);

//Índices compostos e de texto para buscas rápidas sem onerar a memória
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ name: 'text', description: 'text', sku: 'text' });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);