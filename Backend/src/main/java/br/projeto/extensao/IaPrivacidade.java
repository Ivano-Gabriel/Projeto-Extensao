package br.projeto.extensao;

import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class IaPrivacidade {
    private IaPrivacidade() {}
    private static final Pattern EMAIL=Pattern.compile(
        "(?i)[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}");
    private static final Pattern NUMERO_PESSOAL=Pattern.compile(
        "(?:\\+?55[\\s-]?)?\\(?\\d{2}\\)?[\\s-]?9?\\d{4}[\\s-]?\\d{4}|\\b\\d{3}[. ]?\\d{3}[. ]?\\d{3}[- ]?\\d{2}\\b");
    private static final Pattern IDENTIFICADOR=Pattern.compile(
        "(?i)\\b(?:cpf|rg|telefone|celular|endereco|endereço|senha|matricula|matrícula|nome completo|nome do aluno|data de nascimento|data nascimento)\\s*[:=]");

    public static void validar(String... textos){
        for(String texto:textos){
            if(texto!=null&&(EMAIL.matcher(texto).find()||
                NUMERO_PESSOAL.matcher(texto).find()||IDENTIFICADOR.matcher(texto).find()))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Remova dados pessoais e identificadores antes de enviar para IA.");
        }
    }
}
