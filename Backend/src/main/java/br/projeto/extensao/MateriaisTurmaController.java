package br.projeto.extensao;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.net.URI;
import java.sql.PreparedStatement;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class MateriaisTurmaController {
    public record Material(Long id,Long turmaId,Long professorId,String disciplina,String titulo,
                           String conteudo,boolean publicado) {}
    public record Formulario(
        @NotBlank @Pattern(regexp="[A-Z_]{3,60}") String disciplina,
        @NotBlank @Size(max=150) String titulo,
        @NotBlank @Size(max=4000) String conteudo,
        boolean publicado) {}
    private final UsuarioRepository usuarios;
    private final JdbcTemplate jdbc;
    private final AuditoriaService auditoria;
    public MateriaisTurmaController(UsuarioRepository usuarios,JdbcTemplate jdbc,AuditoriaService auditoria){
        this.usuarios=usuarios;this.jdbc=jdbc;this.auditoria=auditoria;
    }
    private Usuario usuario(Authentication auth){
        if(auth==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return usuarios.findByEmail(auth.getName())
            .orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
    private void escola(Usuario user){
        if(user.isAdministradorPlataforma()||user.getEscolaId()==null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    private void verificarTurma(Usuario user,long turmaId){
        escola(user);
        Integer existe=jdbc.queryForObject("SELECT COUNT(*) FROM turmas WHERE id=? AND escola_id=?",
            Integer.class,turmaId,user.getEscolaId());
        if(existe==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    private void vinculado(Usuario user,long turmaId,String disciplina){
        if(user.getPapel()!=Papel.PROFESSOR)throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        verificarTurma(user,turmaId);
        Integer numero=jdbc.queryForObject(
            "SELECT COUNT(*) FROM vinculos_docentes WHERE turma_id=? AND professor_id=? AND disciplina=?",
            Integer.class,turmaId,user.getId(),disciplina);
        if(numero==0)throw new ResponseStatusException(HttpStatus.FORBIDDEN,
            "Professor nao vinculado a disciplina.");
    }
    private Material mapear(java.sql.ResultSet rs,int i)throws java.sql.SQLException{
        return new Material(rs.getLong("id"),rs.getLong("turma_id"),rs.getLong("professor_id"),
            rs.getString("disciplina"),rs.getString("titulo"),rs.getString("conteudo"),
            rs.getBoolean("publicado"));
    }
    @GetMapping("/portal/turmas/{turmaId}/materiais")
    public ResponseEntity<List<Material>> listar(@PathVariable Long turmaId,Authentication auth){
        Usuario user=usuario(auth);
        verificarTurma(user,turmaId);
        String filtro=switch(user.getPapel()){
            case DIRECAO -> "";
            case PROFESSOR -> " AND EXISTS(SELECT 1 FROM vinculos_docentes v "+
                "WHERE v.turma_id=m.turma_id AND v.professor_id=? AND v.disciplina=m.disciplina) "+
                "AND (m.publicado=TRUE OR m.professor_id=?)";
            case ALUNO -> " AND m.publicado=TRUE AND EXISTS(SELECT 1 FROM matriculas mt "+
                "WHERE mt.turma_id=m.turma_id AND mt.aluno_id=?)";
        };
        String sql="SELECT m.id,m.turma_id,m.professor_id,m.disciplina,m.titulo,m.conteudo,m.publicado "+
            "FROM materiais_turma m WHERE m.turma_id=?"+filtro+" ORDER BY m.atualizado_em DESC,m.id DESC";
        List<Material> materiais=switch(user.getPapel()){
            case DIRECAO -> jdbc.query(sql,this::mapear,turmaId);
            case PROFESSOR -> jdbc.query(sql,this::mapear,turmaId,user.getId(),user.getId());
            case ALUNO -> jdbc.query(sql,this::mapear,turmaId,user.getId());
        };
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(materiais);
    }
    @Transactional
    @PostMapping("/professor/turmas/{turmaId}/materiais")
    public ResponseEntity<Material> publicar(@PathVariable Long turmaId,
            @Valid @RequestBody Formulario dados,Authentication auth){
        Usuario user=usuario(auth);
        vinculado(user,turmaId,dados.disciplina());
        KeyHolder chave=new GeneratedKeyHolder();
        jdbc.update(conn->{
            PreparedStatement stmt=conn.prepareStatement(
                "INSERT INTO materiais_turma(turma_id,professor_id,disciplina,titulo,conteudo,publicado) "+
                "VALUES(?,?,?,?,?,?)",new String[]{"id"});
            stmt.setLong(1,turmaId);
            stmt.setLong(2,user.getId());
            stmt.setString(3,dados.disciplina());
            stmt.setString(4,dados.titulo().trim());
            stmt.setString(5,dados.conteudo().trim());
            stmt.setBoolean(6,dados.publicado());
            return stmt;
        },chave);
        long id=chave.getKey().longValue();
        auditoria.registrar(user.getEscolaId(),user.getId(),"MATERIAL_CRIADO","MATERIAL",id);
        return ResponseEntity.created(URI.create("/api/portal/turmas/"+turmaId+"/materiais"))
            .body(new Material(id,turmaId,user.getId(),dados.disciplina(),
                dados.titulo().trim(),dados.conteudo().trim(),dados.publicado()));
    }
    private Material proprio(Long materialId,Usuario user){
        escola(user);
        List<Material> dados=jdbc.query(
            "SELECT m.id,m.turma_id,m.professor_id,m.disciplina,m.titulo,m.conteudo,m.publicado "+
            "FROM materiais_turma m JOIN turmas t ON t.id=m.turma_id "+
            "WHERE m.id=? AND m.professor_id=? AND t.escola_id=?",
            this::mapear,materialId,user.getId(),user.getEscolaId());
        if(dados.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Material material=dados.get(0);
        vinculado(user,material.turmaId(),material.disciplina());
        return material;
    }
    @Transactional
    @PutMapping("/professor/materiais/{materialId}")
    public ResponseEntity<Material> editar(@PathVariable Long materialId,
            @Valid @RequestBody Formulario dados,Authentication auth){
        Usuario user=usuario(auth);
        Material material=proprio(materialId,user);
        if(!dados.disciplina().equals(material.disciplina()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Use a mesma disciplina do material original.");
        jdbc.update("UPDATE materiais_turma SET titulo=?,conteudo=?,publicado=?,"+
            "atualizado_em=CURRENT_TIMESTAMP WHERE id=?",dados.titulo().trim(),
            dados.conteudo().trim(),dados.publicado(),materialId);
        auditoria.registrar(user.getEscolaId(),user.getId(),"MATERIAL_EDITADO","MATERIAL",materialId);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(new Material(materialId,material.turmaId(),user.getId(),dados.disciplina(),
                dados.titulo().trim(),dados.conteudo().trim(),dados.publicado()));
    }
    @Transactional
    @DeleteMapping("/professor/materiais/{materialId}")
    public ResponseEntity<Void> apagar(@PathVariable Long materialId,Authentication auth){
        Usuario user=usuario(auth);
        proprio(materialId,user);
        jdbc.update("DELETE FROM materiais_turma WHERE id=?",materialId);
        auditoria.registrar(user.getEscolaId(),user.getId(),"MATERIAL_REMOVIDO","MATERIAL",materialId);
        return ResponseEntity.noContent().build();
    }
}
