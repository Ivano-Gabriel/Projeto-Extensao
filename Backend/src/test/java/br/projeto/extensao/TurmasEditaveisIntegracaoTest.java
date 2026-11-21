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
    @Autowired IaCotasService iaCotas;
    @Autowired IaPedagogicaController iaPedagogica;
    Long escolaA,escolaB,direcao,professor,aluno,professorExterno,turma;
    @BeforeEach
    void preparar() {
        jdbc.update("DELETE FROM auditoria_escolar");
        jdbc.update("DELETE FROM transferencias_turma");
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
    void direcaoCriaTurmaComAuditoriaSomenteDaEscolaAutorizada() throws Exception {
        String dados="""
            {"codigo":"QA27A","nome":"Turma de teste 2027","anoLetivo":2027}
            """;
        mvc.perform(post("/api/gestao/turmas").with(user("aluno-edit@escola.test").roles("ALUNO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(dados))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/gestao/turmas").with(user("dir-edit@escola.test").roles("DIRECAO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(dados))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.codigo").value("QA27A"));
        Long novaTurma=jdbc.queryForObject(
            "SELECT id FROM turmas WHERE escola_id=? AND codigo='QA27A' AND ano_letivo=2027",
            Long.class,escolaA);
        org.junit.jupiter.api.Assertions.assertEquals(1,jdbc.queryForObject(
            "SELECT COUNT(*) FROM auditoria_escolar WHERE escola_id=? AND ator_id=? "+
            "AND acao='TURMA_CRIADA' AND entidade='TURMA' AND entidade_id=?",
            Integer.class,escolaA,direcao,novaTurma));
        mvc.perform(get("/api/gestao/auditoria").with(user("dir-edit@escola.test").roles("DIRECAO")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].acao").value("TURMA_CRIADA"))
            .andExpect(jsonPath("$[0].entidadeId").value(novaTurma));
        Long outroDiretor=criar("dir-edit-b@escola.test",Papel.DIRECAO,escolaB);
        mvc.perform(get("/api/gestao/auditoria").with(user("dir-edit-b@escola.test").roles("DIRECAO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
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

    @Test
    void statusEListaDisciplinasRespeitamPermissoesSemExporConfiguracao() throws Exception {
        mvc.perform(get("/api/portal/ia/status"))
            .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/portal/ia/status")
            .with(user("prof-edit@escola.test").roles("PROFESSOR")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.habilitada").value(false))
            .andExpect(jsonPath("$.restantesHoje").value(0));
        mvc.perform(get("/api/portal/ia/disciplinas")
            .with(user("aluno-edit@escola.test").roles("ALUNO")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].disciplina").value("MATEMATICA"))
            .andExpect(jsonPath("$[1]").doesNotExist());
        mvc.perform(get("/api/portal/ia/disciplinas")
            .with(user("prof-edit@escola.test").roles("PROFESSOR")))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/portal/ia/disciplinas")
            .with(user("prof-edit-b@escola.test").roles("PROFESSOR")))
            .andExpect(status().isForbidden());
    }

    @Test
    void tutoriaAlunoSoAceitaTurmaMatriculadaECsrf() throws Exception {
        String entrada="{\"turmaId\":"+turma+
            ",\"disciplina\":\"MATEMATICA\",\"pergunta\":\"Explique a formula de Bhaskara\"}";
        mvc.perform(post("/api/portal/ia/explicar")
            .with(user("aluno-edit@escola.test").roles("ALUNO"))
            .contentType(MediaType.APPLICATION_JSON).content(entrada))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/portal/ia/explicar")
            .with(user("prof-edit@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(entrada))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/portal/ia/explicar")
            .with(user("aluno-edit@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(entrada))
            .andExpect(status().isServiceUnavailable());
        mvc.perform(post("/api/portal/ia/explicar")
            .with(user("aluno-edit@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content(entrada.replace("MATEMATICA","QUIMICA")))
            .andExpect(status().isForbidden());
    }

    @Test
    void bloqueiaDadosPessoaisAntesDeConsultarProvedor() throws Exception {
        String dados="{\"turmaId\":"+turma+",\"disciplina\":\"MATEMATICA\","+
            "\"tema\":\"Joao\",\"tipo\":\"QUIZ\",\"contexto\":\"email joao@escola.com\"}";
        mvc.perform(post("/api/professor/ia/rascunho")
            .with(user("prof-edit@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(dados))
            .andExpect(status().isBadRequest());
        String entrada="{\"turmaId\":"+turma+
            ",\"disciplina\":\"MATEMATICA\",\"pergunta\":\"Meu CPF: 123.456.789-00\"}";
        mvc.perform(post("/api/portal/ia/explicar")
            .with(user("aluno-edit@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(entrada))
            .andExpect(status().isBadRequest());
    }

    @Test
    void cotaDeIaPersisteERecusaDecimaTerceiraRequisicaoDoProfessor() throws Exception {
        for(int n=0;n<12;n++){
            org.junit.jupiter.api.Assertions.assertEquals(11-n,
                iaCotas.reservar(professor,Papel.PROFESSOR));
        }
        org.junit.jupiter.api.Assertions.assertEquals(0,
            iaCotas.restantes(professor,Papel.PROFESSOR));
        org.junit.jupiter.api.Assertions.assertThrows(
            org.springframework.web.server.ResponseStatusException.class,
            ()->iaCotas.reservar(professor,Papel.PROFESSOR));
        org.junit.jupiter.api.Assertions.assertEquals(6,
            iaCotas.restantes(aluno,Papel.ALUNO));
    }


    @Test
    void questaoEstruturadaDaIaSoPreencheEditorSeEstiverCompleta() {
        String valido="""
            {"titulo":"Raizes da equacao","pergunta":"Quais sao as raizes de x²-5x+6?",
             "opcoes":["1 e 6","2 e 3","-2 e -3","0 e 5"],
             "correta":1,"explicacao":"Fatorando: (x-2)(x-3)."}
            """;
        IaPedagogicaController.QuizGerado quiz=iaPedagogica.lerQuiz(valido);
        org.junit.jupiter.api.Assertions.assertEquals(4,quiz.opcoes().size());
        org.junit.jupiter.api.Assertions.assertEquals(1,quiz.correta());
        String invalido=valido.replace("\"0 e 5\"","\"nada\"").replace("\"2 e 3\",","");
        org.junit.jupiter.api.Assertions.assertThrows(
            org.springframework.web.server.ResponseStatusException.class,
            ()->iaPedagogica.lerQuiz(invalido));
    }

    @Test
    void iaValidaPacoteCompletoENaoAceitaDuplicatasOuGabaritoInvalido() {
        String valido="""
          {"questoes":[
            {"titulo":"Revisão A","pergunta":"Quanto e 2 mais 2?","opcoes":["2","3","4","5"],
             "correta":2,"explicacao":"Quatro."},
            {"titulo":"Revisão B","pergunta":"Quanto e 3 mais 3?","opcoes":["4","5","6","7"],
             "correta":2,"explicacao":"Seis."}
          ]}
          """;
        var pacote=iaPedagogica.lerPacote(valido,2);
        org.junit.jupiter.api.Assertions.assertEquals(2,pacote.size());
        org.junit.jupiter.api.Assertions.assertEquals(2,pacote.get(1).correta());
        org.junit.jupiter.api.Assertions.assertThrows(
            org.springframework.web.server.ResponseStatusException.class,
            ()->iaPedagogica.lerPacote(valido,3));
        String duplicado=valido.replace("Quanto e 3 mais 3?","Quanto e 2 mais 2?");
        org.junit.jupiter.api.Assertions.assertThrows(
            org.springframework.web.server.ResponseStatusException.class,
            ()->iaPedagogica.lerPacote(duplicado,2));
        String gabaritoInvalido=valido.replace("\"correta\":2","\"correta\":9");
        org.junit.jupiter.api.Assertions.assertThrows(
            org.springframework.web.server.ResponseStatusException.class,
            ()->iaPedagogica.lerPacote(gabaritoInvalido,2));
    }
    @Test
    void iaPacoteProtegeDadosEValidacaoAntesDeChamadaExterna() throws Exception {
        String pedido="""
          {"turmaId":%d,"disciplina":"MATEMATICA","tema":"Frações",
           "contexto":"Nível fácil","fonteTexto":"A metade de vinte é dez.","quantidade":3}
          """.formatted(turma);
        String rota="/api/professor/ia/pacote";
        mvc.perform(post(rota).with(user("aluno-edit@escola.test").roles("ALUNO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(pedido))
            .andExpect(status().isForbidden());
        mvc.perform(post(rota).with(user("prof-edit-b@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(pedido))
            .andExpect(status().isForbidden());
        mvc.perform(post(rota).with(user("prof-edit@escola.test").roles("PROFESSOR"))
            .contentType(MediaType.APPLICATION_JSON).content(pedido))
            .andExpect(status().isForbidden());
        mvc.perform(post(rota).with(user("prof-edit@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(pedido))
            .andExpect(status().isServiceUnavailable());
        mvc.perform(post(rota).with(user("prof-edit@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content(pedido.replace("A metade de vinte é dez.","aluno@escola.com")))
            .andExpect(status().isBadRequest());
        mvc.perform(post(rota).with(user("prof-edit@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content(pedido.replace("\"quantidade\":3","\"quantidade\":7")))
            .andExpect(status().isBadRequest());
    }

    @Test
    void pdfDoProfessorExtraiTextoSemPublicarArquivoNemConsultarIa() throws Exception {
        byte[] bytes;
        try(var pdf=new org.apache.pdfbox.pdmodel.PDDocument()){
            var page=new org.apache.pdfbox.pdmodel.PDPage();
            pdf.addPage(page);
            try(var cs=new org.apache.pdfbox.pdmodel.PDPageContentStream(pdf,page)){
                cs.beginText();
                cs.setFont(new org.apache.pdfbox.pdmodel.font.PDType1Font(
                    org.apache.pdfbox.pdmodel.font.Standard14Fonts.FontName.HELVETICA),12);
                cs.newLineAtOffset(50,650);
                cs.showText("Fractions describe parts of a whole.");
                cs.endText();
            }
            var out=new java.io.ByteArrayOutputStream();
            pdf.save(out);bytes=out.toByteArray();
        }
        var arquivo=new org.springframework.mock.web.MockMultipartFile(
            "arquivo","conteudo.pdf","application/pdf",bytes);
        String url="/api/professor/ia/pdf-extrair";
        mvc.perform(multipart(url).file(arquivo)
            .param("turmaId",turma.toString()).param("disciplina","MATEMATICA")
            .with(user("prof-edit@escola.test").roles("PROFESSOR")).with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.texto",org.hamcrest.Matchers.containsString("Fractions describe")))
            .andExpect(jsonPath("$.paginas").value(1))
            .andExpect(jsonPath("$.truncado").value(false));
        mvc.perform(multipart(url).file(arquivo)
            .param("turmaId",turma.toString()).param("disciplina","MATEMATICA")
            .with(user("aluno-edit@escola.test").roles("ALUNO")).with(csrf()))
            .andExpect(status().isForbidden());
        mvc.perform(multipart(url).file(arquivo)
            .param("turmaId",turma.toString()).param("disciplina","MATEMATICA")
            .with(user("prof-edit-b@escola.test").roles("PROFESSOR")).with(csrf()))
            .andExpect(status().isForbidden());
        mvc.perform(multipart(url).file(arquivo)
            .param("turmaId",turma.toString()).param("disciplina","MATEMATICA")
            .with(user("prof-edit@escola.test").roles("PROFESSOR")))
            .andExpect(status().isForbidden());
        var falso=new org.springframework.mock.web.MockMultipartFile(
            "arquivo","ata.pdf","application/pdf","sem PDF".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        mvc.perform(multipart(url).file(falso)
            .param("turmaId",turma.toString()).param("disciplina","MATEMATICA")
            .with(user("prof-edit@escola.test").roles("PROFESSOR")).with(csrf()))
            .andExpect(status().isUnsupportedMediaType());
        var grande=new org.springframework.mock.web.MockMultipartFile(
            "arquivo","grande.pdf","application/pdf",new byte[2*1024*1024+1]);
        mvc.perform(multipart(url).file(grande)
            .param("turmaId",turma.toString()).param("disciplina","MATEMATICA")
            .with(user("prof-edit@escola.test").roles("PROFESSOR")).with(csrf()))
            .andExpect(status().isPayloadTooLarge());
    }

    @Test
    void direcaoTransfereAlunoEntreTurmasDaMesmaEscolaMantendoHistorico() throws Exception {
        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES(?,?,?,2026)",
            escolaA,"3B","Terceiro B");
        Long destino=jdbc.queryForObject("SELECT id FROM turmas WHERE escola_id=? AND codigo='3B'",
            Long.class,escolaA);
        String corpo="{\"alunoId\":"+aluno+",\"destinoTurmaId\":"+destino+"}";
        String endpoint="/api/gestao/turmas/"+turma+"/transferencias";
        mvc.perform(post(endpoint).with(user("aluno-edit@escola.test").roles("ALUNO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(corpo))
            .andExpect(status().isForbidden());
        mvc.perform(post(endpoint).with(user("dir-edit@escola.test").roles("DIRECAO"))
            .contentType(MediaType.APPLICATION_JSON).content(corpo))
            .andExpect(status().isForbidden());
        mvc.perform(post(endpoint).with(user("dir-edit@escola.test").roles("DIRECAO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(corpo))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/portal/turmas").with(user("aluno-edit@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].codigo").value("3B"))
            .andExpect(jsonPath("$[1]").doesNotExist());
        org.junit.jupiter.api.Assertions.assertEquals(destino,
            jdbc.queryForObject("SELECT turma_id FROM matriculas WHERE aluno_id=?",Long.class,aluno));
        org.junit.jupiter.api.Assertions.assertEquals(1,
            jdbc.queryForObject("SELECT COUNT(*) FROM transferencias_turma WHERE aluno_id=? "+
                "AND origem_turma_id=? AND destino_turma_id=?",Integer.class,aluno,turma,destino));
        mvc.perform(post(endpoint).with(user("dir-edit@escola.test").roles("DIRECAO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(corpo))
            .andExpect(status().isConflict());
    }
    @Test
    void alunoTransferidoMantemFrequenciaRegistradaNaTurmaDeOrigemSemContarAulasPosteriores() throws Exception {
        String origem="/api/professor/aulas";
        String antiga="""
            {"turmaId":%d,"disciplina":"MATEMATICA","data":"2026-11-17","ordem":1,"tema":"Aula anterior"}
            """.formatted(turma);
        mvc.perform(post(origem).with(user("prof-edit@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(antiga))
            .andExpect(status().isCreated());
        Long aulaAntiga=jdbc.queryForObject(
            "SELECT id FROM aulas_registradas WHERE turma_id=?",Long.class,turma);
        mvc.perform(post("/api/professor/aulas/"+aulaAntiga+"/presencas")
            .with(user("prof-edit@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"alunoId\":"+aluno+",\"presente\":true}"))
            .andExpect(status().isCreated());
        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES (?,'3B','Terceiro B',2026)",escolaA);
        Long destino=jdbc.queryForObject(
            "SELECT id FROM turmas WHERE escola_id=? AND codigo='3B'",Long.class,escolaA);
        jdbc.update("INSERT INTO vinculos_docentes(turma_id,professor_id,disciplina) VALUES(?,?,'MATEMATICA')",
            destino,professor);
        String nova="""
            {"turmaId":%d,"disciplina":"MATEMATICA","data":"2026-11-18","ordem":1,"tema":"Aula nova"}
            """.formatted(destino);
        mvc.perform(post(origem).with(user("prof-edit@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(nova))
            .andExpect(status().isCreated());
        Long aulaNova=jdbc.queryForObject(
            "SELECT id FROM aulas_registradas WHERE turma_id=?",Long.class,destino);
        mvc.perform(post("/api/gestao/turmas/"+turma+"/transferencias")
            .with(user("dir-edit@escola.test").roles("DIRECAO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"alunoId\":"+aluno+",\"destinoTurmaId\":"+destino+"}"))
            .andExpect(status().isNoContent());

        String frequencia="/api/portal/minha-frequencia";
        mvc.perform(get(frequencia).with(user("aluno-edit@escola.test").roles("ALUNO")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.aulasRegistradas").value(2))
            .andExpect(jsonPath("$.registrosDePresenca").value(1))
            .andExpect(jsonPath("$.presencas").value(1))
            .andExpect(jsonPath("$.faltas").value(0));
        mvc.perform(post("/api/professor/aulas/"+aulaNova+"/presencas")
            .with(user("prof-edit@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"alunoId\":"+aluno+",\"presente\":false}"))
            .andExpect(status().isCreated());
        mvc.perform(get(frequencia).with(user("aluno-edit@escola.test").roles("ALUNO")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.aulasRegistradas").value(2))
            .andExpect(jsonPath("$.registrosDePresenca").value(2))
            .andExpect(jsonPath("$.presencas").value(1))
            .andExpect(jsonPath("$.faltas").value(1));
        String novaNaAntiga="""
            {"turmaId":%d,"disciplina":"MATEMATICA","data":"2026-11-19","ordem":1,"tema":"Aula depois da saida"}
            """.formatted(turma);
        mvc.perform(post(origem).with(user("prof-edit@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(novaNaAntiga))
            .andExpect(status().isCreated());
        mvc.perform(get(frequencia).with(user("aluno-edit@escola.test").roles("ALUNO")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.aulasRegistradas").value(2))
            .andExpect(jsonPath("$.presencas").value(1))
            .andExpect(jsonPath("$.faltas").value(1));
    }
    @Test
    void transferenciaRejeitaOutroAnoEOuOutraEscola() throws Exception {
        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES(?,?,?,2027)",
            escolaA,"3D","Outro ano");
        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES(?,?,?,2026)",
            escolaB,"3E","Outra escola");
        Long outroAno=jdbc.queryForObject("SELECT id FROM turmas WHERE escola_id=? AND codigo='3D'",
            Long.class,escolaA);
        Long outraEscola=jdbc.queryForObject("SELECT id FROM turmas WHERE escola_id=? AND codigo='3E'",
            Long.class,escolaB);
        String endpoint="/api/gestao/turmas/"+turma+"/transferencias";
        for(Long destino:new Long[]{outroAno,outraEscola}){
            String corpo="{\"alunoId\":"+aluno+",\"destinoTurmaId\":"+destino+"}";
            mvc.perform(post(endpoint).with(user("dir-edit@escola.test").roles("DIRECAO"))
                .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(destino.equals(outroAno)?status().isConflict():status().isNotFound());
        }
        org.junit.jupiter.api.Assertions.assertEquals(turma,
            jdbc.queryForObject("SELECT turma_id FROM matriculas WHERE aluno_id=?",Long.class,aluno));
    }


    @Test
    void assistenteGratuitoSabeSaudarDarDataEExplicarBhaskaraSemModelo() throws Exception {
        String endereco="/api/portal/assistente";
        mvc.perform(post(endereco).with(user("aluno-edit@escola.test").roles("ALUNO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"pergunta\":\"Bom dia!\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resposta",org.hamcrest.Matchers.containsString("Bom dia")));
        mvc.perform(post(endereco).with(user("aluno-edit@escola.test").roles("ALUNO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"pergunta\":\"Que dia é hoje?\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resposta",org.hamcrest.Matchers.containsString("Hoje")));
        mvc.perform(post(endereco).with(user("aluno-edit@escola.test").roles("ALUNO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"pergunta\":\"Que horas são agora?\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resposta",org.hamcrest.Matchers.containsString("horário de Brasília")));
        mvc.perform(post(endereco).with(user("aluno-edit@escola.test").roles("ALUNO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"pergunta\":\"Como funciona a fórmula de Bhaskara?\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resposta",org.hamcrest.Matchers.containsString("Δ = b² - 4ac")));
    }


    @Test
    void desvincularProfessorLimpaResponsavelDoHorarioERegistraAuditoria() throws Exception {
        jdbc.update("INSERT INTO horarios_turma(turma_id,disciplina,dia_semana,inicio,fim,professor_id) "+
            "VALUES(?,'MATEMATICA',1,'07:00:00','07:50:00',?)",turma,professor);
        String rota="/api/gestao/turmas/"+turma+"/professores/"+professor+"/disciplinas/MATEMATICA";
        mvc.perform(delete(rota).with(user("aluno-edit@escola.test").roles("ALUNO")).with(csrf()))
            .andExpect(status().isForbidden());
        mvc.perform(delete(rota).with(user("dir-edit@escola.test").roles("DIRECAO")))
            .andExpect(status().isForbidden());
        mvc.perform(delete(rota).with(user("dir-edit@escola.test").roles("DIRECAO")).with(csrf()))
            .andExpect(status().isNoContent());
        org.junit.jupiter.api.Assertions.assertEquals(1,
            jdbc.queryForObject("SELECT COUNT(*) FROM horarios_turma WHERE turma_id=? AND professor_id IS NULL",
                Integer.class,turma));
        mvc.perform(get("/api/portal/turmas").with(user("prof-edit@escola.test").roles("PROFESSOR")))
            .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        mvc.perform(get("/api/gestao/auditoria").with(user("dir-edit@escola.test").roles("DIRECAO")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].acao").value("VINCULO_REMOVIDO"));
        mvc.perform(get("/api/gestao/auditoria").with(user("prof-edit@escola.test").roles("PROFESSOR")))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/gestao/auditoria").with(user("prof-edit-b@escola.test").roles("PROFESSOR")))
            .andExpect(status().isForbidden());
    }

    @Test
    void transferenciaRegistraEventoSemExporHistoricoDeOutraEscola() throws Exception {
        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES (?,?,?,2026)",
            escolaA,"3B","Terceiro B");
        Long destino=jdbc.queryForObject("SELECT id FROM turmas WHERE escola_id=? AND codigo='3B'",
            Long.class,escolaA);
        mvc.perform(post("/api/gestao/turmas/"+turma+"/transferencias")
            .with(user("dir-edit@escola.test").roles("DIRECAO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"alunoId\":"+aluno+",\"destinoTurmaId\":"+destino+"}"))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/gestao/auditoria").with(user("dir-edit@escola.test").roles("DIRECAO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].acao").value("ALUNO_TRANSFERIDO"))
            .andExpect(jsonPath("$[0].escolaId").value(escolaA))
            .andExpect(jsonPath("$[0].atorId").value(direcao));
    }


    @Test
    void jornadaCompletaDirecaoProfessorAlunoComTransferenciaPreservaRespostaHistorica() throws Exception {
        String novaQuestao="{\"turmaId\":"+turma+",\"disciplina\":\"MATEMATICA\","+
            "\"titulo\":\"Equacao do segundo grau\",\"pergunta\":\"Quais sao as raizes?\","+
            "\"opcoes\":[\"1 e 6\",\"2 e 3\",\"4 e 5\",\"0 e 1\"],"+
            "\"correta\":1,\"explicacao\":\"Fatoracao dos dois termos.\"}";
        mvc.perform(post("/api/professor/atividades")
            .with(user("prof-edit@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(novaQuestao))
            .andExpect(status().isCreated());
        long id=jdbc.queryForObject("SELECT id FROM atividades WHERE turma_id=?",Long.class,turma);
        mvc.perform(get("/api/portal/atividades")
            .with(user("aluno-edit@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(id));
        mvc.perform(post("/api/portal/atividades/"+id+"/respostas")
            .with(user("aluno-edit@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"opcao\":1}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.acertou").value(true));

        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES (?,'3B','Terceiro B',2026)",escolaA);
        long destino=jdbc.queryForObject("SELECT id FROM turmas WHERE codigo='3B' AND escola_id=?",Long.class,escolaA);
        mvc.perform(post("/api/gestao/turmas/"+turma+"/transferencias")
            .with(user("dir-edit@escola.test").roles("DIRECAO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"alunoId\":"+aluno+",\"destinoTurmaId\":"+destino+"}"))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/portal/atividades")
            .with(user("aluno-edit@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        mvc.perform(get("/api/portal/minhas-respostas")
            .with(user("aluno-edit@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].atividadeId").value(id))
            .andExpect(jsonPath("$[0].acertou").value(true));
    }


    @Test
    void homologacao2027TransfereAlunoExclusivoPreservaRespostaEIsolaAnos() throws Exception {
        Long aluno2027=criar("aluno-homologacao-2027@escola.test",Papel.ALUNO,escolaA);
        criar("dir-edit-b@escola.test",Papel.DIRECAO,escolaB);
        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES (?,'7A','Setimo A',2027)",escolaA);
        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES (?,'7B','Setimo B',2027)",escolaA);
        Long origem2027=jdbc.queryForObject("SELECT id FROM turmas WHERE escola_id=? AND codigo='7A'",Long.class,escolaA);
        Long destino2027=jdbc.queryForObject("SELECT id FROM turmas WHERE escola_id=? AND codigo='7B'",Long.class,escolaA);
        jdbc.update("INSERT INTO matriculas(turma_id,aluno_id,ano_letivo) VALUES(?,?,2027)",origem2027,aluno2027);
        jdbc.update("INSERT INTO vinculos_docentes(turma_id,professor_id,disciplina) VALUES(?,?,?)",
            origem2027,professor,"MATEMATICA");

        String quiz="""
            {"turmaId":%d,"disciplina":"MATEMATICA","titulo":"Quiz homologacao 2027",
            "pergunta":"Quanto vale 25 por cento de 80?","opcoes":["10","20","30","40"],
            "correta":1,"explicacao":"25 por cento de 80 equivale a 20."}
            """.formatted(origem2027);
        mvc.perform(post("/api/professor/atividades")
            .with(user("prof-edit@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(quiz))
            .andExpect(status().isCreated());
        Long atividade=jdbc.queryForObject("SELECT id FROM atividades WHERE turma_id=?",Long.class,origem2027);
        mvc.perform(post("/api/portal/atividades/"+atividade+"/respostas")
            .with(user("aluno-homologacao-2027@escola.test").roles("ALUNO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"opcao\":1}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.acertou").value(true));

        String destino="{\"alunoId\":"+aluno2027+",\"destinoTurmaId\":"+destino2027+"}";
        mvc.perform(post("/api/gestao/turmas/"+origem2027+"/transferencias")
            .with(user("dir-edit@escola.test").roles("DIRECAO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(destino))
            .andExpect(status().isNoContent());
        String historico="/api/gestao/alunos/"+aluno2027+"/transferencias";
        mvc.perform(get(historico).with(user("dir-edit@escola.test").roles("DIRECAO")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].origemTurmaId").value(origem2027))
            .andExpect(jsonPath("$[0].destinoTurmaId").value(destino2027))
            .andExpect(jsonPath("$[0].anoLetivo").value(2027))
            .andExpect(jsonPath("$[1]").doesNotExist());
        mvc.perform(get(historico).with(user("aluno-homologacao-2027@escola.test").roles("ALUNO")))
            .andExpect(status().isForbidden());
        mvc.perform(get(historico).with(user("prof-edit@escola.test").roles("PROFESSOR")))
            .andExpect(status().isForbidden());
        mvc.perform(get(historico).with(user("dir-edit-b@escola.test").roles("DIRECAO")))
            .andExpect(status().isForbidden());

        mvc.perform(get("/api/portal/turmas")
            .with(user("aluno-homologacao-2027@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].codigo").value("7B"))
            .andExpect(jsonPath("$[1]").doesNotExist());
        mvc.perform(get("/api/portal/atividades")
            .with(user("aluno-homologacao-2027@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        mvc.perform(get("/api/portal/minhas-respostas")
            .with(user("aluno-homologacao-2027@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].atividadeId").value(atividade))
            .andExpect(jsonPath("$[0].acertou").value(true));
        mvc.perform(get("/api/portal/turmas").with(user("aluno-edit@escola.test").roles("ALUNO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].codigo").value("3A"));
        mvc.perform(post("/api/gestao/turmas/"+destino2027+"/transferencias")
            .with(user("dir-edit@escola.test").roles("DIRECAO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"alunoId\":"+aluno2027+",\"destinoTurmaId\":"+turma+"}"))
            .andExpect(status().isConflict());
        jdbc.update("INSERT INTO turmas(escola_id,codigo,nome,ano_letivo) VALUES (?,'7C','Setimo C',2027)",escolaB);
        Long turmaExterna2027=jdbc.queryForObject(
            "SELECT id FROM turmas WHERE escola_id=? AND codigo='7C'",Long.class,escolaB);
        mvc.perform(post("/api/gestao/turmas/"+destino2027+"/transferencias")
            .with(user("dir-edit@escola.test").roles("DIRECAO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"alunoId\":"+aluno2027+",\"destinoTurmaId\":"+turmaExterna2027+"}"))
            .andExpect(status().isNotFound());
        org.junit.jupiter.api.Assertions.assertEquals(destino2027,
            jdbc.queryForObject("SELECT turma_id FROM matriculas WHERE aluno_id=?",Long.class,aluno2027));
        org.junit.jupiter.api.Assertions.assertEquals(1,
            jdbc.queryForObject("SELECT COUNT(*) FROM transferencias_turma WHERE aluno_id=? AND origem_turma_id=? AND destino_turma_id=?",
                Integer.class,aluno2027,origem2027,destino2027));
        mvc.perform(get("/api/gestao/auditoria").with(user("dir-edit@escola.test").roles("DIRECAO")))
            .andExpect(jsonPath("$[0].acao").value("ALUNO_TRANSFERIDO"));
        mvc.perform(get("/api/gestao/auditoria").with(user("dir-edit-b@escola.test").roles("DIRECAO")))
            .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void assistenteExplicaMateriasBasicasGratuitamenteSemApiExterna() throws Exception {
        for(String pergunta:new String[]{
            "O que é fotossíntese?","Como calcular porcentagem?",
            "O que foi a Revolução Francesa?","Qual a diferença entre DNA e RNA?"
        }){
            mvc.perform(post("/api/portal/assistente")
                .with(user("aluno-edit@escola.test").roles("ALUNO")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"pergunta\":\""+pergunta+"\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.tipo").value("ORIENTACAO"))
                .andExpect(jsonPath("$.resposta").isNotEmpty());
        }
        mvc.perform(post("/api/portal/assistente")
            .with(user("prof-edit@escola.test").roles("PROFESSOR")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"pergunta\":\"fotossintese\"}"))
            .andExpect(status().isForbidden());
    }

}
