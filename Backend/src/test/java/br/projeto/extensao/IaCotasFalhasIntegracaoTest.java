package br.projeto.extensao;

import static org.junit.jupiter.api.Assertions.*;

import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
@ActiveProfiles("test")
class IaCotasFalhasIntegracaoTest {
    @Autowired UsuarioRepository usuarios;
    @Autowired IaCotasService cotas;
    @Autowired IaExecucaoComCota execucao;
    Long professorId;

    @BeforeEach
    void criarUsuarioFicticio(){
        Usuario professor = new Usuario("Professor QA Cota",
            "qa-ia-"+UUID.randomUUID()+"@example.invalid", "hash-de-teste-nao-usado", Papel.PROFESSOR);
        professorId = usuarios.saveAndFlush(professor).getId();
    }
    @AfterEach
    void limparUsuarioFicticio(){
        if(professorId!=null)usuarios.deleteById(professorId);
    }

    @Test
    void erro429DoProvedorDevolveCotaAoProfessor(){
        int antes = cotas.restantes(professorId,Papel.PROFESSOR);
        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
            ()->execucao.executar(professorId,Papel.PROFESSOR,restantes->{
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Limite do provedor");
            }));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS,erro.getStatusCode());
        assertEquals(antes,cotas.restantes(professorId,Papel.PROFESSOR));
    }

    @Test
    void quizInvalidoOuFalhaDePersistenciaNaoConsomeCota(){
        int antes=cotas.restantes(professorId,Papel.PROFESSOR);
        for(int tentativa=0;tentativa<3;tentativa++){
            assertThrows(IllegalArgumentException.class,
                ()->execucao.executar(professorId,Papel.PROFESSOR,restantes->{
                    throw new IllegalArgumentException("Resposta inválida");
                }));
        }
        assertEquals(antes,cotas.restantes(professorId,Papel.PROFESSOR));
    }

    @Test
    void geracaoBemSucedidaConsomeUmaUnicaCota(){
        int antes=cotas.restantes(professorId,Papel.PROFESSOR);
        String texto=execucao.executar(professorId,Papel.PROFESSOR,
            restantes->"Rascunho revisável");
        assertEquals("Rascunho revisável",texto);
        assertEquals(antes-1,cotas.restantes(professorId,Papel.PROFESSOR));
    }

    @Test
    void estornoNuncaCriaSaldoAcimaDoLimite(){
        int antes=cotas.restantes(professorId,Papel.PROFESSOR);
        cotas.devolver(professorId);
        assertEquals(antes,cotas.restantes(professorId,Papel.PROFESSOR));
    }
}
