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
                                    String texto,boolean importante,String criadoEm,
                                    Long autorId,String autorNome,String autorPapel) {}
    public record EditarComunicado(
        @NotBlank @Size(max=120) String titulo,
        @NotBlank @Size(max=1500) String texto,
        boolean importante) {}

    private final JdbcTemplate jdbc;
    private final UsuarioRepository usuarios;
    private final AuditoriaService auditoria;
    public ComunicadosController(JdbcTemplate jdbc,UsuarioRepository usuarios,AuditoriaService auditoria){
        this.jdbc=jdbc;
        this.usuarios=usuarios;
        this.auditoria=auditoria;
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
        return jdbc.query("SELECT c.id,c.turma_id,c.publico,c.titulo,c.texto,c.importante,c.criado_em,"+
            "u.id AS autor_id,u.nome AS autor_nome,u.papel AS autor_papel "+
            "FROM comunicados c LEFT JOIN usuarios u ON u.id=c.autor_id AND u.escola_id=c.escola_id "+
            "WHERE "+condicao+" ORDER BY c.criado_em DESC,c.id DESC LIMIT 50",
            (rs,i)->new ComunicadoResumo(rs.getLong("id"),
                rs.getObject("turma_id")==null?null:rs.getLong("turma_id"),
                rs.getString("publico"),rs.getString("titulo"),rs.getString("texto"),
                rs.getBoolean("importante"),rs.getTimestamp("criado_em").toInstant().toString(),
                rs.getObject("autor_id")==null?null:rs.getLong("autor_id"),
                rs.getString("autor_nome")==null?"Equipe escolar":rs.getString("autor_nome"),
                rs.getString("autor_papel")==null?"ESCOLA":rs.getString("autor_papel")),
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

    private ComunicadoResumo comunicado(Long id,Long escolaId){
        return consultar("c.id=? AND c.escola_id=?",id,escolaId).stream().findFirst()
            .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
    private void permitidoEditar(Long id,Usuario autor){
        Long escolaId=escola(autor);
        Integer permite=jdbc.queryForObject(
            "SELECT COUNT(*) FROM comunicados c WHERE c.id=? AND c.escola_id=? "+
            "AND c.autor_id=? AND c.publico='ALUNOS' AND c.turma_id IS NOT NULL "+
            "AND EXISTS (SELECT 1 FROM vinculos_docentes v "+
            "WHERE v.turma_id=c.turma_id AND v.professor_id=?)",
            Integer.class,id,escolaId,autor.getId(),autor.getId());
        if(permite==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    @Transactional
    @PutMapping("/professor/avisos/{id}")
    public ResponseEntity<ComunicadoResumo> editarProfessor(@PathVariable Long id,
            @Valid @RequestBody EditarComunicado dados,Authentication auth){
        Usuario autor=usuario(auth);
        if(autor.getPapel()!=Papel.PROFESSOR)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        permitidoEditar(id,autor);
        jdbc.update("UPDATE comunicados SET titulo=?,texto=?,importante=? "+
                "WHERE id=? AND escola_id=? AND autor_id=?",
            dados.titulo().trim(),dados.texto().trim(),dados.importante(),id,
            escola(autor),autor.getId());
        auditoria.registrar(escola(autor),autor.getId(),"COMUNICADO_EDITADO","COMUNICADO",id);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(comunicado(id,escola(autor)));
    }
    @Transactional
    @DeleteMapping("/professor/avisos/{id}")
    public ResponseEntity<Void> removerProfessor(@PathVariable Long id,Authentication auth){
        Usuario autor=usuario(auth);
        if(autor.getPapel()!=Papel.PROFESSOR)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        permitidoEditar(id,autor);
        int apagados=jdbc.update("DELETE FROM comunicados WHERE id=? AND escola_id=? AND autor_id=?",
            id,escola(autor),autor.getId());
        if(apagados!=1)throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        auditoria.registrar(escola(autor),autor.getId(),"COMUNICADO_REMOVIDO","COMUNICADO",id);
        return ResponseEntity.noContent().build();
    }
    @Transactional
    @DeleteMapping("/gestao/avisos/{id}")
    public ResponseEntity<Void> moderarDirecao(@PathVariable Long id,Authentication auth){
        Usuario autor=usuario(auth);
        if(autor.getPapel()!=Papel.DIRECAO||autor.isAdministradorPlataforma())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        Long escolaId=escola(autor);
        int apagados=jdbc.update("DELETE FROM comunicados WHERE id=? AND escola_id=?",id,escolaId);
        if(apagados!=1)throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        auditoria.registrar(escolaId,autor.getId(),"COMUNICADO_REMOVIDO","COMUNICADO",id);
        return ResponseEntity.noContent().build();
    }

}
