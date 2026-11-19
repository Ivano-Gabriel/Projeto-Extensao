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
class TurmasEditaveisIntegracaoTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UsuarioRepository usuarios;
    @Autowired PasswordEncoder encoder;
    Long escolaA,escolaB,direcao,professor,aluno,professorExterno,turma;
    @BeforeEach
    void preparar() {
        jdbc.update("DELETE FROM respostas_atividade");
        jdbc.update("DELETE FROM questoes_atividade");
        jdbc.update("DELETE FROM atividades");
        jdbc.update("DELETE FROM presencas_aula");
        jdbc.update("DELETE FROM aulas_registradas");
        jdbc.update("DELETE FROM comunicados");
        jdbc.update("DELETE FROM vinculos_docentes");
        jdbc.update("DELETE FROM matriculas");
        jdbc.update("DELETE FROM turmas");
        usuarios.deleteAll();
        jdbc.update("DELETE FROM escolas");
        jdbc.update("INSERT INTO escolas(codigo,nome) VALUES ('edit-a','Escola Edit A'),('edit-b','Escola Edit B')");
        escolaA=jdbc.queryForObject("SELECT id FROM escolas WHERE codigo='edit-a'",Long.class);
        escolaB=jdbc.queryForObject("SELECT id FROM escolas WHERE codigo='edit-b'",Long.class);
        direcao=criar("dir-edit@escola.test",Papel.DIRECAO,escolaA);
        professor=criar("prof-edit@escola.test",Papel.PROFESSOR,escolaA);
        professorExterno=criar("prof-edit-b@escola.test",Papel.PROFESSOR,escolaB);
        aluno=criar("aluno-edit@escola.test",Papel.ALUNO,escolaA);
        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES(?,?,?,2026)",
            escolaA,"3A","Terceiro A");
        turma=jdbc.queryForObject("SELECT id FROM turmas WHERE escola_id=?",Long.class,escolaA);
        jdbc.update("INSERT INTO vinculos_docentes(turma_id,professor_id,disciplina) VALUES(?,?,?)",
            turma,professor,"MATEMATICA");
        jdbc.update("INSERT INTO matriculas(turma_id,aluno_id,ano_letivo) VALUES(?,?,2026)",turma,aluno);
    }
    private Long criar(String email,Papel papel,Long escola) {
        Usuario usuario=new Usuario(email,email,encoder.encode("SenhaForte2026++"),papel);
        usuario.vincularEscola(escola);
        return usuarios.saveAndFlush(usuario).getId();
    }
    @Test
    void direcaoEditaTurmaAlunoVeConfiguracaoEProfessorNaoEdita() throws Exception {
        String rota="/api/gestao/turmas/"+turma;
        String corpo="{\"codigo\":\"3B\",\"nome\":\"Terceiro B\",\"anoLetivo\":2026,\"descricao\":\"Revisao semanal\",\"cor\":\"#2867A8\"}";
        mvc.perform(put(rota).with(user("prof-edit@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(corpo))
            .andExpect(status().isForbidden());
        mvc.perform(put(rota).with(user("dir-edit@escola.test").roles("DIRECAO"))
            .contentType(MediaType.APPLICATION_JSON).content(corpo))
            .andExpect(status().isForbidden());
        mvc.perform(put(rota).with(user("dir-edit@escola.test").roles("DIRECAO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(corpo))
            .andExpect(status().isOk()).andExpect(jsonPath("$.codigo").value("3B"));
        mvc.perform(get("/api/portal/turmas/"+turma+"/configuracao")
            .with(user("aluno-edit@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.descricao").value("Revisao semanal"));
        mvc.perform(get("/api/portal/turmas/"+turma+"/configuracao")
            .with(user("prof-edit-b@escola.test").roles("PROFESSOR")))
            .andExpect(status().isNotFound());
    }
    @Test
    void direcaoGerenciaHorarioProfessorVisualizaEAlunoNaoAltera() throws Exception {
        String endpoint="/api/gestao/turmas/"+turma+"/horarios";
        String corpo="{\"disciplina\":\"MATEMATICA\",\"diaSemana\":1,\"inicio\":\"07:00\",\"fim\":\"07:50\",\"professorId\":"+professor+"}";
        mvc.perform(post(endpoint).with(user("dir-edit@escola.test").roles("DIRECAO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(corpo))
            .andExpect(status().isCreated());
        mvc.perform(get("/api/portal/turmas/"+turma+"/horarios")
            .with(user("prof-edit@escola.test").roles("PROFESSOR")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].disciplina").value("MATEMATICA"));
        mvc.perform(post(endpoint).with(user("aluno-edit@escola.test").roles("ALUNO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(corpo))
            .andExpect(status().isForbidden());
        String indevido=corpo.replace(professor.toString(),professorExterno.toString()).replace("07:00","06:00");
        mvc.perform(post(endpoint).with(user("dir-edit@escola.test").roles("DIRECAO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(indevido))
            .andExpect(status().isForbidden());
    }
    @Test
    void materialRascunhoNaoVazaEProfessorPodePublicarOuEditar() throws Exception {
        String criacao="/api/professor/turmas/"+turma+"/materiais";
        String corpo="{\"disciplina\":\"MATEMATICA\",\"titulo\":\"Equacoes\",\"conteudo\":\"Exercicios da semana\",\"publicado\":false}";
        mvc.perform(post(criacao).with(user("prof-edit@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(corpo))
            .andExpect(status().isCreated());
        String consulta="/api/portal/turmas/"+turma+"/materiais";
        mvc.perform(get(consulta).with(user("aluno-edit@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        Long id=jdbc.queryForObject("SELECT id FROM materiais_turma",Long.class);
        mvc.perform(put("/api/professor/materiais/"+id)
            .with(user("prof-edit@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content(corpo.replace("false","true")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.publicado").value(true));
        mvc.perform(get(consulta).with(user("aluno-edit@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].titulo").value("Equacoes"));
        mvc.perform(put("/api/professor/materiais/"+id)
            .with(user("prof-edit-b@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(corpo))
            .andExpect(status().isNotFound());
    }
    @Test
    void iaNaoPodeGerarSemConfiguracaoNemExporOutraEscola() throws Exception {
        String pedido="{\"turmaId\":"+turma+",\"disciplina\":\"MATEMATICA\",\"tema\":\"Frações\",\"tipo\":\"QUIZ\",\"contexto\":\"\"}";
        mvc.perform(post("/api/professor/ia/rascunho")
            .with(user("prof-edit-b@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(pedido))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/professor/ia/rascunho")
            .with(user("prof-edit@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(pedido))
            .andExpect(status().isServiceUnavailable());
    }
}
