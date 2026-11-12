import mongoose from 'mongoose';

export async function connectDatabase(): Promise<void> {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/commercialflow';

    try {
        await mongoose.connect(mongoUri, {
            maxPoolSize: 10,                // Mantém até 10 conexões ativas simultaneamente 
            serverSelectionTimeoutMS: 5000, // Tempo limite de espera para selecionar um servidor (5 segundos)
        });
        
        console.log('MongoDB conectado com sucesso.');
    } catch (error) {
        console.error('Falha ao conectar no MongoDB:', error);
        process.exit(1);
    }
}

