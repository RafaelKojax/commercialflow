import dotenv from 'dotenv';
import { app } from './app.js';
import { connectDatabase } from './config/database.js';

dotenv.config();

const PORT = process.env.PORT || 3333;

async function bootstrap() {
    await connectDatabase();
    app.listen(PORT, () => {
        console.log(`CommercialFlow API rodando na porta ${PORT}`);
    });
}

bootstrap();
