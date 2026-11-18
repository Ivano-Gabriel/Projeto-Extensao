package br.projeto.extensao;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin")
public class AdminEscolaController {
    public record NovaEscola(
        @NotBlank @Size(max=150) String nome,
        @NotBlank @Pattern(regexp="[a-z0-9-]{3,40}") String codigo) {}
    public record EscolaResumo(Long id,String codigo,String nome) {}
    public record NovaDirecao(
        @NotBlank @Size(max=150) String nome,
        @NotBlank @Email @Size(max=254) String email,
        @NotBlank @Size(min=16,max=200) String senha) {}

    private final JdbcTemplate jdbc;
    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    public AdminEscolaController(JdbcTemplate jdbc,UsuarioRepository usuarios,PasswordEncoder encoder){
        this.jdbc=jdbc;
        this.usuarios=usuarios;
        this.encoder=encoder;
    }
    @GetMapping("/escolas")
    public ResponseEntity<List<EscolaResumo>> listar(){
        List<EscolaResumo> dados=jdbc.query("SELECT id,codigo,nome FROM escolas ORDER BY nome",
            (rs,i)->new EscolaResumo(rs.getLong("id"),rs.getString("codigo"),rs.getString("nome")));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(dados);
    }
    @Transactional
    @PostMapping("/escolas")
    public ResponseEntity<EscolaResumo> criar(@Valid @RequestBody NovaEscola dados){
        try {
            jdbc.update("INSERT INTO escolas(codigo,nome) VALUES (?,?)",dados.codigo(),dados.nome().trim());
            Long id=jdbc.queryForObject("SELECT id FROM escolas WHERE codigo=?",Long.class,dados.codigo());
            return ResponseEntity.created(URI.create("/api/admin/escolas/"+id))
                .body(new EscolaResumo(id,dados.codigo(),dados.nome().trim()));
        }catch(DataIntegrityViolationException ex){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Codigo de escola ja utilizado.");
        }
    }
    @Transactional
    @PostMapping("/escolas/{escolaId}/direcao")
    public ResponseEntity<UsuariosController.UsuarioPublico> criarDirecao(
            @PathVariable Long escolaId,@Valid @RequestBody NovaDirecao dados){
        if(!existeEscola(escolaId))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Escola inexistente.");
        String email=dados.email().trim().toLowerCase(Locale.ROOT);
        if(usuarios.existsByEmail(email))throw new ResponseStatusException(HttpStatus.CONFLICT,"Email ja cadastrado.");
        try{
            Usuario diretor=new Usuario(dados.nome(),email,encoder.encode(dados.senha()),Papel.DIRECAO);
            diretor.vincularEscola(escolaId);
            Usuario salvo=usuarios.saveAndFlush(diretor);
            return ResponseEntity.created(URI.create("/api/admin/escolas/"+escolaId+"/direcao/"+salvo.getId()))
                .body(UsuariosController.UsuarioPublico.de(salvo));
        }catch(DataIntegrityViolationException ex){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Email ja cadastrado.");
        }
    }
    private boolean existeEscola(Long id){
        return jdbc.queryForObject("SELECT COUNT(*) FROM escolas WHERE id=? AND ativa=TRUE",Integer.class,id)>0;
    }
}
