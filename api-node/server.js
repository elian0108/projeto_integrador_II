import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: +(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'admin',
    password: process.env.PGPASSWORD || 'admin',
    database: process.env.PGDATABASE || 'agendamentos_salao',
});

const app = express();
app.use(cors());
app.use(express.json());

const diaSemanaPt = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];

function gerarSlots(horaAbertura, horaFechamento, intervaloMin = 30) {
    const slots = [];
    const [abH, abM] = horaAbertura.split(':').map(Number);
    const [feH, feM] = horaFechamento.split(':').map(Number);
    const inicio = new Date(2000, 0, 1, abH, abM);
    const fim = new Date(2000, 0, 1, feH, feM);

    for (let t = new Date(inicio); t <= fim; t.setMinutes(t.getMinutes() + intervaloMin)) {
        const hh = String(t.getHours()).padStart(2, '0');
        const mm = String(t.getMinutes()).padStart(2, '0');
        slots.push(`${hh}:${mm}`);
    }
    return slots;
}

// GET /api/horarios-disponiveis?data=YYYY-MM-DD&servico=Nome
app.get('/api/horarios-disponiveis', async (req, res) => {
    try {
        const { data, servico } = req.query;
        if (!data) return res.status(400).json({ error: "Parâmetro 'data' é obrigatório" });

        const dt = new Date(data);
        if (isNaN(dt)) return res.status(400).json({ error: 'Data inválida (use YYYY-MM-DD)' });
        const nomeDia = diaSemanaPt[dt.getDay()];

        let abertura = '09:00';
        let fechamento = '18:00';
        try {
            const hf = await pool.query(
                'SELECT hora_abertura, hora_fechamento FROM horarios_funcionamento WHERE dia_semana = $1 LIMIT 1',
                [nomeDia]
            );
            abertura = hf.rows[0]?.hora_abertura || abertura;
            fechamento = hf.rows[0]?.hora_fechamento || fechamento;
        } catch (e) {
            console.warn('Falha ao consultar horarios_funcionamento, usando padrão 09:00-18:00:', e.message);
        }

        let funcionariaId = null;
        let servicoId = null;
        if (servico) {
            try {
                const s = await pool.query(
                    'SELECT s.id_servico, s.id_funcionaria FROM servicos s WHERE s.nome_servico = $1 LIMIT 1',
                    [servico]
                );
                if (s.rows[0]) {
                    servicoId = s.rows[0].id_servico;
                    funcionariaId = s.rows[0].id_funcionaria;
                }
            } catch (e) {
                console.warn('Falha ao consultar servicos, prosseguindo sem filtragem por funcionária:', e.message);
            }
        }

        let ocupados = new Set();
        try {
            const params = [data];
            let q = 'SELECT hora_agendamento FROM agendamentos WHERE data_agendamento = $1';
            if (funcionariaId) {
                q += ' AND id_funcionaria = $2';
                params.push(funcionariaId);
            }
            const ocup = await pool.query(q, params);
            ocupados = new Set(ocup.rows.map(r => r.hora_agendamento.slice(0,5)));
        } catch (e) {
            console.warn('Falha ao consultar agendamentos, assumindo nenhum ocupado:', e.message);
        }

        const todosSlots = gerarSlots(abertura, fechamento, 30);
        const livres = todosSlots.filter(h => !ocupados.has(h));

        res.json({ data, servico: servico || null, horarios: livres });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao consultar horários' });
    }
});

// POST /api/agendamentos { nome_cliente, servico, data_agendamento, hora_agendamento }
app.post('/api/agendamentos', async (req, res) => {
    try {
        const { nome_cliente, servico, data_agendamento, hora_agendamento } = req.body;
        if (!nome_cliente || !servico || !data_agendamento || !hora_agendamento) {
            return res.status(400).json({ error: 'Campos obrigatórios: nome_cliente, servico, data_agendamento, hora_agendamento' });
        }

        const s = await pool.query(
            'SELECT s.id_servico, s.id_funcionaria FROM servicos s WHERE s.nome_servico = $1 LIMIT 1',
            [servico]
        );
        if (!s.rows[0]) return res.status(404).json({ error: 'Serviço não encontrado' });
        const id_servico = s.rows[0].id_servico;
        const id_funcionaria = s.rows[0].id_funcionaria;

        try {
            const insert = await pool.query(
                `INSERT INTO agendamentos (id_funcionaria, id_servico, nome_cliente, data_agendamento, hora_agendamento, status)
         VALUES ($1, $2, $3, $4, $5, 'pendente') RETURNING id_agendamento`,
                [id_funcionaria, id_servico, nome_cliente, data_agendamento, hora_agendamento]
            );
            res.status(201).json({ id_agendamento: insert.rows[0].id_agendamento });
        } catch (e) {
            if (String(e.message).includes('unico_horario_funcionaria')) {
                return res.status(409).json({ error: 'Horário já ocupado para a funcionária' });
            }
            throw e;
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar agendamento' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API ouvindo em http://localhost:${PORT}`);
});