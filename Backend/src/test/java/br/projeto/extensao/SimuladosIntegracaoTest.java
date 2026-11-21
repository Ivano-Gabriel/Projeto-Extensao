package br.projeto.extensao;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SimuladosIntegracaoTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UsuarioRepository usuarios;
    @Autowired PasswordEncoder encoder;

    long escolaA,escolaB,alunoA,alunoB,professor,turmaA,turmaB;

    long criar(String email,Papel papel,long escola){
        Usuario u=new Usuario(email,email,encoder.encode("SenhaApenasParaTeste#2026"),papel);
        u.vincularEscola(escola);
        return usuarios.saveAndFlush(u).getId();
    }
    @BeforeEach void preparar(){
        jdbc.update("DELETE FROM auditoria_escolar");
        jdbc.update("DELETE FROM simulados_questoes");
        jdbc.update("DELETE FROM simulados_estudo");
        jdbc.update("DELETE FROM respostas_atividade");
        jdbc.update("DELETE FROM questoes_atividade");
        jdbc.update("DELETE FROM atividades");
        jdbc.update("DELETE FROM vinculos_docentes");
        jdbc.update("DELETE FROM matriculas");
        jdbc.update("DELETE FROM turmas");
        usuarios.deleteAll();
        jdbc.update("DELETE FROM escolas");
        jdbc.update("INSERT INTO escolas(codigo,nome) VALUES ('prova-a','Escola Prova A'),('prova-b','Escola Prova B')");
        escolaA=jdbc.queryForObject("SELECT id FROM escolas WHERE codigo='prova-a'",Long.class);
        escolaB=jdbc.queryForObject("SELECT id FROM escolas WHERE codigo='prova-b'",Long.class);
        alunoA=criar("aluno-prova-a@escola.test",Papel.ALUNO,escolaA);
        alunoB=criar("aluno-prova-b@escola.test",Papel.ALUNO,escolaB);
        professor=criar("prof-prova-a@escola.test",Papel.PROFESSOR,escolaA);
        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES (?,'3A','Turma A',2026)",escolaA);
        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES (?,'3B','Turma B',2026)",escolaB);
        turmaA=jdbc.queryForObject("SELECT id FROM turmas WHERE escola_id=?",Long.class,escolaA);
        turmaB=jdbc.queryForObject("SELECT id FROM turmas WHERE escola_id=?",Long.class,escolaB);
        jdbc.update("INSERT INTO matriculas(turma_id,aluno_id,ano_letivo) VALUES (?,?,2026)",turmaA,alunoA);
        jdbc.update("INSERT INTO matriculas(turma_id,aluno_id,ano_letivo) VALUES (?,?,2026)",turmaB,alunoB);
        jdbc.update("INSERT INTO vinculos_docentes(turma_id,professor_id,disciplina) VALUES (?,?,?)",
            turmaA,professor,"MATEMATICA");
    }
    long salvarSimulado(){
        jdbc.update("INSERT INTO simulados_estudo(escola_id,aluno_id,turma_id,disciplina,tema,dificuldade) "+
            "VALUES(?,?,?,'MATEMATICA','Frações','MEDIO')",escolaA,alunoA,turmaA);
        long id=jdbc.queryForObject("SELECT id FROM simulados_estudo WHERE aluno_id=?",Long.class,alunoA);
        for(int ordem=1;ordem<=5;ordem++)jdbc.update(
            "INSERT INTO simulados_questoes(simulado_id,ordem,titulo,pergunta,opcao_a,opcao_b,opcao_c,opcao_d,correta,explicacao) "+
            "VALUES(?,?,? ,?,'1','2','3','4',2,?)",
            id,ordem,"Treino "+ordem,"Quanto vale "+ordem+"?", "Conceito explicado "+ordem);
        return id;
    }
    String respostas(long id,int[] indices,int[] opcoes){
        var out=new StringBuilder("{\"respostas\":[");
        for(int i=0;i<indices.length;i++){
            if(i>0)out.append(',');
            out.append("{\"questaoId\":").append(indices[i]).append(",\"opcao\":").append(opcoes[i]).append("}");
        }
        return out.append("]}").toString();
    }
    int[] questoes(long id){
        return jdbc.query("SELECT id FROM simulados_questoes WHERE simulado_id=? ORDER BY ordem",
            (rs,i)->rs.getInt(1),id).stream().mapToInt(Integer::intValue).toArray();
    }

    @Test void alunoVeProvaSemGabaritoECorrigeNoServidorComNotaDeZeroADez()throws Exception{
        long id=salvarSimulado();
        String url="/api/portal/provas/simulados/"+id;
        mvc.perform(get(url).with(user("aluno-prova-a@escola.test").roles("ALUNO")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.questoes.length()").value(5))
            .andExpect(jsonPath("$.questoes[0].pergunta").exists())
            .andExpect(jsonPath("$.questoes[0].correta").doesNotExist())
            .andExpect(jsonPath("$.questoes[0].explicacao").doesNotExist())
            .andExpect(jsonPath("$.nota").doesNotExist());
        mvc.perform(get("/api/portal/provas/simulados")
            .with(user("aluno-prova-a@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].tema").value("Frações"));
        mvc.perform(get("/api/portal/provas/simulados")
            .with(user("aluno-prova-b@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        int[] q=questoes(id);
        String envio=respostas(id,q,new int[]{2,2,2,1,0});
        mvc.perform(post(url+"/respostas")
            .with(user("aluno-prova-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(envio))
            .andExpect(status().isOk()).andExpect(jsonPath("$.nota").value(6))
            .andExpect(jsonPath("$.acertos").value(3))
            .andExpect(jsonPath("$.questoes[0].correta").value(2))
            .andExpect(jsonPath("$.questoes[4].explicacao").exists());
        mvc.perform(get(url).with(user("aluno-prova-a@escola.test").roles("ALUNO")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nota").value(6))
            .andExpect(jsonPath("$.questoes[1].opcaoMarcada").value(2));
        mvc.perform(post(url+"/respostas")
            .with(user("aluno-prova-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(envio))
            .andExpect(status().isConflict());
        org.junit.jupiter.api.Assertions.assertEquals(5,jdbc.queryForObject(
            "SELECT COUNT(*) FROM simulados_questoes WHERE simulado_id=? AND opcao_marcada IS NOT NULL",
            Integer.class,id));
        org.junit.jupiter.api.Assertions.assertEquals(1,jdbc.queryForObject(
            "SELECT COUNT(*) FROM auditoria_escolar WHERE acao='SIMULADO_CONCLUIDO' AND ator_id=?",
            Integer.class,alunoA));
    }
    @Test void bloqueiaFraudeRespostasIncompletasAlteradasEEscolasDiferentes() throws Exception{
        long id=salvarSimulado();
        int[] q=questoes(id);
        String url="/api/portal/provas/simulados/"+id;
        mvc.perform(get(url).with(user("aluno-prova-b@escola.test").roles("ALUNO")))
            .andExpect(status().isNotFound());
        mvc.perform(get(url).with(user("prof-prova-a@escola.test").roles("PROFESSOR")))
            .andExpect(status().isForbidden());
        mvc.perform(post(url+"/respostas")
            .with(user("aluno-prova-b@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(respostas(id,q,new int[]{2,2,2,2,2})))
            .andExpect(status().isNotFound());
        mvc.perform(post(url+"/respostas")
            .with(user("prof-prova-a@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(respostas(id,q,new int[]{2,2,2,2,2})))
            .andExpect(status().isForbidden());
        mvc.perform(post(url+"/respostas")
            .with(user("aluno-prova-a@escola.test").roles("ALUNO"))
            .contentType(MediaType.APPLICATION_JSON).content(respostas(id,q,new int[]{2,2,2,2,2})))
            .andExpect(status().isForbidden());
        mvc.perform(post(url+"/respostas")
            .with(user("aluno-prova-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(respostas(id,new int[]{q[0],q[0],q[2],q[3],q[4]},new int[]{2,2,2,2,2})))
            .andExpect(status().isBadRequest());
        mvc.perform(post(url+"/respostas")
            .with(user("aluno-prova-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(respostas(id,new int[]{q[0],q[1]},new int[]{2,2})))
            .andExpect(status().isBadRequest());
        mvc.perform(post(url+"/respostas")
            .with(user("aluno-prova-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(respostas(id,q,new int[]{2,2,2,2,9})))
            .andExpect(status().isBadRequest());
        org.junit.jupiter.api.Assertions.assertNull(jdbc.queryForObject(
            "SELECT nota FROM simulados_estudo WHERE id=?",Integer.class,id));
    }
    @Test void geracaoRealExigeMatriculaDisciplinaPrivacidadeCotaEProvedor()throws Exception{
        String url="/api/portal/provas/simulados";
        String base="{\"turmaId\":"+turmaA+",\"disciplina\":\"MATEMATICA\",\"tema\":\"Frações\","
            +"\"dificuldade\":\"FACIL\",\"fonteTexto\":\"Metade de um inteiro.\"}";
        mvc.perform(post(url).with(user("aluno-prova-a@escola.test").roles("ALUNO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(base))
            .andExpect(status().isServiceUnavailable());
        mvc.perform(post(url).with(user("aluno-prova-b@escola.test").roles("ALUNO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(base))
            .andExpect(status().isForbidden());
        mvc.perform(post(url).with(user("prof-prova-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(base))
            .andExpect(status().isForbidden());
        mvc.perform(post(url).with(user("aluno-prova-a@escola.test").roles("ALUNO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content(base.replace("Metade de um inteiro.","aluno@exemplo.com")))
            .andExpect(status().isBadRequest());
        mvc.perform(post(url).with(user("aluno-prova-a@escola.test").roles("ALUNO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content(base.replace("FACIL","IMPOSSIVEL")))
            .andExpect(status().isBadRequest());
        org.junit.jupiter.api.Assertions.assertEquals(0,jdbc.queryForObject(
            "SELECT COUNT(*) FROM simulados_estudo",Integer.class));
    }
}
