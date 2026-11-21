package br.projeto.extensao;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.List;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class UsuariosController {
    public record UsuarioPublico(Long id, String nome, String email, Papel papel) {
        static UsuarioPublico de(Usuario usuario) {
            return new UsuarioPublico(usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getPapel());
        }
    }
    public record NovoUsuario(
        @NotBlank @Size(max = 150) String nome,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 12, max = 200) String senha,
        @NotNull Papel papel) {}

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final AuditoriaService auditoria;

    public UsuariosController(UsuarioRepository usuarios, PasswordEncoder encoder, AuditoriaService auditoria) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.auditoria = auditoria;
    }

    private Usuario direcao(Authentication auth) {
        if(auth==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Usuario user=usuarios.findByEmail(auth.getName())
            .orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if(user.getPapel()!=Papel.DIRECAO||user.isAdministradorPlataforma()||user.getEscolaId()==null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return user;
    }

    @GetMapping("/alunos/{id}")
    public ResponseEntity<UsuarioPublico> consultarAluno(@PathVariable Long id,Authentication auth) {
        if(auth==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Usuario atual=usuarios.findByEmail(auth.getName())
            .orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        Usuario aluno=usuarios.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        if(aluno.getPapel()!=Papel.ALUNO)throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        boolean proprio=atual.getPapel()==Papel.ALUNO&&atual.getId().equals(id);
        boolean gestora=atual.getPapel()==Papel.DIRECAO&&!atual.isAdministradorPlataforma()
            &&atual.getEscolaId()!=null&&atual.getEscolaId().equals(aluno.getEscolaId());
        if(!proprio&&!gestora)throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(UsuarioPublico.de(aluno));
    }

    @GetMapping("/professor/area")
    public ResponseEntity<java.util.Map<String,String>> professor() {
        return ResponseEntity.ok(java.util.Map.of("area","PROFESSOR"));
    }

    @GetMapping("/gestao/usuarios")
    public ResponseEntity<List<UsuarioPublico>> listarUsuarios(Authentication auth) {
        Usuario gestora=direcao(auth);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(
            usuarios.findByEscolaId(gestora.getEscolaId()).stream().map(UsuarioPublico::de).toList());
    }

    @Transactional
    @PostMapping("/gestao/usuarios")
    public ResponseEntity<UsuarioPublico> cadastrar(@Valid @RequestBody NovoUsuario dados,Authentication auth) {
        Usuario gestora=direcao(auth);
        if(dados.papel()!=Papel.ALUNO&&dados.papel()!=Papel.PROFESSOR)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Somente alunos e professores podem ser criados pela escola.");
        String email=dados.email().trim().toLowerCase(Locale.ROOT);
        if(usuarios.existsByEmail(email))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"E-mail ja cadastrado.");
        try {
            Usuario novo=new Usuario(dados.nome(),email,encoder.encode(dados.senha()),dados.papel());
            novo.vincularEscola(gestora.getEscolaId());
            Usuario salvo=usuarios.saveAndFlush(novo);
            auditoria.registrar(gestora.getEscolaId(),gestora.getId(),"USUARIO_CRIADO","USUARIO",salvo.getId());
            return ResponseEntity.created(URI.create("/api/gestao/usuarios/"+salvo.getId()))
                .body(UsuarioPublico.de(salvo));
        }catch(DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,"E-mail ja cadastrado.");
        }
    }
}
