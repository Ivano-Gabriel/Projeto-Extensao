package br.projeto.extensao;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class IaTextoResposta {
    private IaTextoResposta() {}

    public static String ler(Map<?,?> resposta) {
        if(resposta==null||!"completed".equals(resposta.get("status")))
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                "A geração de texto não foi concluída.");
        if(!(resposta.get("output") instanceof List<?> itens))
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY);
        StringBuilder texto=new StringBuilder();
        for(Object item:itens) {
            if(!(item instanceof Map<?,?> bloco)||
                !(bloco.get("content") instanceof List<?> partes))continue;
            for(Object parte:partes) {
                if(parte instanceof Map<?,?> dado &&
                    "output_text".equals(dado.get("type")) &&
                    dado.get("text") instanceof String trecho)texto.append(trecho);
            }
        }
        if(texto.isEmpty())throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
            "O modelo não retornou um conteúdo válido.");
        return texto.toString().trim();
    }
}
