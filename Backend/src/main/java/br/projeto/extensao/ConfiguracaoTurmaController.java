package br.projeto.extensao;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.sql.Time;
import java.time.LocalTime;
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
public class ConfiguracaoTurmaController {
    public record Configuracao(Long id, String codigo, String nome, int anoLetivo, String descricao, String cor) {}
    public record AtualizarTurma(
        @NotBlank @Pattern(regexp="[A-Za-z0-9-]{1,32}") String codigo,
        @NotBlank @Size(max=100) String nome,
        @Min(2020) @Max(2100) int anoLetivo,
        @NotNull @Size(max=500) String descricao,
        @NotBlank @Pattern(regexp="#[0-9A-Fa-f]{6}") String cor) {}
    public record Horario(Long id, Long turmaId, String disciplina, int diaSemana, String inicio,
                          String fim, Long professorId, String professorNome) {}
    public record NovoHorario(
        @NotBlank @Pattern(regexp="[A-Z_]{3,60}") String disciplina,
        @NotNull @Min(1) @Max(7) Integer diaSemana,
        @NotNull LocalTime inicio, @NotNull LocalTime fim,
        Long professorId) {}

    private final JdbcTemplate jdbc;
    private final UsuarioRepository usuarios;
    public ConfiguracaoTurmaController(JdbcTemplate jdbc, UsuarioRepository usuarios) {
        this.jdbc=jdbc;
        this.usuarios=usuarios;
    }
    private Usuario usuario(Authentication auth) {
        if(auth==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return usuarios.findByEmail(auth.getName())
            .orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
    private Long escola(Usuario user) {
        if(user.getEscolaId()==null || user.isAdministradorPlataforma())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return user.getEscolaId();
    }
    private Usuario direcao(Authentication auth) {
        Usuario user=usuario(auth);
        if(user.getPapel()!=Papel.DIRECAO)throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        escola(user);
        return user;
    }
    private Configuracao turma(Long turmaId, Usuario user) {
        Long escolaId=escola(user);
        List<Configuracao> dados=jdbc.query(
            "SELECT t.id,t.codigo,t.nome,t.ano_letivo,t.descricao,t.cor FROM turmas t " +
            "WHERE t.id=? AND t.escola_id=?",
            (rs,i)->new Configuracao(rs.getLong("id"),rs.getString("codigo"),rs.getString("nome"),
                rs.getInt("ano_letivo"),rs.getString("descricao"),rs.getString("cor")),
            turmaId,escolaId);
        if(dados.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        boolean permitido=switch(user.getPapel()){
            case DIRECAO -> true;
            case PROFESSOR -> jdbc.queryForObject(
                "SELECT COUNT(*) FROM vinculos_docentes WHERE turma_id=? AND professor_id=?",
                Integer.class,turmaId,user.getId())>0;
            case ALUNO -> jdbc.queryForObject(
                "SELECT COUNT(*) FROM matriculas WHERE turma_id=? AND aluno_id=?",
                Integer.class,turmaId,user.getId())>0;
        };
        if(!permitido)throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return dados.get(0);
    }
    @GetMapping("/portal/turmas/{turmaId}/configuracao")
    public ResponseEntity<Configuracao> detalhes(@PathVariable Long turmaId, Authentication auth) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(turma(turmaId,usuario(auth)));
    }
    @Transactional
    @PutMapping("/gestao/turmas/{turmaId}")
    public ResponseEntity<Configuracao> atualizar(@PathVariable Long turmaId,
            @Valid @RequestBody AtualizarTurma dados, Authentication auth) {
        Usuario gestora=direcao(auth);
        turma(turmaId,gestora);
        int ocupadas=jdbc.queryForObject(
            "SELECT COUNT(*) FROM matriculas WHERE turma_id=?",Integer.class,turmaId);
        if(ocupadas>0) {
            int anoAnterior=jdbc.queryForObject("SELECT ano_letivo FROM turmas WHERE id=?",
                Integer.class,turmaId);
            if(anoAnterior!=dados.anoLetivo())
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Nao altere o ano letivo de turma com matriculas.");
        }
        try {
            jdbc.update("UPDATE turmas SET codigo=?,nome=?,ano_letivo=?,descricao=?,cor=? "+
                "WHERE id=? AND escola_id=?",dados.codigo().trim(),dados.nome().trim(),
                dados.anoLetivo(),dados.descricao().trim(),dados.cor(),turmaId,gestora.getEscolaId());
        } catch(DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Codigo de turma em uso.");
        }
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(turma(turmaId,gestora));
    }
    private Horario lerHorario(java.sql.ResultSet rs,int i)throws java.sql.SQLException {
        long professorId=rs.getLong("professor_id");
        return new Horario(rs.getLong("id"),rs.getLong("turma_id"),rs.getString("disciplina"),
            rs.getInt("dia_semana"),rs.getTime("inicio").toLocalTime().toString(),
            rs.getTime("fim").toLocalTime().toString(),professorId==0?null:professorId,
            rs.getString("professor_nome"));
    }
    @GetMapping("/portal/turmas/{turmaId}/horarios")
    public ResponseEntity<List<Horario>> horarios(@PathVariable Long turmaId,Authentication auth) {
        turma(turmaId,usuario(auth));
        List<Horario> itens=jdbc.query(
            "SELECT h.id,h.turma_id,h.disciplina,h.dia_semana,h.inicio,h.fim,h.professor_id,"+
            "u.nome AS professor_nome FROM horarios_turma h "+
            "LEFT JOIN usuarios u ON u.id=h.professor_id "+
            "WHERE h.turma_id=? ORDER BY h.dia_semana,h.inicio",
            this::lerHorario,turmaId);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(itens);
    }
    @Transactional
    @PostMapping("/gestao/turmas/{turmaId}/horarios")
    public ResponseEntity<Void> criarHorario(@PathVariable Long turmaId,
            @Valid @RequestBody NovoHorario dados,Authentication auth) {
        Usuario user=direcao(auth);
        turma(turmaId,user);
        if(!dados.inicio().isBefore(dados.fim()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Horario invalido.");
        if(dados.professorId()!=null) {
            Integer vinculos=jdbc.queryForObject(
                "SELECT COUNT(*) FROM vinculos_docentes v JOIN usuarios u ON u.id=v.professor_id "+
                "WHERE v.turma_id=? AND v.professor_id=? AND v.disciplina=? AND u.escola_id=?",
                Integer.class,turmaId,dados.professorId(),dados.disciplina(),user.getEscolaId());
            if(vinculos==0)throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Professor sem vinculo nessa disciplina.");
        }
        try {
            jdbc.update("INSERT INTO horarios_turma(turma_id,disciplina,dia_semana,inicio,fim,professor_id) "+
                "VALUES (?,?,?,?,?,?)",turmaId,dados.disciplina(),dados.diaSemana(),
                Time.valueOf(dados.inicio()),Time.valueOf(dados.fim()),dados.professorId());
        }catch(DataIntegrityViolationException ex){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Horario ja ocupado nesta turma.");
        }
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
    @Transactional
    @DeleteMapping("/gestao/turmas/{turmaId}/horarios/{horarioId}")
    public ResponseEntity<Void> apagarHorario(@PathVariable Long turmaId,@PathVariable Long horarioId,
            Authentication auth) {
        Usuario user=direcao(auth);
        turma(turmaId,user);
        int alterados=jdbc.update("DELETE FROM horarios_turma WHERE turma_id=? AND id=?",turmaId,horarioId);
        if(alterados==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return ResponseEntity.noContent().build();
    }
}
