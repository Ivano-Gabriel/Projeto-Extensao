# zELO+ no localhost (Windows / PowerShell)

Guia para rodar **frontend e backend juntos** e testar com dados digitados pelos
próprios colegas. O que o professor publicar no portal zELO+ é salvo no banco
escolhido: não é o catálogo de estudos demonstrativo.

## 1. Verificar ferramentas

Instalar Git, Node.js LTS compatível com Vite 8, Java JDK 21 e Maven 3.6+.
Executar no PowerShell:

```powershell
git --version
node --version
npm --version
java -version
mvn.cmd --version
```

Em caso de erro "mvn não é reconhecido", instalar Maven, configurar
`MAVEN_HOME`/PATH e abrir **outro terminal**.

## 2. Obter projeto

```powershell
git clone https://github.com/Ivano-Gabriel/Projeto-Extensao.git
cd Projeto-Extensao
```

Se o repositório já estiver clonado, usar `git pull origin main` na
pasta em vez de clonar de novo. **Não executar dois projetos na mesma porta**.

## 3. Terminal A — API + banco H2 de desenvolvimento

Abra um PowerShell na raiz do repositório:

```powershell
cd Backend
$env:APP_BOOTSTRAP_ADMIN = "true"
$env:APP_BOOTSTRAP_ADMIN_EMAIL = "admin-local@exemplo.test"
$env:APP_BOOTSTRAP_ADMIN_NAME = "Administrador Local"
$env:APP_BOOTSTRAP_ADMIN_PASSWORD = "<uma-senha-forte-com-16-ou-mais-caracteres>"
mvn.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

Substitua a senha de exemplo por uma senha sua. Não compartilhe a senha,
não a envie no chat e não a salve no GitHub.

O perfil `dev` usa **H2 temporário em memória** e desliga o cookie
`Secure` somente para localhost. A API responde em
`http://127.0.0.1:3001/healthz`.

**Ao reiniciar a API, o H2 em memória perde os dados**. Para persistência entre
reinícios, usar um PostgreSQL de desenvolvimento separado e configurado apenas
na sua máquina. Não apontar a API local ao banco de produção.

## 4. Terminal B — frontend Vite

Abra **outro** PowerShell na raiz do repositório:

```powershell
cd apps/estudos
npm ci
npm run dev
```

Abrir `http://127.0.0.1:5173` no navegador.

O `vite.config.ts` já contém proxy de desenvolvimento:
`/api/*` e `/healthz` são enviados à API da porta 3001.
Assim o navegador usa **a mesma origem** para login, cookie HttpOnly e CSRF.
**Não** configurar CORS com `*`, desativar CSRF ou colocar token
de sessão em localStorage.

Se entrar no Vite mas não conseguir logar, confira se o Terminal A está
rodando e se `/healthz` funciona. Erros `ECONNREFUSED 127.0.0.1:3001`
significam que o backend não subiu.

## 5. Criar dados de teste no banco, sem fake na interface

1. Entrar com a conta de administrador criada no Terminal A.
2. Abrir **Escolas da plataforma**, criar uma escola fictícia de homologação
   e depois cadastrar uma conta de **Direção**.
3. Sair e entrar com a conta da direção.
4. Em **Pessoas**, cadastrar contas fictícias de professores e alunos.
5. Em **Turmas**, criar 3A e 3B (mesmo ano letivo).
6. Em **Vínculos**, matricular o aluno em 3A e vincular o professor à 3A
   em uma disciplina.
7. Entrar como professor, selecionar 3A, abrir **Atividades** e criar uma
   questão própria com quatro alternativas, gabarito e explicação.
8. Entrar como aluno da 3A e abrir **Minha turma → Atividades**:
   a questão criada pelo professor estará disponível com resposta persistida.
9. Voltar como direção e testar a **transferência de 3A para 3B**.
   O histórico permanece gravado e o estudante passa a acessar atividades
   da nova turma.

Os materiais de exemplo do **Laboratório (demo)** não viram registros
oficiais: são independentes das atividades publicadas pelo professor.

## 6. Rodar testes antes de enviar PR

```powershell
# Na pasta Backend
mvn.cmd test

# Na pasta apps/estudos
npm test
npm run build
```

## 7. Ver interface mobile

No Chrome/Firefox desktop, abra as ferramentas de desenvolvedor
(`F12`) e ative o modo responsivo. O frontend local está disponível
no computador sem colocar a API em rede pública.

## Observações

- Usar somente nomes fictícios e dados de homologação: o projeto ainda
  não é um sistema institucional aprovado para dados pessoais de menores.
- A IA generativa só funciona com provedor configurado e habilitado, mas
  o **assistente gratuito** (regras predefinidas de estudos) funciona sem
  chave ou faturamento.
- Para hospedar continuamente a API e persistir dados entre reinícios,
  usar PostgreSQL e serviço adequados em ambiente separado.
