import mongoose, { Schema, Document } from 'mongoose';

export type OrderStatus = 'PENDING' | 'IN_SEPARATION' | 'APPROVED' | 'DISPATCHED' | 'CANCELLED';

export interface IOrderItem {
    productId: mongoose.Types.ObjectId;
    sku: string;
    name: string;
    quantity: number;
    unityPrice: number;
    totalPrice: number;
}

export interface IOrder extends Document {
    orderNumber: string;
    companyName: string;
    cnpj: string;
    contactEmail: string;
    contactPhone: string;
    items: IOrderItem [];
    totalAmount: number;
    status: OrderStatus;
    notes?: string;
    createdAt: Date;
    updateAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem> ({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unityPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0},
},
{ _id: false }
);

const OrderSchema = new Schema<IOrder>({
    orderNumber: { type: String, required: true, unique: true },
    companyName: { type: String, required: true, trim: true },
    cnpj:  { type: String, required: true, trim: true },
    contactEmail:  { type: String, required: true, trim: true, lowercase: true },
    contactPhone: { type: String, required: true, trim: true },
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ['PENDING', 'IN_SEPARATION', 'APPROVED', 'DISPATCHED', 'CANCELLED'],
        default: 'PENDING',
    },
    notes: { type: String, default: '' },
},
{ timestamps: true }
);