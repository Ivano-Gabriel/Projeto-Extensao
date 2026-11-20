package br.projeto.extensao;

import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/gestao")
public class AuditoriaController {
    public record Evento(Long id,Long escolaId,Long atorId,String acao,String entidade,
                         Long entidadeId,String data) {}
    private final JdbcTemplate jdbc;
    private final UsuarioRepository usuarios;
    public AuditoriaController(JdbcTemplate jdbc,UsuarioRepository usuarios){
        this.jdbc=jdbc;this.usuarios=usuarios;
    }

    @GetMapping("/auditoria")
    public ResponseEntity<List<Evento>> recentes(Authentication auth){
        if(auth==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Usuario usuario=usuarios.findByEmail(auth.getName())
            .orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if(usuario.getPapel()!=Papel.DIRECAO||usuario.isAdministradorPlataforma()
            ||usuario.getEscolaId()==null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        List<Evento> eventos=jdbc.query(
            "SELECT id,escola_id,ator_id,acao,entidade,entidade_id,criada_em FROM auditoria_escolar "+
            "WHERE escola_id=? ORDER BY id DESC LIMIT 50",
            (rs,i)->new Evento(rs.getLong("id"),rs.getLong("escola_id"),
                rs.getLong("ator_id"),rs.getString("acao"),rs.getString("entidade"),
                rs.getLong("entidade_id"),rs.getTimestamp("criada_em").toString()),
            usuario.getEscolaId());
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(eventos);
    }
}
