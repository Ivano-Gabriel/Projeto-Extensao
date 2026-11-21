package br.projeto.extensao;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
@ActiveProfiles("test")
class IaRespostaPedagogicaTest {
    @Autowired IaPedagogicaController controller;

    private String quiz(String alternativas,String indice){
        return "{\"titulo\":\"Revisão\",\"pergunta\":\"Qual é a resposta correta?\","+
            "\"opcoes\":"+alternativas+",\"correta\":"+indice+
            ",\"explicacao\":\"Explique a alternativa correta.\"}";
    }

    @Test
    void rejeitaAlternativasRepetidasMesmoComCapitalizacaoDiferente(){
        String json=quiz("[\"Brasil\",\"brasil\",\"Chile\",\"Uruguai\"]","2");
        ResponseStatusException erro=assertThrows(ResponseStatusException.class,
            ()->controller.lerQuiz(json));
        assertEquals(HttpStatus.BAD_GATEWAY,erro.getStatusCode());
    }

    @Test
    void rejeitaIndiceFracionarioQueNaoPodeSerGabaritoValido(){
        String json=quiz("[\"A\",\"B\",\"C\",\"D\"]","1.5");
        ResponseStatusException erro=assertThrows(ResponseStatusException.class,
            ()->controller.lerQuiz(json));
        assertEquals(HttpStatus.BAD_GATEWAY,erro.getStatusCode());
    }

    @Test
    void permiteGabaritoInteiroEAlternativasDistintas(){
        IaPedagogicaController.QuizGerado valido=controller.lerQuiz(
            quiz("[\"A\",\"B\",\"C\",\"D\"]","1"));
        assertEquals(1,valido.correta());
        assertEquals(4,valido.opcoes().size());
    }

    @Test
    void pacoteRejeitaQuestoesRepetidasSemPublicar(){
        String item=quiz("[\"A\",\"B\",\"C\",\"D\"]","1");
        ResponseStatusException erro=assertThrows(ResponseStatusException.class,
            ()->controller.lerPacote("{\"questoes\":["+item+","+item+"]}",2));
        assertEquals(HttpStatus.BAD_GATEWAY,erro.getStatusCode());
    }
}
