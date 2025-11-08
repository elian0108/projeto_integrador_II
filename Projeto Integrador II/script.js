document.addEventListener('DOMContentLoaded', () => {
    const formAgendamento = document.getElementById('form-agendamento');
    const campoServico = document.getElementById('servico');
    const campoData = document.getElementById('data');
    const campoHorario = document.getElementById('horario');
    const API_BASE = 'http://localhost:3000';

    // Substitua estes números pelos telefones das proprietárias
    const numeroRosilea = '5516997925375'; // Exemplo: Rosiléa
    const numeroMeiriane = '5516997058426'; // Exemplo: Meiriane

    async function carregarHorariosDisponiveis() {
        const servico = campoServico.value;
        const data = campoData.value; // YYYY-MM-DD
        if (!data) return;

        try {
            const url = new URL(`${API_BASE}/api/horarios-disponiveis`);
            url.searchParams.set('data', data);
            if (servico) url.searchParams.set('servico', servico);
            const resp = await fetch(url.toString());
            const json = await resp.json();

            // Preencher select apenas com horários livres
            campoHorario.innerHTML = '<option value="">-- selecione --</option>';
            (json.horarios || []).forEach(h => {
                const opt = document.createElement('option');
                opt.value = h;
                opt.textContent = h;
                campoHorario.appendChild(opt);
            });
        } catch (e) {
            console.error(e);
        }
    }

    campoData.addEventListener('change', carregarHorariosDisponiveis);
    campoServico.addEventListener('change', carregarHorariosDisponiveis);

    formAgendamento.addEventListener('submit', async (event) => {
        event.preventDefault();

        // 1. Coletar os dados do formulário
        const nome = document.getElementById('nome').value;
        const servico = document.getElementById('servico').value;
        const dataInput = document.getElementById('data').value;
        const horario = document.getElementById('horario').value;

        let numeroWhatsapp;

        // 2. Definir qual número de WhatsApp será usado com base no serviço
        switch (servico) {
            case 'Corte':
            case 'Orçamento Tricologista':
            case 'Orçamento Geral':
            case 'Pacote Casamento':
            case 'Manicure':
            case 'Pedicure':
            case 'Promoção Pacote Manicure e Pedicure':
            case 'Promoção Corte + Hidratação':
            case 'Promoção Lavagem + Escova':
            case 'Maquiagem':
                numeroWhatsapp = numeroRosilea;
                break;
            case 'Massagem Relaxante':
            case 'Depilação Íntima':
            case 'Limpeza Facial':
            case 'Depilação Facial':
            case 'Drenagem Linfática':
                numeroWhatsapp = numeroMeiriane;
                break;
            default:
                // Caso não encontre o serviço, usa um número padrão e alerta o usuário
                numeroWhatsapp = numeroRosilea;
                alert('Serviço inválido. Encaminhando para o número da Rosiléa.');
                break;
        }

        // 3. Formatar a data para o padrão brasileiro (dd/mm/aaaa)
        const partesData = dataInput.split('-');
        const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

        // 4. Enviar para a API (salvar agendamento simples)
        try {
            const resp = await fetch(`${API_BASE}/api/agendamentos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome_cliente: nome,
                    servico: servico,
                    data_agendamento: dataInput,
                    hora_agendamento: horario
                })
            });
            const json = await resp.json();
            if (resp.ok) {
                alert('Agendamento registrado! ID: ' + json.id_agendamento);
                // Abrir WhatsApp (opcional)
                const mensagem = `Olá, gostaria de confirmar meu agendamento!\nNome: ${nome}\nServiço: ${servico}\nData: ${dataFormatada}\nHorário: ${horario}`;
                const mensagemCodificada = encodeURIComponent(mensagem);
                const urlWhatsapp = `https://api.whatsapp.com/send?phone=${numeroWhatsapp}&text=${mensagemCodificada}`;
                window.open(urlWhatsapp, '_blank');
            } else {
                alert(json.error || 'Falha ao agendar');
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao conectar à API');
        }
    });
});