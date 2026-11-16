import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

export async function ensureAdminUser(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@commercialflow.com.br';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2026';

    const existingAdmin = await User.findOne({ email: adminEmail }).lean();
    if (existingAdmin) {
        return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await User.create({
        name: 'Administrator CommercialFlow',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
    });

    console.log(`Usuário administrador inicializando: ${adminEmail}`);
}

