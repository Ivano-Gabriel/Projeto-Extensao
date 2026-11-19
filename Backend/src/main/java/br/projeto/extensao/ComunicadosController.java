package br.projeto.extensao;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.sql.PreparedStatement;
import java.util.List;
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
public class ComunicadosController {
    public enum Publico {TODOS, ALUNOS, FUNCIONARIOS}
    public record NovoComunicado(
        Long turmaId,
        @NotNull Publico publico,
        @NotBlank @Size(max=120) String titulo,
        @NotBlank @Size(max=1500) String texto,
        boolean importante) {}
    public record ComunicadoResumo(Long id,Long turmaId,String publico,String titulo,
                                    String texto,boolean importante,String criadoEm) {}

    private final JdbcTemplate jdbc;
    private final UsuarioRepository usuarios;
    public ComunicadosController(JdbcTemplate jdbc,UsuarioRepository usuarios){
        this.jdbc=jdbc;
        this.usuarios=usuarios;
    }
    private Usuario usuario(Authentication auth){
        if(auth==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return usuarios.findByEmail(auth.getName())
            .orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
    private Long escola(Usuario usuario){
        if(usuario.isAdministradorPlataforma()||usuario.getEscolaId()==null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return usuario.getEscolaId();
    }
    private void turmaDaEscola(Long turmaId,Long escolaId){
        if(turmaId==null)return;
        Integer existe=jdbc.queryForObject("SELECT COUNT(*) FROM turmas WHERE id=? AND escola_id=?",
            Integer.class,turmaId,escolaId);
        if(existe==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Turma indisponível.");
    }
    private List<ComunicadoResumo> consultar(String condicao,Object... parametros){
        return jdbc.query("SELECT c.id,c.turma_id,c.publico,c.titulo,c.texto,c.importante,c.criado_em "+
            "FROM comunicados c WHERE "+condicao+" ORDER BY c.importante DESC,c.criado_em DESC,c.id DESC LIMIT 50",
            (rs,i)->new ComunicadoResumo(rs.getLong("id"),
                rs.getObject("turma_id")==null?null:rs.getLong("turma_id"),
                rs.getString("publico"),rs.getString("titulo"),rs.getString("texto"),
                rs.getBoolean("importante"),rs.getTimestamp("criado_em").toInstant().toString()),
            parametros);
    }
    @GetMapping("/portal/avisos")
    public ResponseEntity<List<ComunicadoResumo>> listar(Authentication auth){
        Usuario usuario=usuario(auth);
        Long escolaId=escola(usuario);
        List<ComunicadoResumo> lista=switch(usuario.getPapel()){
            case DIRECAO -> consultar("c.escola_id=?",escolaId);
            case ALUNO -> consultar("c.escola_id=? AND c.publico IN ('TODOS','ALUNOS') "+
                "AND (c.turma_id IS NULL OR EXISTS "+
                "(SELECT 1 FROM matriculas m WHERE m.turma_id=c.turma_id AND m.aluno_id=?))",
                escolaId,usuario.getId());
            case PROFESSOR -> consultar("c.escola_id=? AND "+
                "(c.turma_id IS NULL OR EXISTS "+
                "(SELECT 1 FROM vinculos_docentes v WHERE v.turma_id=c.turma_id AND v.professor_id=?)) "+
                "AND (c.publico IN ('TODOS','FUNCIONARIOS') OR "+
                "(c.publico='ALUNOS' AND c.turma_id IS NOT NULL))",
                escolaId,usuario.getId());
        };
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(lista);
    }
    private ResponseEntity<ComunicadoResumo> criar(NovoComunicado dados,Usuario autor,Long escolaId){
        turmaDaEscola(dados.turmaId(),escolaId);
        GeneratedKeyHolder holder=new GeneratedKeyHolder();
        jdbc.update(conexao->{
            PreparedStatement stmt=conexao.prepareStatement(
                "INSERT INTO comunicados(escola_id,turma_id,autor_id,publico,titulo,texto,importante) "+
                "VALUES (?,?,?,?,?,?,?)",new String[]{"id"});
            stmt.setObject(1,escolaId);
            stmt.setObject(2,dados.turmaId());
            stmt.setObject(3,autor.getId());
            stmt.setString(4,dados.publico().name());
            stmt.setString(5,dados.titulo().trim());
            stmt.setString(6,dados.texto().trim());
            stmt.setBoolean(7,dados.importante());
            return stmt;
        },holder);
        Long id=holder.getKey().longValue();
        ComunicadoResumo criado=consultar("c.id=? AND c.escola_id=?",id,escolaId).get(0);
        return ResponseEntity.created(URI.create("/api/portal/avisos/"+id)).body(criado);
    }
    @Transactional
    @PostMapping("/gestao/avisos")
    public ResponseEntity<ComunicadoResumo> publicarDirecao(@Valid @RequestBody NovoComunicado dados,
                                                              Authentication auth){
        Usuario autor=usuario(auth);
        if(autor.getPapel()!=Papel.DIRECAO||autor.isAdministradorPlataforma())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return criar(dados,autor,escola(autor));
    }
    @Transactional
    @PostMapping("/professor/avisos")
    public ResponseEntity<ComunicadoResumo> publicarProfessor(@Valid @RequestBody NovoComunicado dados,
                                                                Authentication auth){
        Usuario autor=usuario(auth);
        Long escolaId=escola(autor);
        if(autor.getPapel()!=Papel.PROFESSOR||dados.turmaId()==null||dados.publico()!=Publico.ALUNOS)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        Integer vinculado=jdbc.queryForObject(
            "SELECT COUNT(*) FROM vinculos_docentes v JOIN turmas t ON t.id=v.turma_id "+
            "WHERE t.id=? AND t.escola_id=? AND v.professor_id=?",
            Integer.class,dados.turmaId(),escolaId,autor.getId());
        if(vinculado==0)throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return criar(dados,autor,escolaId);
    }
}
