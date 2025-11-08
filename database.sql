-- ===========================================
-- BANCO DE DADOS DE AGENDAMENTOS (PostgreSQL)
-- ===========================================

CREATE DATABASE agendamentos_salao;
\c agendamentos_salao;

-- ===========================
--  TABELA: FUNCIONÁRIAS
-- ===========================
CREATE TABLE funcionarias (
                              id_funcionaria SERIAL PRIMARY KEY,
                              nome VARCHAR(100) NOT NULL,
                              ativo BOOLEAN DEFAULT TRUE
);

-- ===========================
--  TABELA: SERVIÇOS
-- ===========================
CREATE TABLE servicos (
                          id_servico SERIAL PRIMARY KEY,
                          id_funcionaria INT NOT NULL REFERENCES funcionarias(id_funcionaria) ON DELETE CASCADE,
                          nome_servico VARCHAR(100) NOT NULL,
                          duracao_minutos INT DEFAULT 60,
                          preco NUMERIC(10,2) DEFAULT 0.00
);

-- ===========================
--  TABELA: HORÁRIOS DE FUNCIONAMENTO
-- ===========================
CREATE TYPE dia_semana_enum AS ENUM (
    'domingo','segunda','terça','quarta','quinta','sexta','sábado'
);

CREATE TABLE horarios_funcionamento (
                                        id SERIAL PRIMARY KEY,
                                        dia_semana dia_semana_enum NOT NULL,
                                        hora_abertura TIME NOT NULL,
                                        hora_fechamento TIME NOT NULL
);

-- Inserindo horários padrão
INSERT INTO horarios_funcionamento (dia_semana, hora_abertura, hora_fechamento) VALUES
                                                                                    ('domingo', '09:00', '14:00'),
                                                                                    ('segunda', '09:00', '18:00'),
                                                                                    ('terça', '09:00', '18:00'),
                                                                                    ('quarta', '09:00', '18:00'),
                                                                                    ('quinta', '09:00', '18:00'),
                                                                                    ('sexta', '09:00', '18:00'),
                                                                                    ('sábado', '09:00', '18:00');

-- ===========================
--  TABELA: AGENDAMENTOS
-- ===========================
CREATE TYPE status_agendamento AS ENUM ('pendente','confirmado','cancelado');

CREATE TABLE agendamentos (
                              id_agendamento SERIAL PRIMARY KEY,
                              id_funcionaria INT NOT NULL REFERENCES funcionarias(id_funcionaria) ON DELETE CASCADE,
                              id_servico INT NOT NULL REFERENCES servicos(id_servico) ON DELETE CASCADE,
                              nome_cliente VARCHAR(120) NOT NULL,
                              data_agendamento DATE NOT NULL,
                              hora_agendamento TIME NOT NULL,
                              status status_agendamento DEFAULT 'pendente',
                              criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              CONSTRAINT unico_horario_funcionaria UNIQUE (id_funcionaria, data_agendamento, hora_agendamento)
);

-- ===========================
--  DADOS INICIAIS
-- ===========================
INSERT INTO funcionarias (nome) VALUES
                                    ('Rosiléia Ramos'),
                                    ('Meiriane Ortega');

INSERT INTO servicos (id_funcionaria, nome_servico) VALUES
-- Rosiléia Ramos
(1, 'Corte'),
(1, 'Orçamento Tricologista'),
(1, 'Orçamento Geral'),
(1, 'Pacote Casamento'),
(1, 'Manicure'),
(1, 'Pedicure'),
(1, 'Maquiagem'),
(1, 'Promoção Pacote Manicure e Pedicure'),
(1, 'Promoção Corte + Hidratação'),
(1, 'Promoção Lavagem + Escova'),

-- Meiriane Ortega
(2, 'Massagem Relaxante'),
(2, 'Depilação Íntima'),
(2, 'Limpeza Facial'),
(2, 'Depilação Facial'),
(2, 'Drenagem Linfática');
