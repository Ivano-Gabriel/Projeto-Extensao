package br.projeto.extensao;

import static org.junit.jupiter.api.Assertions.*;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class IaContratoTest {
    @Test
    void parserReconheceContratoDoProvedorSemConsultaExterna(){
        Map<String,Object> resposta=Map.of("status","completed","output",List.of(
            Map.of("content",List.of(Map.of("type","output_text","text","Rascunho pedagógico.")))));
        assertEquals("Rascunho pedagógico.",IaTextoResposta.ler(resposta));
        assertThrows(ResponseStatusException.class,
            ()->IaTextoResposta.ler(Map.of("status","incomplete","output",List.of())));
        assertThrows(ResponseStatusException.class,
            ()->IaTextoResposta.ler(Map.of("status","completed","output",List.of())));
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
