package br.projeto.extensao;

import jakarta.persistence.*;

@Entity
@Table(name = "alunos")
public class Aluno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    // Nunca a senha pura: aqui fica só o hash BCrypt
    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    // Onde o aluno estava quando saiu (null = nunca saiu ainda)
    private String ultimaAba;
    private String ultimoDia;

    protected Aluno() {}

    public Aluno(String nome, String email, String senhaHash) {
        this.nome = nome;
        this.email = email;
        this.senhaHash = senhaHash;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getSenhaHash() { return senhaHash; }
    public String getUltimaAba() { return ultimaAba; }
    public String getUltimoDia() { return ultimoDia; }

    public void salvarEstado(String aba, String dia) {
        this.ultimaAba = aba;
        this.ultimoDia = dia;
    }
}
