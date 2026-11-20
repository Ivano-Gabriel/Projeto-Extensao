package br.projeto.extensao;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class ConteudosBasicosTest {
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
