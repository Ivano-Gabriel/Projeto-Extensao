"""Testes rápidos: pip install httpx pytest && pytest"""
import os
import tempfile
from pathlib import Path

import db

db.ARQUIVO = Path(tempfile.mkdtemp()) / "teste.db"

from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402


def test_fluxo_completo():
    with TestClient(app) as c:
        assert len(c.get("/api/compromissos").json()) == 7
        novo = {"tipo": "Prova", "titulo": " Física ", "disciplina": "Física", "quando": "2026-11-01T11:00:00.000Z"}
        criado = c.post("/api/compromissos", json=novo)
        assert criado.status_code == 201 and criado.json()["titulo"] == "Física"
        id_ = criado.json()["id"]
        assert c.patch(f"/api/compromissos/{id_}/status", json={"status": "concluido"}).json()["status"] == "concluido"
        assert c.put(f"/api/compromissos/{id_}", json={**novo, "titulo": "Física 2"}).json()["titulo"] == "Física 2"
        assert len(c.get("/api/compromissos?tipo=Aviso").json()) == 1
        assert c.delete(f"/api/compromissos/{id_}").status_code == 204
        assert c.get(f"/api/compromissos/{id_}").status_code == 404
        assert c.post("/api/compromissos", json={**novo, "quando": "ontem"}).status_code == 422
        assert c.post("/api/admin/restaurar").status_code == 204
        assert len(c.get("/api/compromissos").json()) == 7
