package br.projeto.extensao;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Cria o primeiro aluno no banco (só se ainda não existir). */
@Component
public class AlunoInicial implements CommandLineRunner {

    private final AlunoRepository alunos;
    private final PasswordEncoder encoder;

    public AlunoInicial(AlunoRepository alunos, PasswordEncoder encoder) {
        this.alunos = alunos;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        String email = "mayckexemplo@gmail.com";
        if (!alunos.existsByEmail(email)) {
            alunos.save(new Aluno("Mayck", email, encoder.encode("Senha123")));
        }
    }
}
