import { PrismaClient } from '@prisma/client';

// Uygulama boyunca tek bir veritabanı bağlantısı kullanılır.
export const prisma = new PrismaClient();
