import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

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