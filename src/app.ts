//import express, { ErrorRequestHandler } from 'express';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { productRoutes } from './routes/productRoutes.js';

export const app = express();

app.use(cors());
app.use(express.json());

// Endpoint de Health Check
app.get('/health', (req, res) => {
    const isDatabaseConnected = mongoose.connection.readyState === 1;

    res.status(isDatabaseConnected ? 200 : 503).json({
        status: isDatabaseConnected? 'health' : 'degraded',
        uptime: `${Math.floor(process.uptime())}s`,
        timestamp: new Date().toISOString(),
        database: isDatabaseConnected ? 'connected' : 'disconnected',
    });
});

app.use('/api/products', productRoutes);

// Tratamento global de exceções não capturadas
//const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Erro inesperado na API:', err);
    res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor.',
    });
});

//app.use(errorHandler);  