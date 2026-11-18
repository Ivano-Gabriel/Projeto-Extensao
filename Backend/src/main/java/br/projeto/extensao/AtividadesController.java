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
        @NotBlank @Size(max=1000) String explicacao) {}
    public record AtividadeResumo(
        Long id,Long turmaId,String disciplina,String titulo,String pergunta,List<String> opcoes) {}
    public record NovaResposta(@NotNull @Min(0) @Max(3) Integer opcao) {}
    public record ResultadoResposta(boolean acertou,String explicacao) {}
    private record QuestaoInterna(Long id,int correta,String explicacao) {}

    private final UsuarioRepository usuarios;
    private final JdbcTemplate jdbc;
    public AtividadesController(UsuarioRepository usuarios,JdbcTemplate jdbc){
        this.usuarios=usuarios;
        this.jdbc=jdbc;
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
        Long atividadeId=inserir(
            "INSERT INTO atividades(escola_id,turma_id,professor_id,disciplina,titulo) VALUES (?,?,?,?,?)",
            escolaId,dados.turmaId(),professor.getId(),dados.disciplina(),dados.titulo().trim());
        inserir("INSERT INTO questoes_atividade(atividade_id,pergunta,opcao_a,opcao_b,opcao_c,opcao_d,correta,explicacao) "+
                "VALUES (?,?,?,?,?,?,?,?)",atividadeId,dados.pergunta().trim(),
            dados.opcoes().get(0).trim(),dados.opcoes().get(1).trim(),
            dados.opcoes().get(2).trim(),dados.opcoes().get(3).trim(),
            dados.correta(),dados.explicacao().trim());
        return ResponseEntity.created(URI.create("/api/portal/atividades/"+atividadeId))
            .body(new AtividadeResumo(atividadeId,dados.turmaId(),dados.disciplina(),
                dados.titulo().trim(),dados.pergunta().trim(),dados.opcoes()));
    }
    private List<AtividadeResumo> consultar(String sufixo,Object... argumentos){
        String sql="SELECT a.id,a.turma_id,a.disciplina,a.titulo,q.pergunta,q.opcao_a,q.opcao_b,q.opcao_c,q.opcao_d "+
            "FROM atividades a JOIN questoes_atividade q ON q.atividade_id=a.id "+sufixo+
            " ORDER BY a.criado_em DESC,a.id DESC";
        return jdbc.query(sql,(rs,i)->new AtividadeResumo(rs.getLong("id"),
            rs.getLong("turma_id"),rs.getString("disciplina"),rs.getString("titulo"),
            rs.getString("pergunta"),List.of(rs.getString("opcao_a"),rs.getString("opcao_b"),
                rs.getString("opcao_c"),rs.getString("opcao_d"))),argumentos);
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
            "SELECT q.id,q.correta,q.explicacao FROM questoes_atividade q "+
            "JOIN atividades a ON a.id=q.atividade_id "+
            "JOIN matriculas m ON m.turma_id=a.turma_id "+
            "WHERE a.id=? AND a.escola_id=? AND m.aluno_id=?",
            (rs,i)->new QuestaoInterna(rs.getLong("id"),rs.getInt("correta"),
                rs.getString("explicacao")),atividadeId,escolaId,aluno.getId());
        if(questoes.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        QuestaoInterna questao=questoes.get(0);
        try{
            jdbc.update("INSERT INTO respostas_atividade(questao_id,aluno_id,opcao) VALUES (?,?,?)",
                questao.id(),aluno.getId(),dados.opcao());
        }catch(DataIntegrityViolationException ex){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Atividade ja respondida.");
        }
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(new ResultadoResposta(dados.opcao()==questao.correta(),questao.explicacao()));
    }
}
