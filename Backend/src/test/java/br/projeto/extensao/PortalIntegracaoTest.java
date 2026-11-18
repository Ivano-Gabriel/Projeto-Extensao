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
class PortalIntegracaoTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UsuarioRepository usuarios;
    @Autowired PasswordEncoder senha;

    private Long escolaA;
    private Long escolaB;
    private Long direcaoA;
    private Long alunoA;
    private Long alunoB;
    private Long professorA;
    private Long professorB;

    @BeforeEach
    void preparar() {
        jdbc.update("DELETE FROM vinculos_docentes");
        jdbc.update("DELETE FROM matriculas");
        jdbc.update("DELETE FROM turmas");
        usuarios.deleteAll();
        jdbc.update("DELETE FROM escolas");
        jdbc.update("INSERT INTO escolas (codigo,nome) VALUES ('e-a','Escola A'),('e-b','Escola B')");
        escolaA=jdbc.queryForObject("SELECT id FROM escolas WHERE codigo='e-a'",Long.class);
        escolaB=jdbc.queryForObject("SELECT id FROM escolas WHERE codigo='e-b'",Long.class);
        direcaoA=criar("direcao.a@escola.test",Papel.DIRECAO,escolaA);
        alunoA=criar("aluno.a@escola.test",Papel.ALUNO,escolaA);
        alunoB=criar("aluno.b@escola.test",Papel.ALUNO,escolaB);
        professorA=criar("professor.a@escola.test",Papel.PROFESSOR,escolaA);
        professorB=criar("professor.b@escola.test",Papel.PROFESSOR,escolaB);
    }

    Long criar(String email,Papel papel,Long escolaId) {
        Usuario novo=new Usuario(email,email,senha.encode("SenhaForteTeste2026!"),papel);
        novo.vincularEscola(escolaId);
        return usuarios.saveAndFlush(novo).getId();
    }

    long turma(String codigo,Long escolaId) {
        jdbc.update("INSERT INTO turmas (escola_id,codigo,nome,ano_letivo) VALUES (?,?,?,?)",
            escolaId,codigo,"3º ano",2026);
        return jdbc.queryForObject("SELECT id FROM turmas WHERE escola_id=? AND codigo=?",
            Long.class,escolaId,codigo);
    }

    @Test
    void acessoAnonimoNaoConsultaTurmas() throws Exception {
        mvc.perform(get("/api/portal/turmas")).andExpect(status().isUnauthorized());
    }

    @Test
    void usuarioSoListaTurmasDeSeuPapelEEscola() throws Exception {
        long classeA=turma("3A",escolaA), classeB=turma("3B",escolaB);
        jdbc.update("INSERT INTO matriculas(turma_id,aluno_id,ano_letivo) VALUES (?,?,2026)",classeA,alunoA);
        jdbc.update("INSERT INTO matriculas(turma_id,aluno_id,ano_letivo) VALUES (?,?,2026)",classeB,alunoB);
        jdbc.update("INSERT INTO vinculos_docentes(turma_id,professor_id,disciplina) VALUES (?,?,?)",
            classeA,professorA,"MATEMATICA");

        mvc.perform(get("/api/portal/turmas")
            .with(user("aluno.a@escola.test").roles("ALUNO")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].codigo").value("3A"))
            .andExpect(jsonPath("$[1]").doesNotExist());

        mvc.perform(get("/api/portal/turmas")
            .with(user("professor.a@escola.test").roles("PROFESSOR")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].codigo").value("3A"))
            .andExpect(jsonPath("$[1]").doesNotExist());

        mvc.perform(get("/api/portal/turmas")
            .with(user("direcao.a@escola.test").roles("DIRECAO")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].codigo").value("3A"))
            .andExpect(jsonPath("$[1]").doesNotExist());
    }

    @Test
    void soProfessorVinculadoOuDirecaoDaMesmaEscolaVeAlunos() throws Exception {
        long classe=turma("3A",escolaA);
        jdbc.update("INSERT INTO matriculas(turma_id,aluno_id,ano_letivo) VALUES (?,?,2026)",classe,alunoA);
        jdbc.update("INSERT INTO vinculos_docentes(turma_id,professor_id,disciplina) VALUES (?,?,?)",
            classe,professorA,"MATEMATICA");

        mvc.perform(get("/api/portal/turmas/"+classe+"/alunos")
            .with(user("professor.a@escola.test").roles("PROFESSOR")))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(alunoA));
        mvc.perform(get("/api/portal/turmas/"+classe+"/alunos")
            .with(user("professor.b@escola.test").roles("PROFESSOR")))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/portal/turmas/"+classe+"/alunos")
            .with(user("aluno.a@escola.test").roles("ALUNO")))
            .andExpect(status().isForbidden());
    }

    @Test
    void direcaoNaoPodeMatricularAlunoDeOutraEscolaNemCriarAdmin() throws Exception {
        long classe=turma("3A",escolaA);
        mvc.perform(post("/api/gestao/turmas/"+classe+"/matriculas")
            .with(user("direcao.a@escola.test").roles("DIRECAO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"alunoId\":"+alunoB+"}"))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/gestao/usuarios")
            .with(user("direcao.a@escola.test").roles("DIRECAO"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"nome\":\"Admin\",\"email\":\"admin.test@escola.test\",\"senha\":\"SenhaForteTeste2026!\",\"papel\":\"DIRECAO\"}"))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/gestao/usuarios")
            .with(user("direcao.a@escola.test").roles("DIRECAO")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.email == 'aluno.b@escola.test')]").isEmpty());
    }

    @Test
    void direcaoCadastraTurmaMatriculaEProfessorDaPropriaEscola() throws Exception {
        mvc.perform(post("/api/gestao/turmas")
            .with(user("direcao.a@escola.test").roles("DIRECAO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"codigo\":\"3C\",\"nome\":\"Terceiro Ano C\",\"anoLetivo\":2026}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.codigo").value("3C"));
        long classe=jdbc.queryForObject("SELECT id FROM turmas WHERE codigo='3C'",Long.class);

        mvc.perform(post("/api/gestao/turmas/"+classe+"/matriculas")
            .with(user("direcao.a@escola.test").roles("DIRECAO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"alunoId\":"+alunoA+"}")).andExpect(status().isCreated());

        mvc.perform(post("/api/gestao/turmas/"+classe+"/professores")
            .with(user("direcao.a@escola.test").roles("DIRECAO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"professorId\":"+professorA+",\"disciplina\":\"MATEMATICA\"}"))
            .andExpect(status().isCreated());

        mvc.perform(get("/api/portal/turmas")
            .with(user("aluno.a@escola.test").roles("ALUNO")))
            .andExpect(jsonPath("$[0].codigo").value("3C"));
        mvc.perform(get("/api/portal/turmas/"+classe+"/alunos")
            .with(user("professor.a@escola.test").roles("PROFESSOR")))
            .andExpect(jsonPath("$[0].id").value(alunoA));

        mvc.perform(post("/api/gestao/turmas/"+classe+"/matriculas")
            .with(user("direcao.a@escola.test").roles("DIRECAO")).with(csrf())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"alunoId\":"+alunoA+"}")).andExpect(status().isConflict());
    }

    @Test
    void naoPermiteProfessorDeMesmaEscolaSemVinculoConsultarTurma() throws Exception {
        long classe=turma("3C",escolaA);
        mvc.perform(get("/api/portal/turmas/"+classe+"/alunos")
            .with(user("professor.a@escola.test").roles("PROFESSOR")))
            .andExpect(status().isForbidden());
    }

    @Test
    void professorNaoVinculadoNaoCriaAtividadeNemAssociaTurma() throws Exception {
        long classe=turma("3A",escolaA);
        mvc.perform(post("/api/gestao/turmas/"+classe+"/professores")
            .with(user("professor.a@escola.test").roles("PROFESSOR"))
            .with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"professorId\":"+professorA+",\"disciplina\":\"MATEMATICA\"}"))
            .andExpect(status().isForbidden());
    }
}
