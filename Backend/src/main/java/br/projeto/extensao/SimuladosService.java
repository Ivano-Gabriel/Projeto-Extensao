package br.projeto.extensao;

import java.sql.PreparedStatement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SimuladosService {
    public record Resumo(long id,long turmaId,String disciplina,String tema,String dificuldade,
                         Integer nota,String criadoEm) {}
    public record Detalhe(long id,long turmaId,String disciplina,String tema,String dificuldade,
                          Integer nota,Integer acertos,String criadoEm,List<Map<String,Object>> questoes,
                          String aviso) {}
    public record Escolha(long questaoId,int opcao) {}

    private final JdbcTemplate jdbc;
    private final AuditoriaService auditoria;

    public SimuladosService(JdbcTemplate jdbc,AuditoriaService auditoria){
        this.jdbc=jdbc;this.auditoria=auditoria;
    }

    private Long escola(Usuario usuario){
        if(usuario==null||usuario.getPapel()!=Papel.ALUNO||
            usuario.isAdministradorPlataforma()||usuario.getEscolaId()==null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return usuario.getEscolaId();
    }

    private long inserir(String sql,Object... valores){
        KeyHolder chave=new GeneratedKeyHolder();
        jdbc.update(conexao->{
            PreparedStatement statement=conexao.prepareStatement(sql,new String[]{"id"});
            for(int i=0;i<valores.length;i++)statement.setObject(i+1,valores[i]);
            return statement;
        },chave);
        if(chave.getKey()==null)throw new IllegalStateException("ID não gerado.");
        return chave.getKey().longValue();
    }

    @Transactional
    public Detalhe criar(Usuario aluno,long turmaId,String disciplina,String tema,String dificuldade,
            List<IaPedagogicaController.QuizGerado> questoes){
        Long escolaId=escola(aluno);
        if(questoes.size()!=5)throw new IllegalArgumentException("Simulado exige cinco questões.");
        long id=inserir(
            "INSERT INTO simulados_estudo(escola_id,aluno_id,turma_id,disciplina,tema,dificuldade) "+
            "VALUES(?,?,?,?,?,?)",escolaId,aluno.getId(),turmaId,disciplina,tema,dificuldade);
        for(int n=0;n<questoes.size();n++){
            var q=questoes.get(n);
            inserir("INSERT INTO simulados_questoes(simulado_id,ordem,titulo,pergunta,"+
                "opcao_a,opcao_b,opcao_c,opcao_d,correta,explicacao) "+
                "VALUES(?,?,?,?,?,?,?,?,?,?)",
                id,n+1,q.titulo(),q.pergunta(),q.opcoes().get(0),q.opcoes().get(1),
                q.opcoes().get(2),q.opcoes().get(3),q.correta(),q.explicacao());
        }
        auditoria.registrar(escolaId,aluno.getId(),"SIMULADO_GERADO","SIMULADO",id);
        return detalhar(aluno,id);
    }

    public List<Resumo> listar(Usuario aluno){
        Long escolaId=escola(aluno);
        return jdbc.query(
            "SELECT id,turma_id,disciplina,tema,dificuldade,nota,criado_em "+
            "FROM simulados_estudo WHERE escola_id=? AND aluno_id=? "+
            "ORDER BY id DESC LIMIT 20",
            (rs,i)->new Resumo(rs.getLong("id"),rs.getLong("turma_id"),
                rs.getString("disciplina"),rs.getString("tema"),rs.getString("dificuldade"),
                (Integer)rs.getObject("nota"),rs.getTimestamp("criado_em").toLocalDateTime().toString()),
            escolaId,aluno.getId());
    }

    public Detalhe detalhar(Usuario aluno,long id){
        Long escolaId=escola(aluno);
        List<Resumo> lista=jdbc.query(
            "SELECT id,turma_id,disciplina,tema,dificuldade,nota,criado_em "+
            "FROM simulados_estudo WHERE id=? AND escola_id=? AND aluno_id=?",
            (rs,i)->new Resumo(rs.getLong("id"),rs.getLong("turma_id"),
                rs.getString("disciplina"),rs.getString("tema"),rs.getString("dificuldade"),
                (Integer)rs.getObject("nota"),rs.getTimestamp("criado_em").toLocalDateTime().toString()),
            id,escolaId,aluno.getId());
        if(lista.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Resumo resumo=lista.get(0);
        boolean concluido=resumo.nota()!=null;
        List<Map<String,Object>> questoes=jdbc.query(
            "SELECT id,ordem,titulo,pergunta,opcao_a,opcao_b,opcao_c,opcao_d,"+
            "correta,explicacao,opcao_marcada FROM simulados_questoes "+
            "WHERE simulado_id=? ORDER BY ordem",
            (rs,i)->{
                Map<String,Object> q=new LinkedHashMap<>();
                q.put("id",rs.getLong("id"));
                q.put("ordem",rs.getInt("ordem"));
                q.put("titulo",rs.getString("titulo"));
                q.put("pergunta",rs.getString("pergunta"));
                q.put("opcoes",List.of(rs.getString("opcao_a"),rs.getString("opcao_b"),
                    rs.getString("opcao_c"),rs.getString("opcao_d")));
                if(concluido){
                    int correta=rs.getInt("correta");
                    Integer marcada=(Integer)rs.getObject("opcao_marcada");
                    q.put("correta",correta);
                    q.put("explicacao",rs.getString("explicacao"));
                    q.put("opcaoMarcada",marcada);
                    q.put("acertou",marcada!=null&&marcada==correta);
                }
                return q;
            },id);
        Integer acertos=concluido?resumo.nota()/2:null;
        return new Detalhe(id,resumo.turmaId(),resumo.disciplina(),resumo.tema(),
            resumo.dificuldade(),resumo.nota(),acertos,resumo.criadoEm(),questoes,
            "Simulado pessoal de estudo, sem valor de nota escolar. Confira os conteúdos com o professor.");
    }

    @Transactional
    public Detalhe finalizar(Usuario aluno,long id,List<Escolha> respostas){
        Long escolaId=escola(aluno);
        List<Integer> notas=jdbc.query(
            "SELECT nota FROM simulados_estudo WHERE id=? AND escola_id=? AND aluno_id=? FOR UPDATE",
            (rs,i)->(Integer)rs.getObject("nota"),id,escolaId,aluno.getId());
        if(notas.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if(notas.get(0)!=null)throw new ResponseStatusException(HttpStatus.CONFLICT,
            "Simulado já respondido.");
        if(respostas==null||respostas.size()!=5)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Responda às cinco questões antes de enviar.");
        Map<Long,Integer> marcadas=new HashMap<>();
        for(var resposta:respostas){
            if(resposta.questaoId()<=0||resposta.opcao()<0||resposta.opcao()>3||
                marcadas.putIfAbsent(resposta.questaoId(),resposta.opcao())!=null)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Respostas repetidas ou inválidas.");
        }
        List<Map.Entry<Long,Integer>> gabaritos=jdbc.query(
            "SELECT id,correta FROM simulados_questoes WHERE simulado_id=? ORDER BY ordem",
            (rs,i)->Map.entry(rs.getLong("id"),rs.getInt("correta")),id);
        if(gabaritos.size()!=5||!marcadas.keySet().equals(
            gabaritos.stream().map(Map.Entry::getKey).collect(java.util.stream.Collectors.toSet())))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "As respostas não correspondem às questões deste simulado.");
        int acertos=0;
        for(var q:gabaritos){
            int escolha=marcadas.get(q.getKey());
            if(escolha==q.getValue())acertos++;
            jdbc.update("UPDATE simulados_questoes SET opcao_marcada=? WHERE id=? AND simulado_id=?",
                escolha,q.getKey(),id);
        }
        int nota=acertos*2;
        int salvos=jdbc.update("UPDATE simulados_estudo SET nota=?,finalizado_em=CURRENT_TIMESTAMP "+
            "WHERE id=? AND escola_id=? AND aluno_id=? AND nota IS NULL",
            nota,id,escolaId,aluno.getId());
        if(salvos!=1)throw new ResponseStatusException(HttpStatus.CONFLICT);
        auditoria.registrar(escolaId,aluno.getId(),"SIMULADO_CONCLUIDO","SIMULADO",id);
        return detalhar(aluno,id);
    }
}
