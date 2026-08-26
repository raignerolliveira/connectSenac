// backend/config/env.js
require('dotenv').config();

const obrigatorias = ['SUPABASE_URL', 'SUPABASE_KEY', 'JWT_SECRET'];
for (const chave of obrigatorias) {
    if (!process.env[chave]) {
        console.error(`❌ [FATAL] Variável de ambiente obrigatória não definida: ${chave}`);
        process.exit(1);
    }
}

module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
    NODE_ENV: process.env.NODE_ENV || 'development'
};
