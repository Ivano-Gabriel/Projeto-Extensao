CREATE TABLE ia_uso_diario (
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    dia_utc DATE NOT NULL,
    requisicoes INTEGER NOT NULL DEFAULT 0 CHECK (requisicoes >= 0),
    PRIMARY KEY (usuario_id, dia_utc)
);
