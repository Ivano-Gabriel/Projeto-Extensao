package br.projeto.extensao;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.net.URI;
import java.sql.PreparedStatement;
import java.time.LocalDate;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class AulasController {
    public record NovaAula(
        @NotNull Long turmaId,
        @NotBlank @Pattern(regexp="[A-Z_]{3,60}") String disciplina,
        @NotNull LocalDate data,
        @Min(1) @Max(8) int ordem,
        @NotBlank @Size(max=160) String tema) {}
    public record AulaResumo(Long id,Long turmaId,String disciplina,String data,int ordem,String tema) {}
    public record NovaPresenca(@NotNull Long alunoId,@NotNull Boolean presente) {}
    public record PresencaRegistrada(Long alunoId, boolean presente) {}
    public record MinhaFrequencia(int aulasRegistradas,int registrosDePresenca,int presencas,int faltas) {}
    private final JdbcTemplate jdbc;
    private final UsuarioRepository usuarios;
    public AulasController(JdbcTemplate jdbc,UsuarioRepository usuarios){
        this.jdbc=jdbc;this.usuarios=usuarios;
    }
    private Usuario atual(Authentication auth){
        if(auth==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return usuarios.findByEmail(auth.getName())
            .orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
    private long escola(Usuario user){
        if(user.isAdministradorPlataforma()||user.getEscolaId()==null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return user.getEscolaId();
    }
    private boolean docenteVinculado(long turmaId,long escolaId,long professorId,String disciplina){
        return jdbc.queryForObject(
            "SELECT COUNT(*) FROM vinculos_docentes v JOIN turmas t ON t.id=v.turma_id "+
            "WHERE t.id=? AND t.escola_id=? AND v.professor_id=? AND v.disciplina=?",
            Integer.class,turmaId,escolaId,professorId,disciplina)>0;
    }
    private boolean turmaNaEscola(long turmaId,long escolaId){
        return jdbc.queryForObject("SELECT COUNT(*) FROM turmas WHERE id=? AND escola_id=?",
            Integer.class,turmaId,escolaId)>0;
    }
    @Transactional
    @PostMapping("/professor/aulas")
    public ResponseEntity<AulaResumo> criar(@Valid @RequestBody NovaAula dados,Authentication auth){
        Usuario professor=atual(auth);
        long escolaId=escola(professor);
        if(professor.getPapel()!=Papel.PROFESSOR||
            !docenteVinculado(dados.turmaId(),escolaId,professor.getId(),dados.disciplina()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        GeneratedKeyHolder holder=new GeneratedKeyHolder();
        try{
            jdbc.update(conexao->{
                PreparedStatement ps=conexao.prepareStatement(
                    "INSERT INTO aulas_registradas(escola_id,turma_id,professor_id,disciplina,data_aula,ordem_aula,tema) "+
                    "VALUES(?,?,?,?,?,?,?)",new String[]{"id"});
                ps.setObject(1,escolaId);
                ps.setObject(2,dados.turmaId());
                ps.setObject(3,professor.getId());
                ps.setString(4,dados.disciplina());
                ps.setObject(5,dados.data());
                ps.setInt(6,dados.ordem());
                ps.setString(7,dados.tema().trim());
                return ps;
            },holder);
        }catch(DataIntegrityViolationException e){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Aula já registrada para este horário.");
        }
        Long id=holder.getKey().longValue();
        AulaResumo criada=new AulaResumo(id,dados.turmaId(),dados.disciplina(),
            dados.data().toString(),dados.ordem(),dados.tema().trim());
        return ResponseEntity.created(URI.create("/api/professor/aulas/"+id)).body(criada);
    }
    private List<AulaResumo> listarAulas(long turmaId,long escolaId,Usuario user){
        String filtro=user.getPapel()==Papel.PROFESSOR?
            " AND a.disciplina IN (SELECT v.disciplina FROM vinculos_docentes v "+
            "WHERE v.turma_id=a.turma_id AND v.professor_id=?)":"";
        String sql="SELECT a.id,a.turma_id,a.disciplina,a.data_aula,a.ordem_aula,a.tema "+
            "FROM aulas_registradas a WHERE a.turma_id=? AND a.escola_id=?"+filtro+
            " ORDER BY a.data_aula DESC,a.ordem_aula DESC,a.id DESC LIMIT 80";
        Object[] args=user.getPapel()==Papel.PROFESSOR
            ?new Object[]{turmaId,escolaId,user.getId()}:new Object[]{turmaId,escolaId};
        return jdbc.query(sql,(rs,i)->new AulaResumo(rs.getLong("id"),rs.getLong("turma_id"),
            rs.getString("disciplina"),rs.getDate("data_aula").toLocalDate().toString(),
            rs.getInt("ordem_aula"),rs.getString("tema")),args);
    }
    @GetMapping("/professor/turmas/{turmaId}/aulas")
    public ResponseEntity<List<AulaResumo>> listar(@PathVariable Long turmaId,Authentication auth){
        Usuario user=atual(auth);
        long escolaId=escola(user);
        if(user.getPapel()==Papel.ALUNO)throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if(!turmaNaEscola(turmaId,escolaId))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if(user.getPapel()==Papel.PROFESSOR&&jdbc.queryForObject(
            "SELECT COUNT(*) FROM vinculos_docentes WHERE turma_id=? AND professor_id=?",
            Integer.class,turmaId,user.getId())==0)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(listarAulas(turmaId,escolaId,user));
    }
    @GetMapping("/professor/aulas/{aulaId}/presencas")
    public ResponseEntity<List<PresencaRegistrada>> presencasRegistradas(
            @PathVariable Long aulaId,Authentication auth){
        Usuario professor=atual(auth);
        long escolaId=escola(professor);
        if(professor.getPapel()!=Papel.PROFESSOR)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        Integer permitido=jdbc.queryForObject(
            "SELECT COUNT(*) FROM aulas_registradas a JOIN vinculos_docentes v "+
            "ON v.turma_id=a.turma_id AND v.disciplina=a.disciplina "+
            "WHERE a.id=? AND a.escola_id=? AND v.professor_id=?",
            Integer.class,aulaId,escolaId,professor.getId());
        if(permitido==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        List<PresencaRegistrada> registros=jdbc.query(
            "SELECT aluno_id,presente FROM presencas_aula WHERE aula_id=? ORDER BY aluno_id",
            (rs,i)->new PresencaRegistrada(rs.getLong("aluno_id"),rs.getBoolean("presente")),aulaId);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(registros);
    }
    @Transactional
    @PostMapping("/professor/aulas/{aulaId}/presencas")
    public ResponseEntity<Void> registrar(@PathVariable Long aulaId,@Valid @RequestBody NovaPresenca dados,
                                            Authentication auth){
        Usuario professor=atual(auth);
        long escolaId=escola(professor);
        if(professor.getPapel()!=Papel.PROFESSOR)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        Integer permitido=jdbc.queryForObject(
            "SELECT COUNT(*) FROM aulas_registradas a JOIN vinculos_docentes v "+
            "ON v.turma_id=a.turma_id AND v.disciplina=a.disciplina "+
            "JOIN matriculas m ON m.turma_id=a.turma_id "+
            "JOIN usuarios u ON u.id=m.aluno_id "+
            "WHERE a.id=? AND a.escola_id=? AND v.professor_id=? "+
            "AND m.aluno_id=? AND u.escola_id=? AND u.papel='ALUNO'",
            Integer.class,aulaId,escolaId,professor.getId(),dados.alunoId(),escolaId);
        if(permitido==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        try{
            jdbc.update("INSERT INTO presencas_aula(aula_id,aluno_id,presente) VALUES(?,?,?)",
                aulaId,dados.alunoId(),dados.presente());
        }catch(DataIntegrityViolationException e){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Presença já registrada.");
        }
        return ResponseEntity.created(URI.create("/api/portal/minha-frequencia")).build();
    }
    @GetMapping("/portal/minha-frequencia")
    public ResponseEntity<MinhaFrequencia> minhaFrequencia(Authentication auth){
        Usuario aluno=atual(auth);
        long escolaId=escola(aluno);
        if(aluno.getPapel()!=Papel.ALUNO)throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        MinhaFrequencia dados=jdbc.queryForObject(
            "SELECT COUNT(DISTINCT a.id) AS aulas, "+
            "COUNT(DISTINCT p.aula_id) AS registros, "+
            "COALESCE(SUM(CASE WHEN p.presente=TRUE THEN 1 ELSE 0 END),0) AS presencas, "+
            "COALESCE(SUM(CASE WHEN p.presente=FALSE THEN 1 ELSE 0 END),0) AS faltas "+
            "FROM aulas_registradas a "+
            "LEFT JOIN presencas_aula p ON p.aula_id=a.id AND p.aluno_id=? "+
            "WHERE a.escola_id=? AND (p.aluno_id IS NOT NULL OR EXISTS ("+
            "SELECT 1 FROM matriculas m JOIN turmas t ON t.id=m.turma_id "+
            "WHERE m.aluno_id=? AND m.turma_id=a.turma_id AND t.escola_id=?))",
            (rs,i)->new MinhaFrequencia(rs.getInt("aulas"),rs.getInt("registros"),
                rs.getInt("presencas"),rs.getInt("faltas")),
            aluno.getId(),escolaId,aluno.getId(),escolaId);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(dados);
    }
}
