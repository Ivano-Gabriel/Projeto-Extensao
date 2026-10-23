package br.projeto.extensao;

import jakarta.persistence.*;
import java.util.Locale;

@Entity
@Table(name = "usuarios")
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(name = "senha_hash", nullable = false, length = 100)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Papel papel;

    @Column(name = "ultima_aba", length = 15)
    private String ultimaAba;

    @Column(name = "ultimo_dia", length = 3)
    private String ultimoDia;

    protected Usuario() {}

    public Usuario(String nome, String email, String senhaHash, Papel papel) {
        this.nome = nome.trim();
        this.email = email.trim().toLowerCase(Locale.ROOT);
        this.senhaHash = senhaHash;
        this.papel = papel;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getSenhaHash() { return senhaHash; }
    public Papel getPapel() { return papel; }
    public String getUltimaAba() { return ultimaAba; }
    public String getUltimoDia() { return ultimoDia; }

    public void salvarEstado(String aba, String dia) {
        this.ultimaAba = aba;
        this.ultimoDia = dia;
    }
}
