package br.projeto.extensao;

import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Cria a primeira conta da direcao APENAS com variaveis de ambiente explicitas
 * e banco sem usuarios. Remover as variaveis apos o primeiro bootstrap.
 */
@Component
public class AdministradorInicial implements CommandLineRunner {
    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final String email;
    private final String senha;
    private final String nome;

    public AdministradorInicial(UsuarioRepository usuarios, PasswordEncoder encoder,
          @Value("${app.bootstrap.email:}") String email,
          @Value("${app.bootstrap.password:}") String senha,
          @Value("${app.bootstrap.name:Direcao}") String nome) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.email = email;
        this.senha = senha;
        this.nome = nome;
    }

    @Override
    public void run(String... args) {
        if (email.isBlank() && senha.isBlank()) return;
        if (email.isBlank() || senha.length() < 12 || nome.isBlank() || !email.contains("@")) {
            throw new IllegalStateException("Bootstrap de direcao incompleto ou inseguro.");
        }
        if (usuarios.count() == 0) {
            usuarios.save(new Usuario(nome, email.toLowerCase(Locale.ROOT), encoder.encode(senha), Papel.DIRECAO));
        }
    }
}
