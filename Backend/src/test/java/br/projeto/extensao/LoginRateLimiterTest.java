package br.projeto.extensao;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class LoginRateLimiterTest {
    @Test
    void bloqueiaAtaquesRepetidosPorConta() {
        LoginRateLimiter limiter = new LoginRateLimiter();
        String email = "conta@escola.edu.br";
        for (int i = 0; i < 5; i++) {
            limiter.verificar(email, "192.0.2.10");
            limiter.registrarFalha(email, "192.0.2.10");
        }
        assertThrows(ResponseStatusException.class, () -> limiter.verificar(email, "192.0.2.11"));
    }

    @Test
    void loginCorretoZeraFalhasDaConta() {
        LoginRateLimiter limiter = new LoginRateLimiter();
        limiter.registrarFalha("ok@escola.edu.br", "192.0.2.40");
        limiter.registrarSucesso("ok@escola.edu.br", "192.0.2.40");
        assertDoesNotThrow(() -> limiter.verificar("ok@escola.edu.br", "192.0.2.40"));
    }
}
