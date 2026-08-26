// backend/cron/notificador.js
const cron = require('node-cron');
const supabase = require('../config/database');

// Expressão CRON: '* * * * *' significa "Executar a cada minuto"
cron.schedule('* * * * *', async () => {
    try {
        const agora = new Date();

        // 1. Procurar agendamentos confirmados
        const { data: agendamentos, error } = await supabase
            .from('agendamentos')
            .select(`
                id,
                status,
                usuarios ( nome, email, telefone ),
                disponibilidades!inner ( data_hora, cursos ( nome ) )
            `)
            .eq('status', 'agendado');

        if (error) throw error;

        if (!agendamentos || agendamentos.length === 0) {
            return; // Nada a fazer
        }

        // 2. Disparar os avisos com janela de tolerância
        agendamentos.forEach(ag => {
            if (!ag.disponibilidades || !ag.disponibilidades.data_hora) {
                return;
            }

            const dataCurso = new Date(ag.disponibilidades.data_hora);
            const diferencaEmMinutos = Math.round((dataCurso - agora) / (1000 * 60));

            // Janela de tolerância (± 2 minutos) para aviso de 24h (1440 min) e 3h (180 min)
            const is24Horas = Math.abs(diferencaEmMinutos - 1440) <= 2;
            const is3Horas = Math.abs(diferencaEmMinutos - 180) <= 2;

            if (is24Horas || is3Horas) {
                const curso = ag.disponibilidades.cursos?.nome || 'Curso de Qualificação';
                const cliente = ag.usuarios?.nome || 'Modelo';
                const horaFormatada = dataCurso.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

                console.log(`\n📧 [NOTIFICAÇÃO DISPARADA] Para: ${ag.usuarios?.email || 'Sem e-mail'}`);
                console.log(`Olá, ${cliente}! Lembramos que o seu agendamento para ${curso} é em ${horaFormatada}.`);
                console.log(`Em caso de imprevistos, lembre-se de cancelar na plataforma com 2 horas de antecedência.\n`);
            }
        });

    } catch (error) {
        console.error('❌ [CRON ERRO] Falha ao processar notificações:', error.message);
    }
});

console.log('⏳ Motor de Notificações (CRON) ativado e a aguardar...');