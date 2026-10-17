-- Banco do Projeto de Extensão (SQLite). Criado automaticamente na primeira execução da API.
CREATE TABLE IF NOT EXISTS compromissos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo       TEXT NOT NULL CHECK (tipo IN ('Prova', 'Trabalho', 'Aviso')),
  titulo     TEXT NOT NULL,
  disciplina TEXT NOT NULL,
  quando     TEXT NOT NULL,                 -- data e hora ISO 8601 em UTC
  status     TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido')),
  criado_em  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_compromissos_quando ON compromissos (quando);
