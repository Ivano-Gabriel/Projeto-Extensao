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
@RequestMapping("/api")
public class DesempenhoController {
    public record DesempenhoAluno(Long alunoId,String alunoNome,int atividades,
                                  int respondidas,int acertos) {}
    public record MeuDesempenho(int atividades,int respondidas,int acertos) {}

    private final JdbcTemplate jdbc;
    private final UsuarioRepository usuarios;
    public DesempenhoController(JdbcTemplate jdbc,UsuarioRepository usuarios){
        this.jdbc=jdbc;
        this.usuarios=usuarios;
    }
    private Usuario usuario(Authentication auth){
        if(auth==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return usuarios.findByEmail(auth.getName()).orElseThrow(
            ()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
    private long escola(Usuario usuario){
        if(usuario.isAdministradorPlataforma()||usuario.getEscolaId()==null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return usuario.getEscolaId();
    }
    private boolean turmaDaEscola(long turmaId,long escolaId){
        return jdbc.queryForObject("SELECT COUNT(*) FROM turmas WHERE id=? AND escola_id=?",
            Integer.class,turmaId,escolaId)>0;
    }
    private void acessoDocente(Usuario usuario,long turmaId,long escolaId){
        if(!turmaDaEscola(turmaId,escolaId))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if(usuario.getPapel()==Papel.ALUNO)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if(usuario.getPapel()==Papel.PROFESSOR){
            if(jdbc.queryForObject("SELECT COUNT(*) FROM vinculos_docentes "+
                "WHERE turma_id=? AND professor_id=?",Integer.class,turmaId,usuario.getId())==0)
                throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }
    @GetMapping("/professor/turmas/{turmaId}/disciplinas")
    public ResponseEntity<List<String>> disciplinas(@PathVariable long turmaId,Authentication auth){
        Usuario professor=usuario(auth);
        if(professor.getPapel()!=Papel.PROFESSOR||professor.isAdministradorPlataforma())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        long escolaId=escola(professor);
        acessoDocente(professor,turmaId,escolaId);
        List<String> disciplinas=jdbc.query("SELECT DISTINCT v.disciplina FROM vinculos_docentes v "+
            "JOIN turmas t ON t.id=v.turma_id "+
            "WHERE t.id=? AND t.escola_id=? AND v.professor_id=? ORDER BY v.disciplina",
            (rs,i)->rs.getString("disciplina"),turmaId,escolaId,professor.getId());
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(disciplinas);
    }
    @GetMapping("/professor/turmas/{turmaId}/desempenho")
    public ResponseEntity<List<DesempenhoAluno>> desempenho(@PathVariable long turmaId,Authentication auth){
        Usuario professor=usuario(auth);
        long escolaId=escola(professor);
        acessoDocente(professor,turmaId,escolaId);
        String condicao=professor.getPapel()==Papel.PROFESSOR?
            "AND a.disciplina IN (SELECT v.disciplina FROM vinculos_docentes v "+
            "WHERE v.turma_id=? AND v.professor_id=?) ":"";
        String sql="SELECT u.id AS aluno_id,u.nome AS aluno_nome, "+
            "COUNT(DISTINCT a.id) AS atividades, "+
            "COUNT(DISTINCT CASE WHEN r.questao_id IS NOT NULL THEN a.id END) AS respondidas, "+
            "COALESCE(SUM(CASE WHEN r.opcao=q.correta THEN 1 ELSE 0 END),0) AS acertos "+
            "FROM matriculas m JOIN usuarios u ON u.id=m.aluno_id "+
            "JOIN turmas t ON t.id=m.turma_id "+
            "LEFT JOIN atividades a ON a.turma_id=t.id AND a.escola_id=? "+condicao+
            "LEFT JOIN questoes_atividade q ON q.atividade_id=a.id "+
            "LEFT JOIN respostas_atividade r ON r.questao_id=q.id AND r.aluno_id=u.id "+
            "WHERE t.id=? AND t.escola_id=? AND u.escola_id=? "+
            "GROUP BY u.id,u.nome ORDER BY u.nome";
        Object[] params=professor.getPapel()==Papel.PROFESSOR
            ?new Object[]{escolaId,turmaId,professor.getId(),turmaId,escolaId,escolaId}
            :new Object[]{escolaId,turmaId,escolaId,escolaId};
        List<DesempenhoAluno> lista=jdbc.query(sql,(rs,i)->new DesempenhoAluno(
            rs.getLong("aluno_id"),rs.getString("aluno_nome"),
            rs.getInt("atividades"),rs.getInt("respondidas"),rs.getInt("acertos")),params);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(lista);
    }
    @GetMapping("/portal/meu-desempenho")
    public ResponseEntity<MeuDesempenho> meuDesempenho(Authentication auth){
        Usuario aluno=usuario(auth);
        long escolaId=escola(aluno);
        if(aluno.getPapel()!=Papel.ALUNO)throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        MeuDesempenho dados=jdbc.queryForObject(
            "SELECT COUNT(DISTINCT a.id) AS atividades, "+
            "COUNT(DISTINCT CASE WHEN r.questao_id IS NOT NULL THEN a.id END) AS respondidas, "+
            "COALESCE(SUM(CASE WHEN r.opcao=q.correta THEN 1 ELSE 0 END),0) AS acertos "+
            "FROM matriculas m JOIN turmas t ON t.id=m.turma_id "+
            "JOIN atividades a ON a.turma_id=t.id AND a.escola_id=? "+
            "JOIN questoes_atividade q ON q.atividade_id=a.id "+
            "LEFT JOIN respostas_atividade r ON r.questao_id=q.id AND r.aluno_id=? "+
            "WHERE m.aluno_id=? AND t.escola_id=?",
            (rs,i)->new MeuDesempenho(rs.getInt("atividades"),rs.getInt("respondidas"),
                rs.getInt("acertos")),escolaId,aluno.getId(),aluno.getId(),escolaId);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(dados);
    }
}
