package br.projeto.extensao;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> entradaInvalida(MethodArgumentNotValidException ex) {
        return ResponseEntity.badRequest().body(Map.of("erro", "Dados invalidos."));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> jsonInvalido(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(Map.of("erro", "JSON invalido."));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> http(ResponseStatusException ex) {
        String mensagem = ex.getReason() == null ? "Nao foi possivel concluir a solicitacao." : ex.getReason();
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("erro", mensagem));
    }
}
