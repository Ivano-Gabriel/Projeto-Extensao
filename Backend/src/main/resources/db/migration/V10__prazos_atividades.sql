ALTER TABLE atividades ADD COLUMN prazo_entrega DATE;
CREATE INDEX idx_atividades_prazo ON atividades(prazo_entrega);
