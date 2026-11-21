package br.projeto.extensao;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/portal/provas/simulados")
public class SimuladosController {
    public record EscolhaFormulario(@NotNull Long questaoId,@NotNull @Min(0) @Max(3) Integer opcao){}
    public record Entrega(@NotNull @Size(min=5,max=5)
                          List<@NotNull @Valid EscolhaFormulario> respostas){}

    private final UsuarioRepository usuarios;
    private final SimuladosService service;

    public SimuladosController(UsuarioRepository usuarios,SimuladosService service){
        this.usuarios=usuarios;
        this.service=service;
    }
    private Usuario aluno(Authentication auth){
        if(auth==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Usuario usuario=usuarios.findByEmail(auth.getName()).orElseThrow(
            ()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if(usuario.isAdministradorPlataforma()||usuario.getEscolaId()==null||
            usuario.getPapel()!=Papel.ALUNO)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return usuario;
    }

    @GetMapping
    public ResponseEntity<List<SimuladosService.Resumo>> listar(Authentication auth){
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(service.listar(aluno(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SimuladosService.Detalhe> detalhar(
            @PathVariable Long id,Authentication auth){
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(service.detalhar(aluno(auth),id));
    }

    @PostMapping("/{id}/respostas")
    public ResponseEntity<SimuladosService.Detalhe> responder(
            @PathVariable Long id,@Valid @RequestBody Entrega dados,Authentication auth){
        Usuario usuario=aluno(auth);
        List<SimuladosService.Escolha> respostas=dados.respostas().stream()
            .map(r->new SimuladosService.Escolha(r.questaoId(),r.opcao())).toList();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(service.finalizar(usuario,id,respostas));
    }
}
