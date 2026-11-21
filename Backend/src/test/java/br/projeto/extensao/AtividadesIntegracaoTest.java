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
class AtividadesIntegracaoTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UsuarioRepository usuarios;
    @Autowired PasswordEncoder encoder;

    long turmaA;
    long turmaB;

    @BeforeEach
    void preparar(){
        jdbc.update("DELETE FROM auditoria_escolar");
        jdbc.update("DELETE FROM respostas_atividade");
        jdbc.update("DELETE FROM questoes_atividade");
        jdbc.update("DELETE FROM atividades");
        jdbc.update("DELETE FROM vinculos_docentes");
        jdbc.update("DELETE FROM matriculas");
        jdbc.update("DELETE FROM turmas");
        usuarios.deleteAll();
        jdbc.update("DELETE FROM escolas");
        jdbc.update("INSERT INTO escolas(codigo,nome) VALUES ('escola-a','Escola A'),('escola-b','Escola B')");
        long escolaA=jdbc.queryForObject("SELECT id FROM escolas WHERE codigo='escola-a'",Long.class);
        long escolaB=jdbc.queryForObject("SELECT id FROM escolas WHERE codigo='escola-b'",Long.class);
        long alunoA=criar("aluno-a@escola.test",Papel.ALUNO,escolaA);
        criar("aluno-b@escola.test",Papel.ALUNO,escolaB);
        long profA=criar("prof-a@escola.test",Papel.PROFESSOR,escolaA);
        criar("prof-b@escola.test",Papel.PROFESSOR,escolaB);
        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES (?,'3A','Terceiro A',2026)",escolaA);
        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES (?,'3B','Terceiro B',2026)",escolaB);
        turmaA=jdbc.queryForObject("SELECT id FROM turmas WHERE codigo='3A'",Long.class);
        turmaB=jdbc.queryForObject("SELECT id FROM turmas WHERE codigo='3B'",Long.class);
        jdbc.update("INSERT INTO matriculas(turma_id,aluno_id,ano_letivo) VALUES (?,?,2026)",turmaA,alunoA);
        jdbc.update("INSERT INTO vinculos_docentes(turma_id,professor_id,disciplina) VALUES (?,?,?)",
            turmaA,profA,"MATEMATICA");
    }
    long criar(String email,Papel papel,long escola){
        Usuario usuario=new Usuario(email,email,encoder.encode("SenhaMuitoForteTeste!"),papel);
        usuario.vincularEscola(escola);
        return usuarios.saveAndFlush(usuario).getId();
    }
    String entrada(long turma){
        return """
          {"turmaId":%d,"disciplina":"MATEMATICA","titulo":"Desafio de porcentagem",
           "pergunta":"Qual é 20 por cento de 50?",
           "opcoes":["5","10","20","25"],"correta":1,
           "explicacao":"20 por cento de 50 é 10."}
          """.formatted(turma);
    }
    long publicar()throws Exception{
        mvc.perform(post("/api/professor/atividades")
            .with(user("prof-a@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(entrada(turmaA)))
            .andExpect(status().isCreated());
        return jdbc.queryForObject("SELECT id FROM atividades WHERE titulo='Desafio de porcentagem'",Long.class);
    }
    @Test
    void professorVinculadoPublicaEAlunoRecebeSemGabarito()throws Exception{
        publicar();
        mvc.perform(get("/api/portal/atividades")
            .with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].titulo").value("Desafio de porcentagem"))
            .andExpect(jsonPath("$[0].pergunta").exists())
            .andExpect(jsonPath("$[0].correta").doesNotExist())
            .andExpect(jsonPath("$[0].explicacao").doesNotExist());
        mvc.perform(get("/api/portal/atividades")
            .with(user("aluno-b@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
    }
    @Test
    void professorDeOutraEscolaNaoPodePublicarNaTurma()throws Exception{
        mvc.perform(post("/api/professor/atividades")
            .with(user("prof-b@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(entrada(turmaA)))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/professor/atividades")
            .with(user("aluno-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(entrada(turmaA)))
            .andExpect(status().isForbidden());
    }
    @Test
    void alunoVinculadoRespondeUmaVezEBuscaExplicacaoDepois()throws Exception{
        long id=publicar();
        mvc.perform(post("/api/portal/atividades/"+id+"/respostas")
            .with(user("aluno-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"opcao\":1}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.acertou").value(true))
            .andExpect(jsonPath("$.explicacao").value("20 por cento de 50 é 10."));
        mvc.perform(post("/api/portal/atividades/"+id+"/respostas")
            .with(user("aluno-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"opcao\":0}"))
            .andExpect(status().isConflict());
        mvc.perform(post("/api/portal/atividades/"+id+"/respostas")
            .with(user("aluno-b@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"opcao\":1}"))
            .andExpect(status().isNotFound());
    }

    @Test
    void pacoteRevisadoProfessorPublicaTresQuestoesEAlunoRespondeSemAcessarGabarito() throws Exception {
        String lote="""
          {"atividades":[
            {"turmaId":%d,"disciplina":"MATEMATICA","titulo":"QA: Frações 1",
             "pergunta":"Quanto e metade de 10?","opcoes":["3","5","6","8"],"correta":1,
             "explicacao":"Metade de 10 é 5."},
            {"turmaId":%d,"disciplina":"MATEMATICA","titulo":"QA: Frações 2",
             "pergunta":"Quanto e dobro de 4?","opcoes":["2","4","8","10"],"correta":2,
             "explicacao":"Duas vezes quatro é oito."},
            {"turmaId":%d,"disciplina":"MATEMATICA","titulo":"QA: Frações 3",
             "pergunta":"Quanto e um quarto de 20?","opcoes":["4","5","10","15"],"correta":1,
             "explicacao":"Vinte dividido por quatro resulta cinco."}
          ]}
          """.formatted(turmaA,turmaA,turmaA);
        String url="/api/professor/atividades/lote";
        mvc.perform(post(url).with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(lote))
            .andExpect(status().isCreated()).andExpect(jsonPath("$[2].titulo").value("QA: Frações 3"));
        org.junit.jupiter.api.Assertions.assertEquals(3,
            jdbc.queryForObject("SELECT COUNT(*) FROM atividades",Integer.class));
        mvc.perform(get("/api/portal/atividades").with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[2].titulo").exists())
            .andExpect(jsonPath("$[0].correta").doesNotExist())
            .andExpect(jsonPath("$[0].explicacao").doesNotExist());
        mvc.perform(get("/api/portal/atividades").with(user("aluno-b@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        Long primeiro=jdbc.queryForObject(
            "SELECT id FROM atividades WHERE titulo='QA: Frações 1'",Long.class);
        mvc.perform(post("/api/portal/atividades/"+primeiro+"/respostas")
            .with(user("aluno-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"opcao\":1}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.acertou").value(true));
        org.junit.jupiter.api.Assertions.assertEquals(3,
            jdbc.queryForObject("SELECT COUNT(*) FROM auditoria_escolar WHERE acao='ATIVIDADE_PUBLICADA'",
                Integer.class));
    }
    @Test
    void pacoteExigeDocenteCsrfMesmaTurmaEMesmaDisciplinaSemInsercaoParcial() throws Exception {
        String item=entrada(turmaA);
        String lote="{\"atividades\":["+item+","+item+"]}";
        String url="/api/professor/atividades/lote";
        mvc.perform(post(url).with(user("prof-b@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(lote))
            .andExpect(status().isForbidden());
        mvc.perform(post(url).with(user("aluno-a@escola.test").roles("ALUNO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(lote))
            .andExpect(status().isForbidden());
        mvc.perform(post(url).with(user("prof-a@escola.test").roles("PROFESSOR"))
            .contentType(MediaType.APPLICATION_JSON).content(lote))
            .andExpect(status().isForbidden());
        String outro=entrada(turmaB);
        mvc.perform(post(url).with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"atividades\":["+item+","+outro+"]}"))
            .andExpect(status().isBadRequest());
        String invalida=item.replace("\"correta\":1","\"correta\":4");
        mvc.perform(post(url).with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"atividades\":["+item+","+invalida+"]}"))
            .andExpect(status().isBadRequest());
        org.junit.jupiter.api.Assertions.assertEquals(0,
            jdbc.queryForObject("SELECT COUNT(*) FROM atividades",Integer.class));
    }
    @Test
    void professorDefinePrazoEAlunoNaoPodeResponderDepoisDoVencimento() throws Exception {
        String futuro=entrada(turmaA).replace("\"explicacao\"",
            "\"prazoEntrega\":\"2030-12-31\",\"explicacao\"");
        mvc.perform(post("/api/professor/atividades")
            .with(user("prof-a@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(futuro))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.prazoEntrega").value("2030-12-31"));
        long id=jdbc.queryForObject("SELECT id FROM atividades",Long.class);
        mvc.perform(get("/api/portal/atividades")
            .with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].prazoEntrega").value("2030-12-31"))
            .andExpect(jsonPath("$[0].correta").doesNotExist());
        jdbc.update("UPDATE atividades SET prazo_entrega=? WHERE id=?",
            java.sql.Date.valueOf(java.time.LocalDate.now().minusDays(2)),id);
        mvc.perform(post("/api/portal/atividades/"+id+"/respostas")
            .with(user("aluno-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"opcao\":1}"))
            .andExpect(status().isConflict());
        org.junit.jupiter.api.Assertions.assertEquals(0,
            jdbc.queryForObject("SELECT COUNT(*) FROM respostas_atividade",Integer.class));
    }

}
