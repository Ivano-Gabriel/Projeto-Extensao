package br.projeto.extensao;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Limite de tentativas por conta e IP, com memoria limitada.
 * Para varias instancias, substituir por controle distribuido no gateway/Redis.
 */
@Component
public class LoginRateLimiter {
    private final Cache<String, AtomicInteger> falhas = Caffeine.newBuilder()
        .maximumSize(10_000)
        .expireAfterWrite(Duration.ofMinutes(15))
        .build();

    public void verificar(String email, String ip) {
        if (valor("email:" + email) >= 5 || valor("ip:" + ip) >= 20) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Muitas tentativas. Tente mais tarde.");
        }
    }

    public void registrarFalha(String email, String ip) {
        falhas.get("email:" + email, chave -> new AtomicInteger()).incrementAndGet();
        falhas.get("ip:" + ip, chave -> new AtomicInteger()).incrementAndGet();
    }

    public void registrarSucesso(String email, String ip) {
        falhas.invalidate("email:" + email);
        falhas.invalidate("ip:" + ip);
    }

    private int valor(String chave) {
        AtomicInteger quantidade = falhas.getIfPresent(chave);
        return quantidade == null ? 0 : quantidade.get();
    }
}
