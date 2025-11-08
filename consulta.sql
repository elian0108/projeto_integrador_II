--Lista Horarios
WITH dados_dia AS (
    SELECT
        h.hora_abertura, h.hora_fechamento
    FROM horarios_funcionamento h
    WHERE h.dia_semana = (
        CASE EXTRACT(DOW FROM DATE '2025-10-30')
            WHEN 0 THEN 'domingo'
            WHEN 1 THEN 'segunda'
            WHEN 2 THEN 'terça'
            WHEN 3 THEN 'quarta'
            WHEN 4 THEN 'quinta'
            WHEN 5 THEN 'sexta'
            WHEN 6 THEN 'sábado'
            END
        )
),
     horas AS (
         SELECT generate_series(
                        (SELECT hora_abertura FROM dados_dia),
                        (SELECT hora_fechamento FROM dados_dia) - INTERVAL '1 hour',
                        INTERVAL '1 hour'
                ) AS horario
     )
SELECT
    to_char(h.horario, 'HH24:MI') AS horario,
    CASE WHEN a.id_agendamento IS NULL THEN 'disponível' ELSE 'indisponível' END AS status
FROM horas h
         LEFT JOIN agendamentos a
                   ON a.id_funcionaria = 1  -- altere o ID da funcionária aqui
                       AND a.data_agendamento = DATE '2025-10-30'
                       AND a.hora_agendamento = h.horario
ORDER BY h.horario;





-- Agendamento

INSERT INTO agendamentos (id_funcionaria, id_servico, nome_cliente, data_agendamento, hora_agendamento, status)
VALUES (1, 1, 'Maria', '2025-10-30', '09:00', 'confirmado');


