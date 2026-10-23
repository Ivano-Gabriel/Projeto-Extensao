package br.projeto.extensao;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SegurancaIntegracaoTest {

    @Autowired MockMvc mvc;
    @Autowired UsuarioRepository usuarios;
    @Autowired PasswordEncoder encoder;

    private Long alunoId;

    @BeforeEach
    void preparar() {
        usuarios.deleteAll();
        alunoId = usuarios.save(new Usuario("Aluno Teste", "aluno.teste@escola.edu.br",
                encoder.encode("TesteSeguro123!"), Papel.ALUNO)).getId();
    }

    @Test
    void impedeLeituraSemLogin() throws Exception {
        mvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/alunos/" + alunoId)).andExpect(status().isUnauthorized());
    }

    @Test
    void impedePostSemCsrf() throws Exception {
        mvc.perform(post("/api/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"aluno.teste@escola.edu.br\",\"senha\":\"TesteSeguro123!\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void loginValidoNaoDevolveTokenNoJson() throws Exception {
        mvc.perform(post("/api/login").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"aluno.teste@escola.edu.br\",\"senha\":\"TesteSeguro123!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("aluno.teste@escola.edu.br"))
                .andExpect(jsonPath("$.papel").value("ALUNO"))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.senhaHash").doesNotExist());
    }

    @Test
    void senhaErradaNaoAutentica() throws Exception {
        mvc.perform(post("/api/login").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"aluno.teste@escola.edu.br\",\"senha\":\"senha-errada\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void alunoNaoAcessaOutroAlunoOuDirecao() throws Exception {
        Long outro = usuarios.save(new Usuario("Outro", "outro@escola.edu.br",
                encoder.encode("TesteSeguro123!"), Papel.ALUNO)).getId();
        mvc.perform(get("/api/alunos/" + outro).with(user("aluno.teste@escola.edu.br").roles("ALUNO")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/alunos/" + alunoId).with(user("aluno.teste@escola.edu.br").roles("ALUNO")))
                .andExpect(status().isOk());
        mvc.perform(get("/api/gestao/usuarios").with(user("aluno.teste@escola.edu.br").roles("ALUNO")))
                .andExpect(status().isForbidden());
    }

    @Test
    void professorNaoVeDadosPessoaisDeAlunoSemVinculo() throws Exception {
        mvc.perform(get("/api/alunos/" + alunoId).with(user("professor@escola.edu.br").roles("PROFESSOR")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/professor/area").with(user("professor@escola.edu.br").roles("PROFESSOR")))
                .andExpect(status().isOk());
    }

    @Test
    void direcaoPodeListarAlunos() throws Exception {
        mvc.perform(get("/api/gestao/usuarios").with(user("direcao@escola.edu.br").roles("DIRECAO")))
                .andExpect(status().isOk());
    }

    @Test
    void cabecalhosDeSegurancaSaoEnviados() throws Exception {
        mvc.perform(get("/healthz"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Content-Type-Options"))
                .andExpect(header().exists("X-Frame-Options"));
    }

    @Test
    void csrfPublicoNaoExpõeSenhaOuSessao() throws Exception {
        mvc.perform(get("/api/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void loginCriaSessaoJDBCQuePermiteMeELogoutEncerraSessao() throws Exception {
        var resposta = mvc.perform(post("/api/login").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"aluno.teste@escola.edu.br\",\"senha\":\"TesteSeguro123!\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse();

        var sessao = java.util.Arrays.stream(resposta.getCookies())
                .filter(cookie -> cookie.getName().equals("EXTENSAO_SESSION"))
                .findFirst().orElseThrow();

        mvc.perform(get("/api/me").cookie(sessao))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("aluno.teste@escola.edu.br"));

        mvc.perform(post("/api/logout").cookie(sessao).with(csrf()))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/me").cookie(sessao))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void soDirecaoPodeCriarUsuario() throws Exception {
        String body = "{\"nome\":\"Docente\",\"email\":\"docente@escola.edu.br\",\"senha\":\"SenhaForte12345!\",\"papel\":\"PROFESSOR\"}";
        mvc.perform(post("/api/gestao/usuarios").with(user("aluno.teste@escola.edu.br").roles("ALUNO"))
                .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/gestao/usuarios").with(user("direcao@escola.edu.br").roles("DIRECAO"))
                .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.papel").value("PROFESSOR"))
                .andExpect(jsonPath("$.senha").doesNotExist())
                .andExpect(jsonPath("$.senhaHash").doesNotExist());
    }
}
