package br.projeto.extensao;

import static org.junit.jupiter.api.Assertions.*;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class IaContratoTest {
    @Test
    void parserReconheceContratoDoGroqSemConsultaExterna(){
        Map<String,Object> resposta=Map.of("choices",List.of(
            Map.of("message",Map.of("content","Rascunho pedagógico."))));
        assertEquals("Rascunho pedagógico.",GroqChat.texto(resposta));
        assertThrows(ResponseStatusException.class,
            ()->GroqChat.texto(Map.of("choices",List.of())));
        assertThrows(ResponseStatusException.class,
            ()->GroqChat.texto(Map.of("choices",List.of(Map.of("message",Map.of("content"," "))))));
    }
    @Test
    void politicaRecusaIdentificadoresPessoaisAntesDeQualquerEnvio(){
        for(String texto:List.of("nome completo: Maria da Silva","data de nascimento: 03/04/2011",
            "cpf: 12345678900","aluno@exemplo.com")){
            assertThrows(ResponseStatusException.class,()->IaPrivacidade.validar(texto),texto);
        }
        assertDoesNotThrow(()->IaPrivacidade.validar("Explique equações do segundo grau"));
    }
}
