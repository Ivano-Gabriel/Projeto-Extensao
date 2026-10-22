# Backend (demonstração)

API simples em Java (Spring Boot) com banco H2 em arquivo. Serve só para o
login e para guardar onde o aluno estava quando saiu.

## Rodar

```powershell
cd Backend
mvn spring-boot:run
```

Não precisa instalar banco: a pasta `dados/` é criada sozinha na primeira vez,
já com o aluno `mayckexemplo@gmail.com` (a senha fica salva como hash BCrypt).
Para zerar tudo, pare o Backend e apague a pasta `dados/`.

Se aparecer `ClassNotFoundException`, mova o projeto para uma pasta sem acento
e fora do OneDrive (ex.: `C:\dev\Projeto-Extensao`) e rode de novo.

## Rotas (porta 3001)

| Rota | O que faz |
|---|---|
| `POST /api/login` | `{ email, senha }` → `{ token, nome, email, estado }` ou 401 |
| `POST /api/estado` | salva `{ aba, dia }` (header `Authorization: Bearer <token>`) |
| `POST /api/logout` | encerra a sessão |
