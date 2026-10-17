"""Acesso ao banco SQLite. Sem ORM de propósito: o SQL fica visível e fácil de estudar."""
import sqlite3
from contextlib import closing
from datetime import datetime, timedelta, timezone
from pathlib import Path

PASTA = Path(__file__).parent
ARQUIVO = PASTA / "banco.db"
COLUNAS = "id, tipo, titulo, disciplina, quando, status, criado_em AS criadoEm"


def _conectar() -> sqlite3.Connection:
    con = sqlite3.connect(ARQUIVO)
    con.row_factory = sqlite3.Row
    return con


def buscar(sql: str, params: tuple = ()) -> list[dict]:
    with closing(_conectar()) as con:
        return [dict(linha) for linha in con.execute(sql, params)]


def executar(sql: str, params: tuple = ()) -> tuple[int, int]:
    """Roda INSERT/UPDATE/DELETE com commit. Devolve (id inserido, linhas afetadas)."""
    with closing(_conectar()) as con, con:
        cur = con.execute(sql, params)
        return cur.lastrowid or 0, cur.rowcount


def para_iso(momento: datetime) -> str:
    return momento.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def _dia_hora(dias: int, hora: int, minuto: int = 0) -> str:
    d = datetime.now().astimezone() + timedelta(days=dias)
    return para_iso(d.replace(hour=hora, minute=minuto, second=0, microsecond=0))


def _popular() -> None:
    agora = para_iso(datetime.now())
    ate_sexta = (4 - datetime.now().weekday()) % 7 or 7
    exemplos = [
        ("Prova", "Funções do 2º grau", "Matemática", _dia_hora(1, 8), "pendente"),
        ("Trabalho", "Modernismo brasileiro", "Português", _dia_hora(ate_sexta, 23, 59), "pendente"),
        ("Aviso", "Feira de ciências confirmada", "Direção", _dia_hora(0, 7), "pendente"),
        ("Trabalho", "Lista de exercícios", "Matemática", _dia_hora(-1, 18), "concluido"),
        ("Trabalho", "Resenha do livro", "Português", _dia_hora(-2, 18), "concluido"),
        ("Trabalho", "Relatório de laboratório", "Química", _dia_hora(-3, 18), "concluido"),
        ("Trabalho", "Seminário", "História", _dia_hora(-4, 18), "concluido"),
    ]
    with closing(_conectar()) as con, con:
        con.executemany(
            "INSERT INTO compromissos (tipo, titulo, disciplina, quando, status, criado_em) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            [(*e, agora) for e in exemplos],
        )


def iniciar() -> None:
    with closing(_conectar()) as con, con:
        con.executescript((PASTA / "schema.sql").read_text(encoding="utf-8"))
    if buscar("SELECT 1 FROM compromissos LIMIT 1") == []:
        _popular()


def restaurar_exemplo() -> None:
    executar("DELETE FROM compromissos")
    executar("DELETE FROM sqlite_sequence WHERE name = 'compromissos'")
    _popular()
