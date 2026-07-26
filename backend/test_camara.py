
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_deputados():
    response = client.get("/api/deputados?nome=Silas")
    assert response.status_code == 200
    data = response.json()
    assert "dados" in data

def test_get_deputado_detalhes():
    res_list = client.get("/api/deputados")
    if res_list.status_code == 200 and len(res_list.json().get("dados", [])) > 0:
        first_id = res_list.json()["dados"][0]["id"]
        response = client.get(f"/api/deputados/{first_id}")
        assert response.status_code == 200
        assert "dados" in response.json()

def test_get_agenda():
    response = client.get("/api/agenda")
    assert response.status_code == 200
    assert "dados" in response.json()

def test_get_partidos():
    response = client.get("/api/partidos")
    assert response.status_code == 200
    assert "dados" in response.json()

def test_get_votacoes():
    response = client.get("/api/votacoes")
    assert response.status_code == 200
    assert "dados" in response.json()

if __name__ == "__main__":
    print("Running tests...")
    test_get_deputados()
    print("Deputados OK")
    test_get_deputado_detalhes()
    print("Deputado Detalhes OK")
    test_get_agenda()
    print("Agenda OK")
    test_get_partidos()
    print("Partidos OK")
    test_get_votacoes()
    print("Votacoes OK")
    print("All basic endpoints are working!")
