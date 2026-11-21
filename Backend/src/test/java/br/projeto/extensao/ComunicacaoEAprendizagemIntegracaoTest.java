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
class ComunicacaoEAprendizagemIntegracaoTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UsuarioRepository usuarios;
    @Autowired PasswordEncoder encoder;
    long escolaA,escolaB,turmaA,turmaB,professorA,alunoA,alunoB;

    private long criar(String email,Papel papel,long escola){
        Usuario u=new Usuario(email,email,encoder.encode("ExemploSeguroTeste#123"),papel);
        u.vincularEscola(escola);
        return usuarios.saveAndFlush(u).getId();
    }
    @BeforeEach
    void preparar(){
        jdbc.update("DELETE FROM comunicados");
        jdbc.update("DELETE FROM respostas_atividade");
        jdbc.update("DELETE FROM questoes_atividade");
        jdbc.update("DELETE FROM atividades");
        jdbc.update("DELETE FROM vinculos_docentes");
        jdbc.update("DELETE FROM matriculas");
        jdbc.update("DELETE FROM turmas");
        usuarios.deleteAll();
        jdbc.update("DELETE FROM escolas");
        jdbc.update("INSERT INTO escolas(codigo,nome) VALUES ('a-test','Escola A'),('b-test','Escola B')");
        escolaA=jdbc.queryForObject("SELECT id FROM escolas WHERE codigo='a-test'",Long.class);
        escolaB=jdbc.queryForObject("SELECT id FROM escolas WHERE codigo='b-test'",Long.class);
        criar("dir-a@escola.test",Papel.DIRECAO,escolaA);
        criar("dir-b@escola.test",Papel.DIRECAO,escolaB);
        professorA=criar("prof-a@escola.test",Papel.PROFESSOR,escolaA);
        criar("prof-b@escola.test",Papel.PROFESSOR,escolaB);
        alunoA=criar("aluno-a@escola.test",Papel.ALUNO,escolaA);
        alunoB=criar("aluno-b@escola.test",Papel.ALUNO,escolaB);
        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES (?,'3A','Terceiro A',2026)",escolaA);
        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES (?,'3B','Terceiro B',2026)",escolaB);
        turmaA=jdbc.queryForObject("SELECT id FROM turmas WHERE codigo='3A'",Long.class);
        turmaB=jdbc.queryForObject("SELECT id FROM turmas WHERE codigo='3B'",Long.class);
        jdbc.update("INSERT INTO vinculos_docentes(turma_id,professor_id,disciplina) VALUES (?,?,?)",
            turmaA,professorA,"MATEMATICA");
        jdbc.update("INSERT INTO matriculas(turma_id,aluno_id,ano_letivo) VALUES (?,?,2026)",turmaA,alunoA);
        jdbc.update("INSERT INTO matriculas(turma_id,aluno_id,ano_letivo) VALUES (?,?,2026)",turmaB,alunoB);
    }
    String comunicado(Long turma,String publico){
        return "{\"turmaId\":"+(turma==null?"null":turma)+",\"publico\":\""+publico+
            "\",\"titulo\":\"Atenção à revisão\",\"texto\":\"Aula de matemática na próxima semana.\",\"importante\":true}";
    }
    @Test void diretorPublicaRecadoDaEscolaEAlunosRecebemDaEscolaCorreta()throws Exception{
        mvc.perform(post("/api/gestao/avisos").with(user("dir-a@escola.test").roles("DIRECAO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(comunicado(null,"TODOS")))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.importante").value(true));
        mvc.perform(get("/api/portal/avisos").with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].titulo").value("Atenção à revisão"));
        mvc.perform(get("/api/portal/avisos").with(user("aluno-b@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
    }
    @Test void publicarComunicadoRegistraEventoAuditavelSemVazarOutraEscola()throws Exception{
        mvc.perform(post("/api/gestao/avisos").with(user("dir-a@escola.test").roles("DIRECAO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(comunicado(null,"FUNCIONARIOS")))
            .andExpect(status().isCreated());
        long aviso=jdbc.queryForObject("SELECT id FROM comunicados WHERE escola_id=?",Long.class,escolaA);
        mvc.perform(get("/api/gestao/auditoria").with(user("dir-a@escola.test").roles("DIRECAO")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].acao").value("COMUNICADO_PUBLICADO"))
            .andExpect(jsonPath("$[0].entidade").value("COMUNICADO"))
            .andExpect(jsonPath("$[0].entidadeId").value(aviso))
            .andExpect(jsonPath("$[0].escolaId").value(escolaA))
            .andExpect(jsonPath("$[0].texto").doesNotExist());
        mvc.perform(get("/api/gestao/auditoria").with(user("dir-b@escola.test").roles("DIRECAO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());

        mvc.perform(post("/api/professor/avisos").with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(comunicado(turmaA,"ALUNOS")))
            .andExpect(status().isCreated());
        mvc.perform(get("/api/gestao/auditoria").with(user("dir-a@escola.test").roles("DIRECAO")))
            .andExpect(jsonPath("$[0].acao").value("COMUNICADO_PUBLICADO"))
            .andExpect(jsonPath("$[1].acao").value("COMUNICADO_PUBLICADO"));
    }
    @Test void assistenteCalculaPorcentagemEmPerguntaDireta()throws Exception{
        mvc.perform(post("/api/portal/assistente")
            .with(user("aluno-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"pergunta\":\"Quanto é 25% de 80?\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resposta").value(org.hamcrest.Matchers.containsString("= 20")));
    }
    @Test void avisoDeFuncionarioNaoChegaAoAluno()throws Exception{
        mvc.perform(post("/api/gestao/avisos").with(user("dir-a@escola.test").roles("DIRECAO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(comunicado(null,"FUNCIONARIOS")))
            .andExpect(status().isCreated());
        mvc.perform(get("/api/portal/avisos").with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(jsonPath("$").isEmpty());
        mvc.perform(get("/api/portal/avisos").with(user("prof-a@escola.test").roles("PROFESSOR")))
            .andExpect(jsonPath("$[0].titulo").value("Atenção à revisão"));
    }
    @Test void professorSoPublicaAvisoDaPropriaTurma()throws Exception{
        mvc.perform(post("/api/professor/avisos").with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(comunicado(turmaA,"ALUNOS")))
            .andExpect(status().isCreated());
        mvc.perform(post("/api/professor/avisos").with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(comunicado(turmaB,"ALUNOS")))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/professor/avisos").with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(comunicado(null,"FUNCIONARIOS")))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/portal/avisos").with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(jsonPath("$[0].titulo").value("Atenção à revisão"));
    }
    @Test void filtroDeTurmaEVinculoRespeitaDisciplinaAtribuida()throws Exception{
        mvc.perform(get("/api/professor/turmas/"+turmaA+"/disciplinas")
            .with(user("prof-a@escola.test").roles("PROFESSOR")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0]").value("MATEMATICA"))
            .andExpect(jsonPath("$[1]").doesNotExist());
        mvc.perform(get("/api/professor/turmas/"+turmaB+"/disciplinas")
            .with(user("prof-a@escola.test").roles("PROFESSOR")))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/professor/turmas/"+turmaA+"/disciplinas")
            .with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(status().isForbidden());
    }
    @Test void professorVeSomenteDesempenhoDeAlunosDaTurmaVinculada()throws Exception{
        mvc.perform(get("/api/professor/turmas/"+turmaA+"/desempenho")
            .with(user("prof-a@escola.test").roles("PROFESSOR")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].alunoId").value(alunoA))
            .andExpect(jsonPath("$[0].alunoNome").exists());
        mvc.perform(get("/api/professor/turmas/"+turmaB+"/desempenho")
            .with(user("prof-a@escola.test").roles("PROFESSOR")))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/professor/turmas/"+turmaA+"/desempenho")
            .with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(status().isForbidden());
    }
    @Test void assistenteNaoInventaNotasNemFrequencia()throws Exception{
        mvc.perform(post("/api/portal/assistente")
            .with(user("aluno-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"pergunta\":\"Quais minhas notas de matemática?\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resposta").value(org.hamcrest.Matchers.containsString("não estão cadastradas")));
        mvc.perform(post("/api/portal/assistente")
            .with(user("aluno-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"pergunta\":\"Quantas faltas ainda posso ter?\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resposta").value(org.hamcrest.Matchers.containsString("não estão cadastradas")));
    }
    @Test void assistenteConsultaSomenteAtividadesDoAlunoERejeitaOutroPerfil()throws Exception{
        mvc.perform(post("/api/portal/assistente")
            .with(user("aluno-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"pergunta\":\"Quais as minhas atividades?\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.tipo").value("ESCOLAR"));
        mvc.perform(post("/api/portal/assistente")
            .with(user("dir-a@escola.test").roles("DIRECAO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"pergunta\":\"Quais as minhas atividades?\"}"))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/portal/assistente")
            .with(user("aluno-a@escola.test").roles("ALUNO"))
            .contentType(MediaType.APPLICATION_JSON).content("{\"pergunta\":\"minhas atividades\"}"))
            .andExpect(status().isForbidden());
    }
    @Test void perguntasVaziasOuLongasSaoRejeitadas()throws Exception{
        mvc.perform(post("/api/portal/assistente")
            .with(user("aluno-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"pergunta\":\"  \"}"))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/api/portal/assistente")
            .with(user("aluno-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"pergunta\":\""+("x".repeat(501))+"\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test void direcaoListaEVinculaProfessoresSemDuplicidade()throws Exception{
        mvc.perform(get("/api/gestao/turmas/"+turmaA+"/vinculos")
            .with(user("dir-a@escola.test").roles("DIRECAO")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].disciplina").value("MATEMATICA"));
        mvc.perform(get("/api/gestao/turmas/"+turmaB+"/vinculos")
            .with(user("dir-a@escola.test").roles("DIRECAO")))
            .andExpect(status().isNotFound());
        mvc.perform(delete("/api/gestao/turmas/"+turmaA+"/professores/"+professorA+"/disciplinas/MATEMATICA")
            .with(user("dir-a@escola.test").roles("DIRECAO")).with(csrf()))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/gestao/turmas/"+turmaA+"/vinculos")
            .with(user("dir-a@escola.test").roles("DIRECAO")))
            .andExpect(jsonPath("$").isEmpty());
        mvc.perform(delete("/api/gestao/turmas/"+turmaA+"/professores/"+professorA+"/disciplinas/MATEMATICA")
            .with(user("dir-a@escola.test").roles("DIRECAO")).with(csrf()))
            .andExpect(status().isNotFound());
    }
    @Test void alunoRecuperaSuasRespostasEDocenteVeResultadosDeQuizzes()throws Exception{
        mvc.perform(post("/api/professor/atividades")
            .with(user("prof-a@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"turmaId\":"+turmaA+",\"disciplina\":\"MATEMATICA\",\"titulo\":\"Porcentagem\",\"pergunta\":\"Quanto vale 20% de 50?\",\"opcoes\":[\"5\",\"10\",\"20\",\"30\"],\"correta\":1,\"explicacao\":\"Vinte por cento é dez.\"}"))
            .andExpect(status().isCreated());
        Long id=jdbc.queryForObject("SELECT id FROM atividades WHERE titulo='Porcentagem'",Long.class);
        mvc.perform(post("/api/portal/atividades/"+id+"/respostas")
            .with(user("aluno-a@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"opcao\":1}"))
            .andExpect(status().isOk());
        mvc.perform(get("/api/portal/minhas-respostas")
            .with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].atividadeId").value(id))
            .andExpect(jsonPath("$[0].acertou").value(true))
            .andExpect(jsonPath("$[0].explicacao").value("Vinte por cento é dez."));
        mvc.perform(get("/api/portal/minhas-respostas")
            .with(user("aluno-b@escola.test").roles("ALUNO")))
            .andExpect(jsonPath("$").isEmpty());
        mvc.perform(get("/api/professor/turmas/"+turmaA+"/desempenho")
            .with(user("prof-a@escola.test").roles("PROFESSOR")))
            .andExpect(jsonPath("$[0].atividades").value(1))
            .andExpect(jsonPath("$[0].respondidas").value(1))
            .andExpect(jsonPath("$[0].acertos").value(1));
    }

    @Test void professorRegistraAulaFrequenciaEAlunoConsultaSomenteSeusDados()throws Exception{
        mvc.perform(post("/api/professor/aulas").with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"turmaId\":"+turmaA+",\"disciplina\":\"MATEMATICA\",\"data\":\"2026-11-19\",\"ordem\":1,\"tema\":\"Revisão\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.disciplina").value("MATEMATICA"));
        Long aula=jdbc.queryForObject("SELECT id FROM aulas_registradas WHERE turma_id=?",Long.class,turmaA);
        mvc.perform(post("/api/professor/aulas/"+aula+"/presencas")
            .with(user("prof-a@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"alunoId\":"+alunoA+",\"presente\":true}"))
            .andExpect(status().isCreated());
        mvc.perform(get("/api/portal/minha-frequencia")
            .with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.aulasRegistradas").value(1))
            .andExpect(jsonPath("$.presencas").value(1))
            .andExpect(jsonPath("$.faltas").value(0));
        mvc.perform(get("/api/portal/minha-frequencia")
            .with(user("aluno-b@escola.test").roles("ALUNO")))
            .andExpect(jsonPath("$.aulasRegistradas").value(0));
    }
    @Test void professorReabreChamadaSalvaSemExporDadosDeOutrosPerfis()throws Exception{
        String aulaJson="""
            {"turmaId":%d,"disciplina":"MATEMATICA","data":"2026-11-20","ordem":2,"tema":"Aula de teste"}
            """.formatted(turmaA);
        mvc.perform(post("/api/professor/aulas")
            .with(user("prof-a@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(aulaJson))
            .andExpect(status().isCreated());
        Long aula=jdbc.queryForObject("SELECT id FROM aulas_registradas WHERE turma_id=?",Long.class,turmaA);
        String rota="/api/professor/aulas/"+aula+"/presencas";
        mvc.perform(get(rota).with(user("prof-a@escola.test").roles("PROFESSOR")))
            .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        String presencaJson="""
            {"alunoId":%d,"presente":false}
            """.formatted(alunoA);
        mvc.perform(post(rota).with(user("prof-a@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(presencaJson))
            .andExpect(status().isCreated());
        mvc.perform(get(rota).with(user("prof-a@escola.test").roles("PROFESSOR")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].alunoId").value(alunoA))
            .andExpect(jsonPath("$[0].presente").value(false))
            .andExpect(jsonPath("$[0].email").doesNotExist());
        mvc.perform(get(rota).with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(status().isForbidden());
        mvc.perform(get(rota).with(user("prof-b@escola.test").roles("PROFESSOR")))
            .andExpect(status().isNotFound());
        mvc.perform(get(rota)).andExpect(status().isUnauthorized());
    }
    @Test void docenteCorrigeChamadaSalvaComCsrfPermissaoAuditoriaESemDuplicar() throws Exception {
        String aulaJson="""
            {"turmaId":%d,"disciplina":"MATEMATICA","data":"2026-11-21","ordem":2,"tema":"Correção de chamada"}
            """.formatted(turmaA);
        mvc.perform(post("/api/professor/aulas")
            .with(user("prof-a@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(aulaJson))
            .andExpect(status().isCreated());
        Long aula=jdbc.queryForObject(
            "SELECT id FROM aulas_registradas WHERE turma_id=? AND tema='Correção de chamada'",
            Long.class,turmaA);
        String rota="/api/professor/aulas/"+aula+"/presencas";
        String ausente="{\"alunoId\":"+alunoA+",\"presente\":false}";
        String presente="{\"alunoId\":"+alunoA+",\"presente\":true}";
        mvc.perform(post(rota).with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(ausente))
            .andExpect(status().isCreated());
        mvc.perform(get("/api/portal/minha-frequencia")
            .with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(jsonPath("$.faltas").value(1));
        mvc.perform(put(rota).with(user("prof-a@escola.test").roles("PROFESSOR"))
            .contentType(MediaType.APPLICATION_JSON).content(presente))
            .andExpect(status().isForbidden());
        mvc.perform(put(rota).with(user("aluno-a@escola.test").roles("ALUNO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(presente))
            .andExpect(status().isForbidden());
        mvc.perform(put(rota).with(user("prof-b@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(presente))
            .andExpect(status().isNotFound());
        mvc.perform(put(rota).with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"alunoId\":"+alunoB+",\"presente\":true}"))
            .andExpect(status().isNotFound());
        mvc.perform(put(rota).with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(presente))
            .andExpect(status().isNoContent());
        mvc.perform(get(rota).with(user("prof-a@escola.test").roles("PROFESSOR")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].alunoId").value(alunoA))
            .andExpect(jsonPath("$[0].presente").value(true));
        mvc.perform(get("/api/portal/minha-frequencia")
            .with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(jsonPath("$.faltas").value(0))
            .andExpect(jsonPath("$.presencas").value(1))
            .andExpect(jsonPath("$.registrosDePresenca").value(1));
        mvc.perform(get("/api/portal/minha-frequencia")
            .with(user("aluno-b@escola.test").roles("ALUNO")))
            .andExpect(jsonPath("$.presencas").value(0));
        org.junit.jupiter.api.Assertions.assertEquals(1,jdbc.queryForObject(
            "SELECT COUNT(*) FROM presencas_aula WHERE aula_id=? AND aluno_id=?",
            Integer.class,aula,alunoA));
        org.junit.jupiter.api.Assertions.assertEquals(1,jdbc.queryForObject(
            "SELECT COUNT(*) FROM auditoria_escolar WHERE acao='PRESENCA_CORRIGIDA' "+
            "AND escola_id=? AND ator_id=? AND entidade='AULA' AND entidade_id=?",
            Integer.class,escolaA,professorA,aula));
        mvc.perform(put(rota).with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(presente))
            .andExpect(status().isNoContent());
        org.junit.jupiter.api.Assertions.assertEquals(1,jdbc.queryForObject(
            "SELECT COUNT(*) FROM auditoria_escolar WHERE acao='PRESENCA_CORRIGIDA' "+
            "AND escola_id=? AND ator_id=? AND entidade='AULA' AND entidade_id=?",
            Integer.class,escolaA,professorA,aula));

        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES (?,'3C','Turma Destino',2026)",escolaA);
        Long destino=jdbc.queryForObject(
            "SELECT id FROM turmas WHERE escola_id=? AND codigo='3C'",Long.class,escolaA);
        mvc.perform(post("/api/gestao/turmas/"+turmaA+"/transferencias")
            .with(user("dir-a@escola.test").roles("DIRECAO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\\"alunoId\\":"+alunoA+",\\"destinoTurmaId\\":"+destino+"}"))
            .andExpect(status().isNoContent());
        mvc.perform(put(rota).with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(ausente))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/portal/minha-frequencia")
            .with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(jsonPath("$.aulasRegistradas").value(1))
            .andExpect(jsonPath("$.faltas").value(1))
            .andExpect(jsonPath("$.presencas").value(0));
        org.junit.jupiter.api.Assertions.assertEquals(destino,jdbc.queryForObject(
            "SELECT turma_id FROM matriculas WHERE aluno_id=?",Long.class,alunoA));
        org.junit.jupiter.api.Assertions.assertEquals(2,jdbc.queryForObject(
            "SELECT COUNT(*) FROM auditoria_escolar WHERE acao='PRESENCA_CORRIGIDA' "+
            "AND escola_id=? AND ator_id=? AND entidade='AULA' AND entidade_id=?",
            Integer.class,escolaA,professorA,aula));
    }

    @Test void professorDeOutraEscolaNaoRegistraNemLePresenca()throws Exception{
        mvc.perform(post("/api/professor/aulas").with(user("prof-b@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"turmaId\":"+turmaA+",\"disciplina\":\"MATEMATICA\",\"data\":\"2026-11-19\",\"ordem\":1,\"tema\":\"Outro\"}"))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/professor/turmas/"+turmaA+"/aulas")
            .with(user("prof-b@escola.test").roles("PROFESSOR")))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/professor/turmas/"+turmaA+"/aulas")
            .with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(status().isForbidden());
    }

    @Test
    void exportarDesempenhoCsvProtegeTurmaEPlanilhaContraInjecao() throws Exception {
        mvc.perform(get("/api/professor/turmas/"+turmaA+"/desempenho.csv")
            .with(user("prof-a@escola.test").roles("PROFESSOR")))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Type",org.hamcrest.Matchers.containsString("text/csv")))
            .andExpect(content().string(org.hamcrest.Matchers.containsString("Aluno;Atividades;Respondidas;Acertos")));
        mvc.perform(get("/api/professor/turmas/"+turmaB+"/desempenho.csv")
            .with(user("prof-a@escola.test").roles("PROFESSOR")))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/professor/turmas/"+turmaA+"/desempenho.csv")
            .with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(status().isForbidden());
        org.junit.jupiter.api.Assertions.assertEquals("\"'=SOMA(1;1)\"",
            CsvSeguro.celula("=SOMA(1;1)"));
        org.junit.jupiter.api.Assertions.assertEquals("\"Nome com aspas \"\"A\"\"\"",
            CsvSeguro.celula("Nome com aspas \"A\""));
    }


    @Test void feedExibeAutorECargoSemExporEmailECriadoEmOrdemRecente()throws Exception{
        mvc.perform(post("/api/professor/avisos").with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(comunicado(turmaA,"ALUNOS")))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.autorNome").value("prof-a@escola.test"))
            .andExpect(jsonPath("$.autorPapel").value("PROFESSOR"))
            .andExpect(jsonPath("$.autorEmail").doesNotExist());
        mvc.perform(get("/api/portal/avisos").with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].autorPapel").value("PROFESSOR"));
    }
    @Test void professorEditaSuaPublicacaoNaoAsDeOutrosEAlunoNaoPodeEditar()throws Exception{
        mvc.perform(post("/api/professor/avisos").with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(comunicado(turmaA,"ALUNOS")))
            .andExpect(status().isCreated());
        long aviso=jdbc.queryForObject("SELECT id FROM comunicados",Long.class);
        String rota="/api/professor/avisos/"+aviso;
        String novo="{\"titulo\":\"Revisao do professor\",\"texto\":\"Preparem um resumo de matematica.\",\"importante\":false}";
        mvc.perform(put(rota).with(user("prof-a@escola.test").roles("PROFESSOR"))
            .contentType(MediaType.APPLICATION_JSON).content(novo)).andExpect(status().isForbidden());
        mvc.perform(put(rota).with(user("aluno-a@escola.test").roles("ALUNO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(novo)).andExpect(status().isForbidden());
        mvc.perform(put(rota).with(user("prof-b@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(novo)).andExpect(status().isNotFound());
        mvc.perform(put(rota).with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(novo))
            .andExpect(status().isOk()).andExpect(jsonPath("$.titulo").value("Revisao do professor"));
        mvc.perform(get("/api/portal/avisos").with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(jsonPath("$[0].titulo").value("Revisao do professor"));
    }
    @Test void somenteAutorOuDirecaoDaEscolaRemovePostEHaAuditoria()throws Exception{
        mvc.perform(post("/api/professor/avisos").with(user("prof-a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(comunicado(turmaA,"ALUNOS")))
            .andExpect(status().isCreated());
        long aviso=jdbc.queryForObject("SELECT id FROM comunicados",Long.class);
        mvc.perform(delete("/api/professor/avisos/"+aviso)
            .with(user("prof-b@escola.test").roles("PROFESSOR")).with(csrf()))
            .andExpect(status().isNotFound());
        mvc.perform(delete("/api/gestao/avisos/"+aviso)
            .with(user("dir-b@escola.test").roles("DIRECAO")).with(csrf()))
            .andExpect(status().isNotFound());
        mvc.perform(delete("/api/gestao/avisos/"+aviso)
            .with(user("dir-a@escola.test").roles("DIRECAO")).with(csrf()))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/portal/avisos").with(user("aluno-a@escola.test").roles("ALUNO")))
            .andExpect(jsonPath("$").isEmpty());
        mvc.perform(get("/api/gestao/auditoria").with(user("dir-a@escola.test").roles("DIRECAO")))
            .andExpect(jsonPath("$[0].acao").value("COMUNICADO_REMOVIDO"));
    }

}
