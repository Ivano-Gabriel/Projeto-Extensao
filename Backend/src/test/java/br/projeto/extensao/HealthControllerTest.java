package br.projeto.extensao;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;

@ExtendWith(MockitoExtension.class)
class HealthControllerTest {
    @Mock JdbcTemplate jdbc;
    @InjectMocks HealthController controller;

    @Test
    void verificaBancoQuandoDisponivel() {
        when(jdbc.queryForObject("SELECT 1", Integer.class)).thenReturn(1);
        var resposta = controller.readiness();

        assertEquals(HttpStatus.OK, resposta.getStatusCode());
        assertEquals(Map.of("status", "ready"), resposta.getBody());
        assertEquals("no-store", resposta.getHeaders().getCacheControl());
    }

    @Test
    void responde503SemVazarDetalhesSeBancoFalhar() {
        when(jdbc.queryForObject("SELECT 1", Integer.class))
            .thenThrow(new DataAccessResourceFailureException("conexao privada"));

        var resposta = controller.readiness();

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, resposta.getStatusCode());
        assertEquals(Map.of("status", "unavailable"), resposta.getBody());
        assertEquals("no-store", resposta.getHeaders().getCacheControl());
    }

    @Test
    void naoConsideraBancoProntoSeConsultaRetornaValorInesperado() {
        when(jdbc.queryForObject("SELECT 1", Integer.class)).thenReturn(0);

        var resposta = controller.readiness();

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, resposta.getStatusCode());
        assertEquals(Map.of("status", "unavailable"), resposta.getBody());
    }
}
