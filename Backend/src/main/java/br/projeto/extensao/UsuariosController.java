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

    public UsuariosController(UsuarioRepository usuarios, PasswordEncoder encoder) {
        this.usuarios = usuarios;
        this.encoder = encoder;
    }

    @GetMapping("/alunos/{id}")
    public ResponseEntity<UsuarioPublico> consultarAluno(@PathVariable Long id, Authentication autenticacao) {
        Usuario usuario = usuarios.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        boolean direcao = autenticacao.getAuthorities().stream()
            .anyMatch(role -> role.getAuthority().equals("ROLE_DIRECAO"));
        if (!direcao && !usuario.getEmail().equals(autenticacao.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (usuario.getPapel() != Papel.ALUNO) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(UsuarioPublico.de(usuario));
    }

    // Professor nao tem acesso automatico aos dados de todos os alunos.
    // Vinculos com turmas e materias serao implementados em etapa separada.
    @GetMapping("/professor/area")
    public ResponseEntity<java.util.Map<String, String>> professor() {
        return ResponseEntity.ok(java.util.Map.of("area", "PROFESSOR"));
    }

    @GetMapping("/gestao/usuarios")
    public ResponseEntity<List<UsuarioPublico>> listarUsuarios() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(usuarios.findAll().stream().map(UsuarioPublico::de).toList());
    }

    @PostMapping("/gestao/usuarios")
    public ResponseEntity<UsuarioPublico> cadastrar(@Valid @RequestBody NovoUsuario dados) {
        String email = dados.email().trim().toLowerCase(Locale.ROOT);
        if (usuarios.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail ja cadastrado.");
        }
        try {
            Usuario salvo = usuarios.saveAndFlush(
                new Usuario(dados.nome(), email, encoder.encode(dados.senha()), dados.papel()));
            return ResponseEntity.created(URI.create("/api/gestao/usuarios/" + salvo.getId()))
                .body(UsuarioPublico.de(salvo));
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail ja cadastrado.");
        }
    }
}
