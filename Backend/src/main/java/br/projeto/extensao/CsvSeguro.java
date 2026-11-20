package br.projeto.extensao;

public final class CsvSeguro {
    private CsvSeguro() {}

    public static String celula(String valor) {
        String texto=valor==null?"":valor.replace('\r',' ').replace('\n',' ');
        String checagem=texto.stripLeading();
        if(!checagem.isEmpty() && "=+-@".indexOf(checagem.charAt(0))>=0)
            texto="'"+texto;
        return "\""+texto.replace("\"","\"\"")+"\"";
    }
}
