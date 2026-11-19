package br.projeto.extensao;

import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/gestao")
public class VinculosController {
    public record Vinculo(Long professorId,String nome,String disciplina) {}
    private final JdbcTemplate jdbc;
    private final UsuarioRepository usuarios;
    public VinculosController(JdbcTemplate jdbc,UsuarioRepository usuarios){
        this.jdbc=jdbc;this.usuarios=usuarios;
    }
    private Usuario direcao(Authentication auth){
        if(auth==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Usuario user=usuarios.findByEmail(auth.getName())
            .orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if(user.isAdministradorPlataforma()||user.getEscolaId()==null||user.getPapel()!=Papel.DIRECAO)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return user;
    }
    private void escopo(Long turmaId,Usuario user){
        if(jdbc.queryForObject("SELECT COUNT(*) FROM turmas WHERE id=? AND escola_id=?",
            Integer.class,turmaId,user.getEscolaId())==0)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    @GetMapping("/turmas/{turmaId}/vinculos")
    public ResponseEntity<List<Vinculo>> listar(@PathVariable Long turmaId,Authentication auth){
        Usuario user=direcao(auth);
        escopo(turmaId,user);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(jdbc.query(
            "SELECT u.id AS professor_id,u.nome,v.disciplina FROM vinculos_docentes v "+
            "JOIN usuarios u ON u.id=v.professor_id JOIN turmas t ON t.id=v.turma_id "+
            "WHERE t.id=? AND t.escola_id=? AND u.escola_id=? ORDER BY u.nome,v.disciplina",
            (rs,i)->new Vinculo(rs.getLong("professor_id"),rs.getString("nome"),
                rs.getString("disciplina")),turmaId,user.getEscolaId(),user.getEscolaId()));
    }
    @Transactional
    @DeleteMapping("/turmas/{turmaId}/professores/{professorId}/disciplinas/{disciplina}")
    public ResponseEntity<Void> desvincular(@PathVariable Long turmaId,@PathVariable Long professorId,
                                             @PathVariable String disciplina,Authentication auth){
        Usuario user=direcao(auth);
        escopo(turmaId,user);
        if(!disciplina.matches("[A-Z_]{3,60}"))throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        int removidos=jdbc.update("DELETE FROM vinculos_docentes WHERE turma_id=? AND professor_id=? "+
            "AND disciplina=? AND EXISTS(SELECT 1 FROM usuarios WHERE id=? AND escola_id=?)",
            turmaId,professorId,disciplina,professorId,user.getEscolaId());
        if(removidos==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return ResponseEntity.noContent().build();
    }
}
