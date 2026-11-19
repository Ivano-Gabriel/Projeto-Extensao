package br.projeto.extensao;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/portal")
public class AssistenteController {
    public record Pergunta(@NotBlank @Size(max=500) String pergunta) {}
    public record Orientacao(String resposta,String tipo,List<String> fontes) {}

    private final JdbcTemplate jdbc;
    private final UsuarioRepository usuarios;
    public AssistenteController(JdbcTemplate jdbc,UsuarioRepository usuarios){
        this.jdbc=jdbc;this.usuarios=usuarios;
    }
    private String normalizar(String texto){
        return Normalizer.normalize(texto.toLowerCase(Locale.ROOT),Normalizer.Form.NFD)
            .replaceAll("\\p{M}+","").replaceAll("\\s+"," ").trim();
    }
    private boolean fala(String texto,String... termos){
        for(String termo:termos)if(texto.contains(termo))return true;
        return false;
    }
    private Orientacao retornar(String resposta,String tipo,String fonte){
        return new Orientacao(resposta,tipo,List.of(fonte));
    }
    @PostMapping("/assistente")
    public ResponseEntity<Orientacao> perguntar(@Valid @RequestBody Pergunta entrada,Authentication auth){
        if(auth==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Usuario aluno=usuarios.findByEmail(auth.getName())
            .orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if(aluno.isAdministradorPlataforma()||aluno.getPapel()!=Papel.ALUNO||aluno.getEscolaId()==null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        String pergunta=normalizar(entrada.pergunta());
        long escolaId=aluno.getEscolaId();
        long alunoId=aluno.getId();

        Orientacao resposta;
        if(fala(pergunta,"nota","media","boletim","aprovacao")){
            resposta=retornar("Suas notas oficiais não estão cadastradas no Extensão. "+
                "O resultado dos quizzes serve para revisar conteúdos, não é nota escolar.",
                "INDISPONIVEL","Dados oficiais da escola");
        }else if(fala(pergunta,"falta","frequencia","presenca","quantas vezes posso faltar")){
            resposta=retornar("Suas faltas e frequências oficiais não estão cadastradas. "+
                "Não posso calcular quantas faltas restam sem o calendário e os registros da escola.",
                "INDISPONIVEL","Dados oficiais da escola");
        }else if(fala(pergunta,"atividade","exercicio","tarefa","quiz","prova")){
            List<String> titulos=jdbc.query(
                "SELECT a.disciplina,a.titulo FROM atividades a "+
                "JOIN matriculas m ON m.turma_id=a.turma_id "+
                "JOIN turmas t ON t.id=m.turma_id "+
                "WHERE a.escola_id=? AND t.escola_id=? AND m.aluno_id=? "+
                "ORDER BY a.criado_em DESC,a.id DESC LIMIT 4",
                (rs,i)->rs.getString("disciplina")+": "+rs.getString("titulo"),escolaId,escolaId,alunoId);
            resposta=retornar(titulos.isEmpty()?
                "Você ainda não tem atividades publicadas nas suas turmas.":
                "Suas atividades mais recentes: "+String.join("; ",titulos)+". "+
                "Abra Minha turma para responder e ver a explicação.",
                "ESCOLAR","Atividades autorizadas da sua turma");
        }else if(fala(pergunta,"aviso","recado","comunicado","novidade")){
            List<String> titulos=jdbc.query(
                "SELECT c.titulo FROM comunicados c WHERE c.escola_id=? "+
                "AND c.publico IN ('TODOS','ALUNOS') AND "+
                "(c.turma_id IS NULL OR EXISTS(SELECT 1 FROM matriculas m "+
                "WHERE m.turma_id=c.turma_id AND m.aluno_id=?)) "+
                "ORDER BY c.importante DESC,c.criado_em DESC LIMIT 4",
                (rs,i)->rs.getString("titulo"),escolaId,alunoId);
            resposta=retornar(titulos.isEmpty()?
                "Não há avisos publicados para sua escola ou turma.":
                "Avisos para você: "+String.join("; ",titulos)+". "+
                "Abra Minha turma para ler os detalhes.","ESCOLAR","Comunicados autorizados");
        }else if(fala(pergunta,"professor","docente","quem ensina")){
            List<String> docentes=jdbc.query(
                "SELECT DISTINCT u.nome,v.disciplina FROM vinculos_docentes v "+
                "JOIN turmas t ON t.id=v.turma_id JOIN matriculas m ON m.turma_id=t.id "+
                "JOIN usuarios u ON u.id=v.professor_id "+
                "WHERE m.aluno_id=? AND t.escola_id=? AND u.escola_id=? "+
                "ORDER BY u.nome,v.disciplina LIMIT 8",
                (rs,i)->rs.getString("nome")+" ("+rs.getString("disciplina")+")",
                alunoId,escolaId,escolaId);
            resposta=retornar(docentes.isEmpty()?
                "Sua turma ainda não tem professores vinculados. Consulte a direção.":
                "Professores vinculados à sua turma: "+String.join("; ",docentes)+".",
                "ESCOLAR","Vínculos docentes autorizados");
        }else if(fala(pergunta,"turma","sala","ano escolar")){
            List<String> turmas=jdbc.query(
                "SELECT t.codigo,t.nome FROM turmas t JOIN matriculas m ON m.turma_id=t.id "+
                "WHERE m.aluno_id=? AND t.escola_id=? ORDER BY t.ano_letivo DESC,t.codigo",
                (rs,i)->rs.getString("codigo")+" — "+rs.getString("nome"),alunoId,escolaId);
            resposta=retornar(turmas.isEmpty()?
                "Sua conta ainda não está matriculada em uma turma. Peça ajuda à direção.":
                "Sua turma: "+String.join("; ",turmas)+".",
                "ESCOLAR","Matrícula autorizada");
        }else if(fala(pergunta,"revis","memori","decor","aprend","estud","resum","fixar")){
            resposta=retornar("Uma estratégia: leia um resumo curto, feche o material e "+
                "tente explicar com suas palavras. Depois responda um quiz sem consultar. "+
                "Revise o que errou amanhã e novamente em alguns dias.",
                "ORIENTACAO","Estratégia de recuperação ativa e revisão espaçada");
        }else{
            resposta=retornar("Posso ajudar com suas turmas, professores, atividades, avisos e "+
                "organização de estudos. Pergunte, por exemplo: 'Quais são minhas atividades?'. "+
                "Para dúvidas sobre conteúdos, abra um material e faça um quiz. "+
                "Ainda não sou um chat de IA generativa.",
                "ORIENTACAO","Funções atuais do Extensão");
        }
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(resposta);
    }
}
