package br.projeto.extensao;

import java.sql.Date;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class IaCotasService {
    private final JdbcTemplate jdbc;
    private final int porProfessor;
    private final int porAluno;
    public IaCotasService(JdbcTemplate jdbc,
            @Value("${EXTENSAO_IA_PROFESSOR_POR_DIA:12}") int porProfessor,
            @Value("${EXTENSAO_IA_ALUNO_POR_DIA:6}") int porAluno) {
        this.jdbc=jdbc;
        this.porProfessor=Math.max(0,Math.min(40,porProfessor));
        this.porAluno=Math.max(0,Math.min(20,porAluno));
    }
    private int limite(Papel papel){
        return switch(papel){
            case PROFESSOR -> porProfessor;
            case ALUNO -> porAluno;
            case DIRECAO -> 0;
        };
    }
    public int restantes(Long usuarioId,Papel papel){
        Date hoje=Date.valueOf(LocalDate.now(ZoneOffset.UTC));
        Integer usadas=jdbc.query("SELECT requisicoes FROM ia_uso_diario WHERE usuario_id=? AND dia_utc=?",
            rs->rs.next()?rs.getInt(1):0,usuarioId,hoje);
        return Math.max(0,limite(papel)-(usadas==null?0:usadas));
    }
    @Transactional
    public int reservar(Long usuarioId,Papel papel){
        int limite=limite(papel);
        if(limite<1)throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
            "Cota de IA indisponivel.");
        Long id=jdbc.queryForObject("SELECT id FROM usuarios WHERE id=? FOR UPDATE",
            Long.class,usuarioId);
        if(id==null)throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        Date hoje=Date.valueOf(LocalDate.now(ZoneOffset.UTC));
        Integer usadas=jdbc.query("SELECT requisicoes FROM ia_uso_diario WHERE usuario_id=? AND dia_utc=?",
            rs->rs.next()?rs.getInt(1):null,usuarioId,hoje);
        if(usadas!=null&&usadas>=limite)
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Limite diario de IA atingido. Tente novamente amanha.");
        if(usadas==null)jdbc.update(
            "INSERT INTO ia_uso_diario(usuario_id,dia_utc,requisicoes) VALUES (?,?,1)",usuarioId,hoje);
        else jdbc.update("UPDATE ia_uso_diario SET requisicoes=requisicoes+1 WHERE usuario_id=? AND dia_utc=?",
            usuarioId,hoje);
        return limite-(usadas==null?1:usadas+1);
    }
}
