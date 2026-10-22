package br.projeto.extensao;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api")
public class AuthController {

    public record LoginRequest(String email, String senha) {}
    public record EstadoRequest(String aba, String dia) {}

    private static final Set<String> ABAS = Set.of("inicio", "agenda", "avisos", "perfil");

    private final AlunoRepository alunos;
    private final PasswordEncoder encoder;

    // sessões em memória: token -> id do aluno (reiniciar o Backend desloga todo mundo)
    private final Map<String, Long> sessoes = new ConcurrentHashMap<>();

    public AuthController(AlunoRepository alunos, PasswordEncoder encoder) {
        this.alunos = alunos;
        this.encoder = encoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        String email = req.email() == null ? "" : req.email().trim().toLowerCase();
        String senha = req.senha() == null ? "" : req.senha();

        // Mesma resposta para e-mail inexistente e senha errada (não revela qual deu erro)
        Aluno aluno = alunos.findByEmail(email)
                .filter(a -> encoder.matches(senha, a.getSenhaHash()))
                .orElse(null);
        if (aluno == null) {
            return ResponseEntity.status(401).body(Map.of("erro", "E-mail ou senha incorretos."));
        }

        String token = UUID.randomUUID().toString();
        sessoes.put(token, aluno.getId());

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("token", token);
        resposta.put("nome", aluno.getNome());
        resposta.put("email", aluno.getEmail());
        resposta.put("estado", aluno.getUltimaAba() == null
                ? null
                : Map.of("aba", aluno.getUltimaAba(), "dia", aluno.getUltimoDia()));
        return ResponseEntity.ok(resposta);
    }

    // Salva onde o aluno estava (ao sair ou ao fechar a aba)
    @PostMapping("/estado")
    public ResponseEntity<?> salvarEstado(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody EstadoRequest req) {

        Long id = sessoes.get(tokenDe(auth));
        if (id == null) {
            return ResponseEntity.status(401).body(Map.of("erro", "Sessão inválida."));
        }
        if (req.aba() == null || !ABAS.contains(req.aba())
                || req.dia() == null || req.dia().length() > 3) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Estado inválido."));
        }

        Aluno aluno = alunos.findById(id).orElseThrow();
        aluno.salvarEstado(req.aba(), req.dia());
        alunos.save(aluno);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        sessoes.remove(tokenDe(auth));
        return ResponseEntity.noContent().build();
    }

    private static String tokenDe(String auth) {
        return auth == null ? "" : auth.replace("Bearer ", "");
    }
}
