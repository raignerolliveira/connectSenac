// backend/config/database.js
const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_KEY } = require('./env');

// Criando a instância de conexão com o banco de dados
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Conectado ao Supabase (PostgreSQL) com sucesso!');

// Exportamos a instância para ser usada pelos Controllers
module.exports = supabase;