package br.projeto.extensao;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api")
public class AuthController {
    public record LoginRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 1, max = 200) String senha) {}
    public record EstadoRequest(@NotBlank String aba, @NotBlank String dia) {}
    public record EstadoResposta(String aba, String dia) {}
    public record MeResposta(Long id, String nome, String email, Papel papel, EstadoResposta estado) {
        static MeResposta de(Usuario usuario) {
            EstadoResposta estado = usuario.getUltimaAba() == null ? null
                : new EstadoResposta(usuario.getUltimaAba(), usuario.getUltimoDia());
            return new MeResposta(usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getPapel(), estado);
        }
    }

    private static final Set<String> ABAS = Set.of("inicio", "agenda", "avisos", "perfil");
    private static final Set<String> DIAS = Set.of("seg", "ter", "qua", "qui", "sex", "sab", "dom");

    private final UsuarioRepository usuarios;
    private final AuthenticationManager manager;
    private final SecurityContextRepository contexto;
    private final CsrfTokenRepository csrf;
    private final LoginRateLimiter limite;

    public AuthController(UsuarioRepository usuarios, AuthenticationManager manager, SecurityContextRepository contexto,
                          CsrfTokenRepository csrf, LoginRateLimiter limite) {
        this.usuarios = usuarios;
        this.manager = manager;
        this.contexto = contexto;
        this.csrf = csrf;
        this.limite = limite;
    }

    // Token legivel pelo navegador apenas para enviar no header X-XSRF-TOKEN.
    // A sessao de login e separada, em cookie HttpOnly.
    @GetMapping("/csrf")
    public ResponseEntity<Map<String, String>> csrfToken(HttpServletRequest request) {
        CsrfToken token = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (token == null) throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Map.of("token", token.getToken()));
    }

    @PostMapping("/login")
    public ResponseEntity<MeResposta> login(@Valid @RequestBody LoginRequest dados,
            HttpServletRequest request, HttpServletResponse response) {
        String email = dados.email().trim().toLowerCase(Locale.ROOT);
        String ip = request.getRemoteAddr();
        limite.verificar(email, ip);
        Authentication autenticacao;
        try {
            autenticacao = manager.authenticate(new UsernamePasswordAuthenticationToken(email, dados.senha()));
        } catch (AuthenticationException ex) {
            limite.registrarFalha(email, ip);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos.");
        }
        limite.registrarSucesso(email, ip);

        // Evita session fixation e grava a autenticacao na sessao JDBC.
        request.getSession(true);
        request.changeSessionId();
        SecurityContext contextoAtual = SecurityContextHolder.createEmptyContext();
        contextoAtual.setAuthentication(autenticacao);
        SecurityContextHolder.setContext(contextoAtual);
        contexto.saveContext(contextoAtual, request, response);
        csrf.saveToken(null, request, response); // girar o CSRF: buscar outro em GET /api/csrf

        Usuario usuario = usuarios.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(MeResposta.de(usuario));
    }

    @GetMapping("/me")
    public ResponseEntity<MeResposta> me(Authentication autenticacao) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(MeResposta.de(usuarioAutenticado(autenticacao)));
    }

    @Transactional
    @PostMapping("/estado")
    public ResponseEntity<Void> salvarEstado(@Valid @RequestBody EstadoRequest estado, Authentication autenticacao) {
        if (!ABAS.contains(estado.aba()) || !DIAS.contains(estado.dia())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado invalido.");
        }
        Usuario usuario = usuarioAutenticado(autenticacao);
        usuario.salvarEstado(estado.aba(), estado.dia());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response,
                                       Authentication autenticacao) {
        new SecurityContextLogoutHandler().logout(request, response, autenticacao);
        csrf.saveToken(null, request, response);
        return ResponseEntity.noContent().build();
    }

    Usuario usuarioAutenticado(Authentication autenticacao) {
        if (autenticacao == null || !autenticacao.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return usuarios.findByEmail(autenticacao.getName()).orElseThrow(
            () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
}
