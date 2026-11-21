package br.projeto.extensao;

import static org.junit.jupiter.api.Assertions.*;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class GroqChatTest {
    @Test
    void criaRequisicaoSemIdentificadoresDeAlunoComLimiteDeResposta(){
        Map<String,Object> body=GroqChat.requisicao("qwen/qwen3.8-27b",
            "Explique matemática sem revelar dados pessoais.","O que é proporção?",false);
        assertEquals("qwen/qwen3.8-27b",body.get("model"));
        assertEquals(700,body.get("max_completion_tokens"));
        assertFalse(body.containsKey("user"));
        assertFalse(body.containsKey("store"));
        assertFalse(body.containsKey("metadata"));
        assertFalse(body.containsKey("response_format"));
        assertEquals(2,((List<?>)body.get("messages")).size());
        assertEquals(false,body.get("store"));
        assertEquals("none",body.get("reasoning_effort"));
    }
    @Test
    void quizSolicitaJsonEValidaRetornoCompleto(){
        Map<String,Object> quiz=GroqChat.requisicao("qwen/qwen3.8-27b","Retorne JSON válido.","Tema: frações",true);
        assertEquals(Map.of("type","json_object"),quiz.get("response_format"));
        String texto=GroqChat.texto(Map.of("choices",List.of(
            Map.of("message",Map.of("content","Exemplo de explicação")))));
        assertEquals("Exemplo de explicação",texto);
        assertThrows(ResponseStatusException.class,()->GroqChat.texto(Map.of("choices",List.of())));
        assertThrows(ResponseStatusException.class,()->GroqChat.texto(Map.of("choices",List.of(
            Map.of("message",Map.of("content"," "))))));
    }
}
