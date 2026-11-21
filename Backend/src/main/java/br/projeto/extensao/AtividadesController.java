package br.projeto.extensao;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.sql.PreparedStatement;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class AtividadesController {
    public record NovaAtividade(
        @NotNull Long turmaId,
        @NotBlank @Pattern(regexp="[A-Z_]{3,60}") String disciplina,
        @NotBlank @Size(max=150) String titulo,
        @NotBlank @Size(max=500) String pergunta,
        @NotNull @Size(min=4,max=4) List<@NotBlank @Size(max=200) String> opcoes,
        @NotNull @Min(0) @Max(3) Integer correta,
        @NotBlank @Size(max=1000) String explicacao,LocalDate prazoEntrega) {}
    public record LoteAtividades(@NotNull @Size(min=2,max=6)
        List<@NotNull @Valid NovaAtividade> atividades) {}
    public record AtividadeResumo(
        Long id,Long turmaId,String disciplina,String titulo,String pergunta,List<String> opcoes,LocalDate prazoEntrega) {}
    public record NovaResposta(@NotNull @Min(0) @Max(3) Integer opcao) {}
    public record ResultadoResposta(boolean acertou,String explicacao) {}
    private record QuestaoInterna(Long id,int correta,String explicacao,LocalDate prazoEntrega) {}

    private final UsuarioRepository usuarios;
    private final JdbcTemplate jdbc;
    private final AuditoriaService auditoria;
    public AtividadesController(UsuarioRepository usuarios,JdbcTemplate jdbc,AuditoriaService auditoria){
        this.usuarios=usuarios;
        this.jdbc=jdbc;
        this.auditoria=auditoria;
    }
    private static LocalDate hoje(){return LocalDate.now(ZoneId.of("America/Sao_Paulo"));}
    private static java.sql.Date dataSql(LocalDate d){return d==null?null:java.sql.Date.valueOf(d);}
    private static LocalDate dataResultado(java.sql.ResultSet rs,String coluna)throws java.sql.SQLException {
        java.sql.Date d=rs.getDate(coluna);
        return d==null?null:d.toLocalDate();
    }
    private static void prazoValido(LocalDate prazo){
        if(prazo!=null&&prazo.isBefore(hoje()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Prazo de entrega anterior a hoje.");
    }
    private Usuario usuario(Authentication auth){
        if(auth==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return usuarios.findByEmail(auth.getName())
            .orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
    private Long escola(Usuario user){
        if(user.getEscolaId()==null||user.isAdministradorPlataforma())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return user.getEscolaId();
    }
    private Long inserir(String sql,Object... valores){
        KeyHolder chave=new GeneratedKeyHolder();
        jdbc.update(conexao->{
            PreparedStatement stmt=conexao.prepareStatement(sql,new String[]{"id"});
            for(int i=0;i<valores.length;i++)stmt.setObject(i+1,valores[i]);
            return stmt;
        },chave);
        if(chave.getKey()==null)throw new IllegalStateException("Identificador nao gerado.");
        return chave.getKey().longValue();
    }

    @Transactional
    @PostMapping("/professor/atividades/lote")
    public ResponseEntity<List<AtividadeResumo>> publicarLote(
            @Valid @RequestBody LoteAtividades lote,Authentication auth){
        Usuario professor=usuario(auth);
        if(professor.getPapel()!=Papel.PROFESSOR)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        Long turmaId=lote.atividades().get(0).turmaId();
        String disciplina=lote.atividades().get(0).disciplina();
        for(NovaAtividade item:lote.atividades()){
            if(!turmaId.equals(item.turmaId())||!disciplina.equals(item.disciplina()))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Todas as questões do pacote devem pertencer à mesma turma e disciplina.");
        }
        List<AtividadeResumo> publicadas=new java.util.ArrayList<>();
        for(NovaAtividade item:lote.atividades())
            publicadas.add(publicar(item,auth).getBody());
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
            .body(publicadas);
    }
    @Transactional
    @PostMapping("/professor/atividades")
    public ResponseEntity<AtividadeResumo> publicar(@Valid @RequestBody NovaAtividade dados,Authentication auth){
        Usuario professor=usuario(auth);
        Long escolaId=escola(professor);
        if(professor.getPapel()!=Papel.PROFESSOR)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        Integer vinculado=jdbc.queryForObject(
            "SELECT COUNT(*) FROM turmas t JOIN vinculos_docentes v ON v.turma_id=t.id "+
            "WHERE t.id=? AND t.escola_id=? AND v.professor_id=? AND v.disciplina=?",
            Integer.class,dados.turmaId(),escolaId,professor.getId(),dados.disciplina());
        if(vinculado==0)throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Turma nao vinculada ao docente.");
        prazoValido(dados.prazoEntrega());
        Long atividadeId=inserir(
            "INSERT INTO atividades(escola_id,turma_id,professor_id,disciplina,titulo,prazo_entrega) VALUES (?,?,?,?,?,?)",
            escolaId,dados.turmaId(),professor.getId(),dados.disciplina(),dados.titulo().trim(),
            dataSql(dados.prazoEntrega()));
        inserir("INSERT INTO questoes_atividade(atividade_id,pergunta,opcao_a,opcao_b,opcao_c,opcao_d,correta,explicacao) "+
                "VALUES (?,?,?,?,?,?,?,?)",atividadeId,dados.pergunta().trim(),
            dados.opcoes().get(0).trim(),dados.opcoes().get(1).trim(),
            dados.opcoes().get(2).trim(),dados.opcoes().get(3).trim(),
            dados.correta(),dados.explicacao().trim());
        auditoria.registrar(escolaId,professor.getId(),"ATIVIDADE_PUBLICADA","ATIVIDADE",atividadeId);
        return ResponseEntity.created(URI.create("/api/portal/atividades/"+atividadeId))
            .body(new AtividadeResumo(atividadeId,dados.turmaId(),dados.disciplina(),
                dados.titulo().trim(),dados.pergunta().trim(),dados.opcoes(),dados.prazoEntrega()));
    }
    private List<AtividadeResumo> consultar(String sufixo,Object... argumentos){
        String sql="SELECT a.id,a.turma_id,a.disciplina,a.titulo,a.prazo_entrega,q.pergunta,q.opcao_a,q.opcao_b,q.opcao_c,q.opcao_d "+
            "FROM atividades a JOIN questoes_atividade q ON q.atividade_id=a.id "+sufixo+
            " ORDER BY a.criado_em DESC,a.id DESC";
        return jdbc.query(sql,(rs,i)->new AtividadeResumo(rs.getLong("id"),
            rs.getLong("turma_id"),rs.getString("disciplina"),rs.getString("titulo"),
            rs.getString("pergunta"),List.of(rs.getString("opcao_a"),rs.getString("opcao_b"),
                rs.getString("opcao_c"),rs.getString("opcao_d")),dataResultado(rs,"prazo_entrega")),argumentos);
    }
    @GetMapping("/portal/atividades")
    public ResponseEntity<List<AtividadeResumo>> minhasAtividades(Authentication auth){
        Usuario atual=usuario(auth);
        Long escolaId=escola(atual);
        List<AtividadeResumo> dados=switch(atual.getPapel()){
            case ALUNO -> consultar("JOIN matriculas m ON m.turma_id=a.turma_id "+
                "WHERE a.escola_id=? AND m.aluno_id=?",escolaId,atual.getId());
            case PROFESSOR -> consultar("JOIN vinculos_docentes v ON v.turma_id=a.turma_id "+
                "AND v.disciplina=a.disciplina WHERE a.escola_id=? AND v.professor_id=?",
                escolaId,atual.getId());
            case DIRECAO -> consultar("WHERE a.escola_id=?",escolaId);
        };
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(dados);
    }
    @GetMapping("/portal/atividades/{atividadeId}")
    public ResponseEntity<AtividadeResumo> detalhar(@PathVariable Long atividadeId,Authentication auth){
        List<AtividadeResumo> visiveis=minhasAtividades(auth).getBody();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(
            visiveis.stream().filter(x->x.id().equals(atividadeId)).findFirst()
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND)));
    }
    @Transactional
    @PostMapping("/portal/atividades/{atividadeId}/respostas")
    public ResponseEntity<ResultadoResposta> responder(@PathVariable Long atividadeId,
            @Valid @RequestBody NovaResposta dados,Authentication auth){
        Usuario aluno=usuario(auth);
        Long escolaId=escola(aluno);
        if(aluno.getPapel()!=Papel.ALUNO)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        List<QuestaoInterna> questoes=jdbc.query(
            "SELECT q.id,q.correta,q.explicacao,a.prazo_entrega FROM questoes_atividade q "+
            "JOIN atividades a ON a.id=q.atividade_id "+
            "JOIN matriculas m ON m.turma_id=a.turma_id "+
            "WHERE a.id=? AND a.escola_id=? AND m.aluno_id=?",
            (rs,i)->new QuestaoInterna(rs.getLong("id"),rs.getInt("correta"),
                rs.getString("explicacao"),dataResultado(rs,"prazo_entrega")),atividadeId,escolaId,aluno.getId());
        if(questoes.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        QuestaoInterna questao=questoes.get(0);
        if(questao.prazoEntrega()!=null&&questao.prazoEntrega().isBefore(hoje()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Prazo da atividade encerrado.");
        try{
            jdbc.update("INSERT INTO respostas_atividade(questao_id,aluno_id,opcao) VALUES (?,?,?)",
                questao.id(),aluno.getId(),dados.opcao());
        }catch(DataIntegrityViolationException ex){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Atividade ja respondida.");
        }
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(new ResultadoResposta(dados.opcao()==questao.correta(),questao.explicacao()));
    }

    private void autorizarEdicao(Long atividadeId,Usuario professor,Long turmaId,String disciplina) {
        if(professor.getPapel()!=Papel.PROFESSOR)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        Long escolaId=escola(professor);
        Integer autorizados=jdbc.queryForObject(
            "SELECT COUNT(*) FROM atividades a JOIN vinculos_docentes v "+
            "ON v.turma_id=a.turma_id AND v.professor_id=? AND v.disciplina=a.disciplina "+
            "WHERE a.id=? AND a.escola_id=? AND a.professor_id=? "+
            (turmaId!=null?"AND a.turma_id=? AND a.disciplina=?":""),
            Integer.class,
            turmaId!=null?new Object[]{professor.getId(),atividadeId,escolaId,professor.getId(),turmaId,disciplina}:
                new Object[]{professor.getId(),atividadeId,escolaId,professor.getId()});
        if(autorizados==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    private void semRespostas(Long atividadeId) {
        Integer quantidade=jdbc.queryForObject(
            "SELECT COUNT(*) FROM respostas_atividade r JOIN questoes_atividade q ON q.id=r.questao_id "+
            "WHERE q.atividade_id=?",Integer.class,atividadeId);
        if(quantidade>0)throw new ResponseStatusException(HttpStatus.CONFLICT,
            "Atividade com respostas nao pode ser alterada; crie uma nova versao.");
    }
    @GetMapping("/professor/atividades/{atividadeId}/edicao")
    public ResponseEntity<NovaAtividade> dadosParaEdicao(@PathVariable Long atividadeId,Authentication auth){
        Usuario professor=usuario(auth);
        autorizarEdicao(atividadeId,professor,null,null);
        List<NovaAtividade> dados=jdbc.query(
            "SELECT a.turma_id,a.disciplina,a.titulo,q.pergunta,q.opcao_a,q.opcao_b,q.opcao_c,q.opcao_d,q.correta,q.explicacao,a.prazo_entrega "+
            "FROM atividades a JOIN questoes_atividade q ON q.atividade_id=a.id WHERE a.id=?",
            (rs,i)->new NovaAtividade(rs.getLong("turma_id"),rs.getString("disciplina"),
                rs.getString("titulo"),rs.getString("pergunta"),
                List.of(rs.getString("opcao_a"),rs.getString("opcao_b"),rs.getString("opcao_c"),rs.getString("opcao_d")),
                rs.getInt("correta"),rs.getString("explicacao"),dataResultado(rs,"prazo_entrega")),atividadeId);
        if(dados.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(dados.get(0));
    }
    @Transactional
    @PutMapping("/professor/atividades/{atividadeId}")
    public ResponseEntity<Void> editar(@PathVariable Long atividadeId,
            @Valid @RequestBody NovaAtividade dados,Authentication auth){
        Usuario professor=usuario(auth);
        autorizarEdicao(atividadeId,professor,dados.turmaId(),dados.disciplina());
        semRespostas(atividadeId);
        prazoValido(dados.prazoEntrega());
        jdbc.update("UPDATE atividades SET titulo=?,prazo_entrega=? WHERE id=?",
            dados.titulo().trim(),dataSql(dados.prazoEntrega()),atividadeId);
        jdbc.update("UPDATE questoes_atividade SET pergunta=?,opcao_a=?,opcao_b=?,opcao_c=?,opcao_d=?,correta=?,explicacao=? "+
            "WHERE atividade_id=?",dados.pergunta().trim(),dados.opcoes().get(0).trim(),
            dados.opcoes().get(1).trim(),dados.opcoes().get(2).trim(),dados.opcoes().get(3).trim(),
            dados.correta(),dados.explicacao().trim(),atividadeId);
        auditoria.registrar(escola(professor),professor.getId(),"ATIVIDADE_EDITADA","ATIVIDADE",atividadeId);
        return ResponseEntity.noContent().build();
    }
    @Transactional
    @DeleteMapping("/professor/atividades/{atividadeId}")
    public ResponseEntity<Void> remover(@PathVariable Long atividadeId,Authentication auth){
        Usuario professor=usuario(auth);
        autorizarEdicao(atividadeId,professor,null,null);
        semRespostas(atividadeId);
        jdbc.update("DELETE FROM questoes_atividade WHERE atividade_id=?",atividadeId);
        jdbc.update("DELETE FROM atividades WHERE id=?",atividadeId);
        auditoria.registrar(escola(professor),professor.getId(),"ATIVIDADE_REMOVIDA","ATIVIDADE",atividadeId);
        return ResponseEntity.noContent().build();
    }

}
