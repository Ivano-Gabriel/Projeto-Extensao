package br.projeto.extensao;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class GroqChat {
    private GroqChat() {}

    public static Map<String,Object> requisicao(String modelo,String instrucoes,String entrada,boolean quiz) {
        return requisicao(modelo,instrucoes,entrada,quiz,quiz?1150:700);
    }
    public static Map<String,Object> requisicao(String modelo,String instrucoes,String entrada,boolean quiz,int maxTokens) {
        Map<String,Object> pedido=new HashMap<>();
        pedido.put("model",modelo);
        pedido.put("messages",List.of(
            Map.of("role","system","content",instrucoes),
            Map.of("role","user","content",entrada)));
        pedido.put("temperature",0.3);
        pedido.put("store",false);
        if(modelo.startsWith("qwen/qwen3.8-"))
            pedido.put("reasoning_effort","none");
        pedido.put("max_completion_tokens",Math.min(3500,Math.max(200,maxTokens)));
        if(quiz)pedido.put("response_format",Map.of("type","json_object"));
        return pedido;
    }

    public static String texto(Map<?,?> resposta) {
        if(resposta==null||!(resposta.get("choices") instanceof List<?> escolhas)||escolhas.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Sem resposta do modelo.");
        Object primeiro=escolhas.get(0);
        if(!(primeiro instanceof Map<?,?> escolha) ||
            !(escolha.get("message") instanceof Map<?,?> mensagem) ||
            !(mensagem.get("content") instanceof String texto) ||
            texto.isBlank()||texto.length()>12000)
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Resposta inválida do modelo.");
        return texto.trim();
    }
}
