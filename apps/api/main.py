"""API do Projeto de Extensão. Rodar: uvicorn main:app --reload  (docs em /docs)."""
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

import db

Tipo = Literal["Prova", "Trabalho", "Aviso"]
Status = Literal["pendente", "concluido"]


class NovoCompromisso(BaseModel):
    tipo: Tipo
    titulo: str = Field(min_length=1, max_length=160)
    disciplina: str = Field(min_length=1, max_length=80)
    quando: str

    @field_validator("titulo", "disciplina")
    @classmethod
    def sem_espacos_nas_pontas(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError("não pode ficar em branco")
        return valor

    @field_validator("quando")
    @classmethod
    def data_iso(cls, valor: str) -> str:
        try:
            momento = datetime.fromisoformat(valor.replace("Z", "+00:00"))
        except ValueError as erro:
            raise ValueError("use data e hora no formato ISO 8601") from erro
        if momento.tzinfo is None:
            momento = momento.replace(tzinfo=timezone.utc)
        return db.para_iso(momento)


class AtualizaStatus(BaseModel):
    status: Status


class Compromisso(BaseModel):
    id: int
    tipo: Tipo
    titulo: str
    disciplina: str
    quando: str
    status: Status
    criadoEm: str


@asynccontextmanager
async def ciclo_de_vida(_: FastAPI):
    db.iniciar()
    yield


app = FastAPI(title="Projeto de Extensão API", lifespan=ciclo_de_vida)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _buscar_um(id: int) -> dict:
    linhas = db.buscar(f"SELECT {db.COLUNAS} FROM compromissos WHERE id = ?", (id,))
    if not linhas:
        raise HTTPException(404, "Compromisso não encontrado")
    return linhas[0]


@app.get("/api/compromissos", response_model=list[Compromisso])
def listar(tipo: Tipo | None = Query(None), status: Status | None = Query(None)):
    sql, params = f"SELECT {db.COLUNAS} FROM compromissos WHERE 1 = 1", []
    if tipo:
        sql += " AND tipo = ?"
        params.append(tipo)
    if status:
        sql += " AND status = ?"
        params.append(status)
    return db.buscar(sql + " ORDER BY quando", tuple(params))


@app.get("/api/compromissos/{id}", response_model=Compromisso)
def detalhar(id: int):
    return _buscar_um(id)


@app.post("/api/compromissos", response_model=Compromisso, status_code=201)
def criar(novo: NovoCompromisso):
    novo_id, _ = db.executar(
        "INSERT INTO compromissos (tipo, titulo, disciplina, quando, criado_em) VALUES (?, ?, ?, ?, ?)",
        (novo.tipo, novo.titulo, novo.disciplina, novo.quando, db.para_iso(datetime.now())),
    )
    return _buscar_um(novo_id)


@app.put("/api/compromissos/{id}", response_model=Compromisso)
def substituir(id: int, dados: NovoCompromisso):
    _, afetadas = db.executar(
        "UPDATE compromissos SET tipo = ?, titulo = ?, disciplina = ?, quando = ? WHERE id = ?",
        (dados.tipo, dados.titulo, dados.disciplina, dados.quando, id),
    )
    if not afetadas:
        raise HTTPException(404, "Compromisso não encontrado")
    return _buscar_um(id)


@app.patch("/api/compromissos/{id}/status", response_model=Compromisso)
def mudar_status(id: int, corpo: AtualizaStatus):
    _, afetadas = db.executar("UPDATE compromissos SET status = ? WHERE id = ?", (corpo.status, id))
    if not afetadas:
        raise HTTPException(404, "Compromisso não encontrado")
    return _buscar_um(id)


@app.delete("/api/compromissos/{id}", status_code=204)
def excluir(id: int):
    _, afetadas = db.executar("DELETE FROM compromissos WHERE id = ?", (id,))
    if not afetadas:
        raise HTTPException(404, "Compromisso não encontrado")
    return Response(status_code=204)


@app.post("/api/admin/restaurar", status_code=204)
def restaurar():
    db.restaurar_exemplo()
    return Response(status_code=204)
