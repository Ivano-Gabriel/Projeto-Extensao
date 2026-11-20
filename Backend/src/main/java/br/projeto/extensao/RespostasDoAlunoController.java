package br.projeto.extensao;

import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/portal")
public class RespostasDoAlunoController {
    public record RespostaSalva(Long atividadeId,int opcao,boolean acertou,String explicacao) {}
    private final JdbcTemplate jdbc;
    private final UsuarioRepository usuarios;
    public RespostasDoAlunoController(JdbcTemplate jdbc,UsuarioRepository usuarios){
        this.jdbc=jdbc;this.usuarios=usuarios;
    }
    @GetMapping("/minhas-respostas")
    public ResponseEntity<List<RespostaSalva>> listar(Authentication auth){
        if(auth==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Usuario aluno=usuarios.findByEmail(auth.getName())
            .orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if(aluno.getPapel()!=Papel.ALUNO||aluno.isAdministradorPlataforma()||aluno.getEscolaId()==null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        List<RespostaSalva> respostas=jdbc.query(
            "SELECT a.id AS atividade_id,r.opcao,q.correta,q.explicacao FROM respostas_atividade r "+
            "JOIN questoes_atividade q ON q.id=r.questao_id "+
            "JOIN atividades a ON a.id=q.atividade_id "+
            "WHERE r.aluno_id=? AND a.escola_id=? "+
            "ORDER BY r.respondido_em DESC,a.id DESC LIMIT 200",
            (rs,i)->new RespostaSalva(rs.getLong("atividade_id"),rs.getInt("opcao"),
                rs.getInt("opcao")==rs.getInt("correta"),rs.getString("explicacao")),
            aluno.getId(),aluno.getEscolaId());
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(respostas);
    }
}
