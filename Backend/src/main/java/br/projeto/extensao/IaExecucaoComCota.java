package br.projeto.extensao;

import java.util.function.IntFunction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Reserva uma tentativa de IA e devolve a cota quando a operacao
 * nao produz resultado validado. O sucesso continua consumindo uma cota.
 */
@Service
public class IaExecucaoComCota {
    private static final Logger LOG=LoggerFactory.getLogger(IaExecucaoComCota.class);
    private final IaCotasService cotas;

    public IaExecucaoComCota(IaCotasService cotas) {
        this.cotas=cotas;
    }

    public <T> T executar(Long usuarioId,Papel papel,IntFunction<T> operacao) {
        int restantes=cotas.reservar(usuarioId,papel);
        try {
            return operacao.apply(restantes);
        }catch(RuntimeException original) {
            try {
                cotas.devolver(usuarioId);
            }catch(RuntimeException falhaEstorno) {
                LOG.error("Falha ao restituir a cota de IA apos geracao malsucedida.");
            }
            throw original;
        }
    }
}
