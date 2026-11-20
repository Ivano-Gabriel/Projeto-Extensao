package br.projeto.extensao;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AuditoriaService {
    private final JdbcTemplate jdbc;
    public AuditoriaService(JdbcTemplate jdbc) {
        this.jdbc=jdbc;
    }

    public void registrar(Long escolaId, Long atorId, String acao, String entidade, Long entidadeId) {
        jdbc.update("INSERT INTO auditoria_escolar(escola_id,ator_id,acao,entidade,entidade_id) VALUES(?,?,?,?,?)",
            escolaId,atorId,acao,entidade,entidadeId);
    }
}
