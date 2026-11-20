package br.projeto.extensao;

import java.util.Optional;

public final class ConteudosBasicos {
    private ConteudosBasicos() {}

    public static Optional<String> responder(String pergunta) {
        String texto=pergunta==null?"":pergunta;
        if(texto.contains("fotossintese"))
            return Optional.of("Fotossíntese é o processo em que plantas e algas usam a luz, água e gás carbônico para produzir compostos orgânicos e liberar oxigênio. A clorofila ajuda a capturar a luz. Para praticar: por que uma planta precisa de iluminação adequada?");
        if(texto.contains("porcentagem")||texto.contains("por cento"))
            return Optional.of("Porcentagem representa uma razão por 100. Para achar 20% de 50, faça 20/100 × 50 = 10. Se um produto custa R$ 80 e tem 25% de desconto, o desconto é R$ 20 e o preço final é R$ 60. Que valor corresponde a 10% de 90?");
        if(texto.contains("fracao")||texto.contains("fracoes"))
            return Optional.of("Frações representam partes de um todo: em 3/4, 3 é o numerador e 4 é o denominador. Para somar 1/4 + 2/4, mantenha o denominador e some os numeradores: 3/4. Quando os denominadores são diferentes, use um denominador comum.");
        if(texto.contains("revolucao francesa"))
            return Optional.of("A Revolução Francesa começou em 1789, em um contexto de desigualdade social, dificuldades econômicas e crise política. Mudou as instituições do país e difundiu debates sobre liberdade, igualdade e cidadania. Vale estudar também suas contradições e fases posteriores.");
        if(texto.contains("dna")||texto.contains("rna"))
            return Optional.of("DNA e RNA são ácidos nucleicos. O DNA armazena informações genéticas; muitos RNAs participam da expressão dessas informações, incluindo a produção de proteínas. O DNA costuma ter duas fitas, enquanto o RNA geralmente tem uma. Em que etapa o RNA mensageiro participa?");
        if(texto.contains("leis de newton")||texto.contains("primeira lei de newton"))
            return Optional.of("As leis de Newton descrevem o movimento: 1ª, inércia; 2ª, força resultante igual a massa vezes aceleração (F = m×a); 3ª, ação e reação. Exemplo: uma força resultante de 10 N sobre massa de 2 kg provoca aceleração de 5 m/s².");
        if(texto.contains("sujeito e predicado")||texto.contains("o que e sujeito")||texto.contains("o que e predicado"))
            return Optional.of("Na oração 'Os estudantes revisaram a matéria', o sujeito é 'Os estudantes' e o predicado é 'revisaram a matéria'. O sujeito é o termo sobre o qual se declara algo, e o predicado contém a declaração. Tente identificar na frase: 'A turma começou o projeto'.");
        if(texto.contains("regra de tres")||texto.contains("regra de 3"))
            return Optional.of("A regra de três relaciona grandezas. Exemplo: se 2 cadernos custam R$ 12, 5 custam 12 × 5 ÷ 2 = R$ 30, quando preço e quantidade são diretamente proporcionais. Verifique primeiro se as grandezas são diretas ou inversas.");
        return Optional.empty();
    }
}
