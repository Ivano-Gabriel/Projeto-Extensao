package br.projeto.extensao;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class ConteudosBasicosTest {
    @Test void calculaPorcentagensNumericasEmVezDeResponderGenericamente(){
        assertTrue(ConteudosBasicos.responder("quanto e 25% de 80?").orElseThrow().contains("= 20"));
        assertTrue(ConteudosBasicos.responder("10% de 50").orElseThrow().contains("= 5"));
        assertTrue(ConteudosBasicos.responder("50% de 40").orElseThrow().contains("= 20"));
        assertTrue(ConteudosBasicos.responder("12,5% de 80").orElseThrow().contains("= 10"));
    }
    @Test void respondeTemasEscolaresSemChaveNemDadosDaEscola(){
        assertTrue(ConteudosBasicos.responder("o que e fotossintese").orElseThrow().contains("luz"));
        assertTrue(ConteudosBasicos.responder("como calcular porcentagem").orElseThrow().contains("20%"));
        assertTrue(ConteudosBasicos.responder("o que foi revolucao francesa").orElseThrow().contains("1789"));
        assertTrue(ConteudosBasicos.responder("o que sao fracoes").orElseThrow().contains("numerador"));
        assertTrue(ConteudosBasicos.responder("qual a diferenca de dna e rna").isPresent());
        assertTrue(ConteudosBasicos.responder("qual e minha senha").isEmpty());
        assertTrue(ConteudosBasicos.responder("quais sao minhas notas").isEmpty());
    }
}
