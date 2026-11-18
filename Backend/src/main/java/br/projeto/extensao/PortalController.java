package br.projeto.extensao;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class PortalController {
    public record TurmaResumo(Long id,String codigo,String nome,Integer anoLetivo) {}
    public record AlunoResumo(Long id,String nome) {}
    public record NovaTurma(
        @NotBlank @Pattern(regexp="[A-Za-z0-9-]{1,32}") String codigo,
        @NotBlank @Size(max=100) String nome,
        @Min(2020) @Max(2100) int anoLetivo) {}
    public record NovaMatricula(@NotNull Long alunoId) {}
    public record NovoVinculo(
        @NotNull Long professorId,
        @NotBlank @Pattern(regexp="[A-Z_]{3,60}") String disciplina) {}

    private final JdbcTemplate jdbc;
    private final UsuarioRepository usuarios;
    public PortalController(JdbcTemplate jdbc,UsuarioRepository usuarios){
        this.jdbc=jdbc;
        this.usuarios=usuarios;
    }
    private Usuario atual(Authentication auth){
        if(auth==null)return negar(HttpStatus.UNAUTHORIZED);
        return usuarios.findByEmail(auth.getName()).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
    private static <T> T negar(HttpStatus status){
        throw new ResponseStatusException(status);
    }
    private Long escola(Usuario user){
        if(user.getEscolaId()==null||user.isAdministradorPlataforma())return negar(HttpStatus.FORBIDDEN);
        return user.getEscolaId();
    }
    private void apenasDirecao(Usuario user){
        if(user.getPapel()!=Papel.DIRECAO||user.isAdministradorPlataforma())negar(HttpStatus.FORBIDDEN);
    }
    private TurmaResumo verificarTurma(Long turmaId,Long escolaId){
        return jdbc.query("SELECT id,codigo,nome,ano_letivo FROM turmas WHERE id=? AND escola_id=?",
            (rs,i)->new TurmaResumo(rs.getLong("id"),rs.getString("codigo"),rs.getString("nome"),
                rs.getInt("ano_letivo")),turmaId,escolaId).stream().findFirst()
            .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Turma nao encontrada."));
    }
    private void verificarUsuario(Long id,Long escolaId,Papel papel){
        boolean encontrado=jdbc.queryForObject(
            "SELECT COUNT(*) FROM usuarios WHERE id=? AND escola_id=? AND papel=?",
            Integer.class,id,escolaId,papel.name())>0;
        if(!encontrado)negar(HttpStatus.FORBIDDEN);
    }
    @GetMapping("/portal/turmas")
    public ResponseEntity<List<TurmaResumo>> minhasTurmas(Authentication auth){
        Usuario user=atual(auth);
        Long escolaId=escola(user);
        String sql="SELECT t.id,t.codigo,t.nome,t.ano_letivo FROM turmas t ";
        List<TurmaResumo> turmas=switch(user.getPapel()){
            case ALUNO -> jdbc.query(sql+"JOIN matriculas m ON m.turma_id=t.id "+
                "WHERE t.escola_id=? AND m.aluno_id=? ORDER BY t.ano_letivo DESC,t.codigo",
                (rs,i)->lerTurma(rs),escolaId,user.getId());
            case PROFESSOR -> jdbc.query(sql+"JOIN vinculos_docentes v ON v.turma_id=t.id "+
                "WHERE t.escola_id=? AND v.professor_id=? GROUP BY t.id,t.codigo,t.nome,t.ano_letivo "+
                "ORDER BY t.ano_letivo DESC,t.codigo",
                (rs,i)->lerTurma(rs),escolaId,user.getId());
            case DIRECAO -> jdbc.query(sql+"WHERE t.escola_id=? ORDER BY t.ano_letivo DESC,t.codigo",
                (rs,i)->lerTurma(rs),escolaId);
        };
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(turmas);
    }
    private TurmaResumo lerTurma(java.sql.ResultSet rs)throws java.sql.SQLException{
        return new TurmaResumo(rs.getLong("id"),rs.getString("codigo"),rs.getString("nome"),rs.getInt("ano_letivo"));
    }
    @GetMapping("/portal/turmas/{turmaId}/alunos")
    public ResponseEntity<List<AlunoResumo>> alunosDaTurma(@PathVariable Long turmaId,Authentication auth){
        Usuario user=atual(auth);
        Long escolaId=escola(user);
        verificarTurma(turmaId,escolaId);
        if(user.getPapel()==Papel.ALUNO)negar(HttpStatus.FORBIDDEN);
        if(user.getPapel()==Papel.PROFESSOR){
            Integer vinculado=jdbc.queryForObject("SELECT COUNT(*) FROM vinculos_docentes WHERE turma_id=? AND professor_id=?",
                Integer.class,turmaId,user.getId());
            if(vinculado==0)negar(HttpStatus.FORBIDDEN);
        }
        List<AlunoResumo> alunos=jdbc.query("SELECT u.id,u.nome FROM usuarios u "+
            "JOIN matriculas m ON m.aluno_id=u.id JOIN turmas t ON t.id=m.turma_id "+
            "WHERE m.turma_id=? AND t.escola_id=? AND u.escola_id=? AND u.papel='ALUNO' ORDER BY u.nome",
            (rs,i)->new AlunoResumo(rs.getLong("id"),rs.getString("nome")),turmaId,escolaId,escolaId);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(alunos);
    }
    @Transactional
    @PostMapping("/gestao/turmas")
    public ResponseEntity<TurmaResumo> criarTurma(@Valid @RequestBody NovaTurma dados,Authentication auth){
        Usuario user=atual(auth);
        apenasDirecao(user);
        Long escolaId=escola(user);
        try {
            jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES (?,?,?,?)",
                escolaId,dados.codigo(),dados.nome().trim(),dados.anoLetivo());
            Long id=jdbc.queryForObject(
                "SELECT id FROM turmas WHERE escola_id=? AND codigo=? AND ano_letivo=?",
                Long.class,escolaId,dados.codigo(),dados.anoLetivo());
            return ResponseEntity.created(URI.create("/api/portal/turmas/"+id))
                .body(new TurmaResumo(id,dados.codigo(),dados.nome().trim(),dados.anoLetivo()));
        }catch(DataIntegrityViolationException ex){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Turma ja cadastrada.");
        }
    }
    @Transactional
    @PostMapping("/gestao/turmas/{turmaId}/matriculas")
    public ResponseEntity<Void> matricular(@PathVariable Long turmaId,
            @Valid @RequestBody NovaMatricula dados,Authentication auth){
        Usuario user=atual(auth);
        apenasDirecao(user);
        Long escolaId=escola(user);
        TurmaResumo turma=verificarTurma(turmaId,escolaId);
        verificarUsuario(dados.alunoId(),escolaId,Papel.ALUNO);
        try{
            jdbc.update("INSERT INTO matriculas(turma_id,aluno_id,ano_letivo) VALUES (?,?,?)",
                turmaId,dados.alunoId(),turma.anoLetivo());
            return ResponseEntity.status(HttpStatus.CREATED).build();
        }catch(DataIntegrityViolationException ex){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Aluno ja matriculado no ano informado.");
        }
    }
    @Transactional
    @PostMapping("/gestao/turmas/{turmaId}/professores")
    public ResponseEntity<Void> vincularProfessor(@PathVariable Long turmaId,
            @Valid @RequestBody NovoVinculo dados,Authentication auth){
        Usuario user=atual(auth);
        apenasDirecao(user);
        Long escolaId=escola(user);
        verificarTurma(turmaId,escolaId);
        verificarUsuario(dados.professorId(),escolaId,Papel.PROFESSOR);
        try{
            jdbc.update("INSERT INTO vinculos_docentes(turma_id,professor_id,disciplina) VALUES (?,?,?)",
                turmaId,dados.professorId(),dados.disciplina());
            return ResponseEntity.status(HttpStatus.CREATED).build();
        }catch(DataIntegrityViolationException ex){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Professor ja vinculado a disciplina.");
        }
    }
}
