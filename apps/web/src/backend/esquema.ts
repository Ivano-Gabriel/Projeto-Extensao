/** Mesmo SQL de apps/api/schema.sql (SQLite), mais a evolução prevista para login e turmas. */
export const esquemaSql = `-- Tabela em uso hoje (criada pela API Python na primeira execução)
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

-- Próxima etapa (login e vários alunos), ainda não criada
-- CREATE TABLE usuarios (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   nome TEXT NOT NULL,
--   email TEXT NOT NULL UNIQUE,
--   senha_hash TEXT NOT NULL,              -- nunca guardar a senha pura
--   papel TEXT NOT NULL CHECK (papel IN ('aluno', 'professor', 'direcao'))
-- );
-- CREATE TABLE conclusoes (                -- "concluído" passa a ser por aluno
--   usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
--   compromisso_id INTEGER NOT NULL REFERENCES compromissos(id) ON DELETE CASCADE,
--   concluido_em TEXT NOT NULL,
--   PRIMARY KEY (usuario_id, compromisso_id)
-- );
`
