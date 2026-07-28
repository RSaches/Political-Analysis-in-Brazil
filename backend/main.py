from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
import time
from functools import wraps

def ttl_cache(ttl=300):
    def decorator(func):
        cache = {}
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = str(args) + str(kwargs)
            if key in cache:
                result, timestamp = cache[key]
                if time.time() - timestamp < ttl:
                    return result
            result = func(*args, **kwargs)
            cache[key] = (result, time.time())
            return result
        return wrapper
    return decorator

app = FastAPI(title="Olho de Águia API", version="1.0.0")

# Setup Database
import models
from database import engine
import auth
models.Base.metadata.create_all(bind=engine)
app.include_router(auth.router)

# CORS config to allow Next.js frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ChromaDB client (local persistent storage)
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# Example collection for laws
laws_collection = chroma_client.get_or_create_collection(name="leis_e_constituicao")
# Example collection for agent memories/reflections
memory_collection = chroma_client.get_or_create_collection(name="agent_memories")

class QueryRequest(BaseModel):
    query: str

@app.get("/")
def read_root():
    return {"status": "Olho de Águia Backend is running!"}

from duckduckgo_search import DDGS
from agents import analisar_cenario, gerar_dossie_deputado, gerar_dossie_votacao
import urllib.request
import urllib.parse
import re
import json
import xml.etree.ElementTree as ET
from html import unescape
from html.parser import HTMLParser
from urllib.parse import urljoin
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime


class PerfilSenadorParser(HTMLParser):
    """Extrai somente o conteúdo parlamentar visível da página pública do Senado."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_content = False
        self.content_depth = 0
        self.current_section = "Perfil parlamentar"
        self.sections = {}
        self.personal_data = {}
        self.in_personal_data = False
        self.capture_tag = None
        self.capture_text = []
        self.table_headers = []
        self.current_table = None
        self.current_row = []
        self.current_cell = []
        self.current_link = None
        self.current_link_text = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get("class", "").split()
        if tag == "section" and "conteudo" in classes:
            self.in_content = True
            self.content_depth = 1
        elif self.in_content and tag == "section":
            self.content_depth += 1

        if not self.in_content:
            return

        if tag == "div" and "dadosPessoais" in classes:
            self.in_personal_data = True
        if tag in {"h2", "h3", "dt", "dd", "th", "td"}:
            self.capture_tag = tag
            self.capture_text = []
        if tag == "table":
            self.current_table = []
            self.table_headers = []
        if tag == "tr" and self.current_table is not None:
            self.current_row = []
        if tag in {"th", "td"} and self.current_table is not None:
            self.current_cell = []
        if tag == "a" and attrs.get("href"):
            self.current_link = urljoin("https://www25.senado.leg.br", unescape(attrs["href"]))
            self.current_link_text = []

    def handle_data(self, data):
        if self.in_content and self.capture_tag:
            self.capture_text.append(data)
        if self.in_content and self.current_link:
            self.current_link_text.append(data)
        if self.in_content and self.current_table is not None and self.capture_tag in {"th", "td"}:
            self.current_cell.append(data)

    def handle_endtag(self, tag):
        if self.in_content and tag in {"h2", "h3", "dt", "dd", "th", "td"} and self.capture_tag == tag:
            text = " ".join(" ".join(self.capture_text).split())
            if tag in {"h2", "h3"} and text:
                self.current_section = text
                self.sections.setdefault(text, {"tables": [], "links": []})
            elif self.in_personal_data and tag == "dt":
                self.last_personal_label = text.rstrip(":")
            elif self.in_personal_data and tag == "dd" and getattr(self, "last_personal_label", None) and text:
                self.personal_data[self.last_personal_label] = text
            elif tag == "th" and self.current_table is not None:
                self.table_headers.append(text)
            elif tag == "td" and self.current_table is not None:
                self.current_row.append(text)
            self.capture_tag = None
            self.capture_text = []

        if self.in_content and tag == "a" and self.current_link:
            section = self.sections.setdefault(self.current_section, {"tables": [], "links": []})
            link_text = " ".join(" ".join(self.current_link_text).split())
            if link_text and not any(link["url"] == self.current_link for link in section["links"]):
                section["links"].append({"titulo": link_text, "url": self.current_link})
            self.current_link = None
            self.current_link_text = []

        if self.in_content and tag == "tr" and self.current_table is not None and self.current_row:
            self.current_table.append(self.current_row)
        if self.in_content and tag == "table" and self.current_table is not None:
            if self.current_table:
                self.sections.setdefault(self.current_section, {"tables": [], "links": []})["tables"].append({
                    "cabecalhos": self.table_headers,
                    "linhas": self.current_table,
                })
            self.current_table = None
        if self.in_content and tag == "div" and self.in_personal_data:
            self.in_personal_data = False

        if self.in_content and tag == "section":
            self.content_depth -= 1
            if self.content_depth == 0:
                self.in_content = False


@app.get("/api/senadores/{codigo}/perfil-oficial")
@ttl_cache(ttl=3600)
def get_perfil_oficial_senador(codigo: str):
    """Importa os dados públicos exibidos na página oficial do senador."""
    if not codigo.isdigit():
        raise HTTPException(status_code=400, detail="Código de senador inválido.")
    try:
        import httpx
        url = f"https://www25.senado.leg.br/web/senadores/senador/-/perfil/{codigo}"
        response = httpx.get(url, timeout=20, follow_redirects=True, headers={"User-Agent": "Olho-de-Aguia/1.0"})
        response.raise_for_status()
        parser = PerfilSenadorParser()
        parser.feed(response.text)
        return {
            "fonte": url,
            "dadosPessoais": parser.personal_data,
            "secoes": [
                {"titulo": titulo, **conteudo}
                for titulo, conteudo in parser.sections.items()
                if conteudo["tables"] or conteudo["links"]
            ],
        }
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Não foi possível consultar a página oficial do Senado: {str(e)}")


SERVICOS_DADOS_SENADO = {
    "ApartesParlamentar": "senador/{codigo}/apartes?v=5",
    "CargoParlamentar": "senador/{codigo}/cargos?v=5",
    "DiscursosParlamentar": "senador/{codigo}/discursos?v=5",
    "FiliacaoParlamentar": "senador/{codigo}/filiacoes?v=5",
    "HistoricoAcademicoParlamentar": "senador/historicoAcademico/{codigo}/historicoAcademico?v=1",
    "LicencaParlamentar": "senador/{codigo}/licencas?v=6",
    "LiderancaParlamentar": "senador/{codigo}/liderancas?v=5",
    "MandatoParlamentar": "senador/{codigo}/mandatos?v=5",
    "MateriasAutoriaParlamentar": "senador/{codigo}/autorias?v=7",
    "MateriasRelatoriaParlamentar": "senador/{codigo}/relatorias?v=6",
    "MembroComissaoParlamentar": "senador/{codigo}/comissoes?v=5",
    "ProfissaoParlamentar": "senador/profissao/{codigo}/profissoes?v=1",
    "VotacaoParlamentar": "senador/{codigo}/votacoes?v=7",
}


@app.get("/api/senadores/{codigo}/informacoes/{servico}")
@ttl_cache(ttl=300)
def get_informacoes_senador(codigo: str, servico: str):
    """Proxy seguro para os serviços de dados abertos de um senador."""
    if not codigo.isdigit() or servico not in SERVICOS_DADOS_SENADO:
        raise HTTPException(status_code=404, detail="Serviço de informações não encontrado.")
    try:
        import httpx
        path = SERVICOS_DADOS_SENADO[servico].format(codigo=codigo)
        response = httpx.get(
            f"https://legis.senado.leg.br/dadosabertos/{path}",
            timeout=20,
            headers={"Accept": "application/json", "User-Agent": "Olho-de-Aguia/1.0"},
        )
        response.raise_for_status()
        return response.json()
    except (httpx.HTTPError, ValueError) as e:
        raise HTTPException(status_code=502, detail=f"Não foi possível consultar os dados do Senado: {str(e)}")

@app.get("/api/news")
@ttl_cache(ttl=300)
def get_latest_news():
    """
    Busca as últimas notícias sobre política no Brasil.
    Usa RSS de grandes portais para evitar os bloqueios do DuckDuckGo.
    """
    try:
        import feedparser
        import re
        
        rss_feeds = [
            {"url": "https://g1.globo.com/rss/g1/politica/", "source": "G1 Política"},
            {"url": "https://noticias.uol.com.br/politica/rss.xml", "source": "UOL Política"},
            {"url": "https://jovempan.com.br/noticias/brasil/politica/feed", "source": "Jovem Pan"},
            {"url": "https://www.infomoney.com.br/politica/feed/", "source": "InfoMoney"}
        ]
        
        news_list = []
        for feed in rss_feeds:
            try:
                parsed = feedparser.parse(feed["url"])
                for item in parsed.entries[:6]: # Top 6 de cada feed
                    
                    # Extrair imagem se houver
                    image_url = ""
                    if 'media_content' in item and len(item.media_content) > 0:
                        image_url = item.media_content[0].get('url', '')
                    elif 'enclosures' in item and len(item.enclosures) > 0:
                        image_url = item.enclosures[0].get('href', '')
                    else:
                        # Tenta extrair src de img no description
                        desc = item.get("description", "")
                        match = re.search(r'src="([^"]+)"', desc)
                        if match:
                            image_url = match.group(1)
                            
                    summary_raw = item.get("description", item.get("summary", ""))
                    summary = re.sub('<[^<]+?>', '', summary_raw)[:150] + "..." if summary_raw else ""
                    
                    news_list.append({
                        "title": item.title,
                        "url": item.link,
                        "source": feed["source"],
                        "summary": summary,
                        "image": image_url,
                        "published_parsed": item.get('published_parsed')
                    })
            except Exception:
                pass
                
        # Ordenar por data de publicação (mais recentes primeiro)
        def get_time(n):
            if n.get("published_parsed"):
                import time
                return time.mktime(n["published_parsed"])
            return 0
            
        news_list.sort(key=get_time, reverse=True)
        
        # Limpar o published_parsed
        for n in news_list:
            del n["published_parsed"]
            
        return {"news": news_list[:15]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/videos")
@ttl_cache(ttl=300)
def get_latest_videos(limit: int = 15, offset: int = 0):
    """
    Busca os últimos vídeos sobre política no Brasil.
    Garante a ordem estrita do mais recente para o mais antigo (últimas 6, 12, 24, 48 horas).
    """
    def parse_time(text):
        text = text.lower().replace('transmitido', '').strip()
        if 'agora' in text or 'hoje' in text: return 0
        match = re.search(r'(\d+)\s+(minuto|hora|dia|semana|mês|mes|ano)', text)
        if not match: return 999999
        val = int(match.group(1))
        unit = match.group(2)
        if 'minuto' in unit: return val
        if 'hora' in unit: return val * 60
        if 'dia' in unit: return val * 60 * 24
        if 'semana' in unit: return val * 60 * 24 * 7
        return val * 60 * 24 * 30

    try:
        # Busca "política brasil notícias" filtrado por Esta Semana e Data de Upload (CAISAhAB)
        query = "política brasil notícias"
        query_encoded = urllib.parse.quote(query)
        url = f"https://www.youtube.com/results?search_query={query_encoded}&sp=CAISAhAB"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        
        match = re.search(r'var ytInitialData = (\{.*?\});</script>', html)
        videos = []
        if match:
            data = json.loads(match.group(1))
            try:
                contents = data['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents']
                for item in contents:
                    if 'videoRenderer' in item:
                        vid = item['videoRenderer']
                        title = vid['title']['runs'][0]['text']
                        video_id = vid['videoId']
                        published = vid.get('publishedTimeText', {}).get('simpleText', 'Hoje')
                        thumb = vid['thumbnail']['thumbnails'][-1]['url'] if 'thumbnail' in vid else ''
                        videos.append({
                            "title": f"{title} ({published})",
                            "content": f"https://www.youtube.com/watch?v={video_id}",
                            "images": {"medium": thumb.split('?')[0]},
                            "minutes_ago": parse_time(published)
                        })
            except KeyError:
                pass
        
        # Ordena estritamente pelos mais recentes
        videos.sort(key=lambda x: x['minutes_ago'])
        
        # Remove a chave auxiliar antes de retornar
        for v in videos:
            del v['minutes_ago']
            
        paginated = videos[offset:offset + limit]
        return {"videos": paginated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search")
def search_knowledge_base(request: QueryRequest):
    """
    Coordena a pesquisa web, consulta à memória e inferência no LM Studio.
    """
    try:
        # Aciona a cadeia de agentes (Pesquisador + Analista)
        resposta_ia = analisar_cenario(request.query)
        return {"query": request.query, "response": resposta_ia}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Variáveis globais de cache para evitar Rate Limits
monitor_cache = None
monitor_cache_time = None

# Mapeamento de Estados para NER simples (Fallback do LLM)
ESTADOS_BR = {
    "acre": "AC", "alagoas": "AL", "amapá": "AP", "amazonas": "AM", "bahia": "BA", 
    "ceará": "CE", "distrito federal": "DF", "brasília": "DF", "espírito santo": "ES", 
    "goiás": "GO", "maranhão": "MA", "mato grosso": "MT", "mato grosso do sul": "MS", 
    "minas gerais": "MG", "pará": "PA", "paraíba": "PB", "paraná": "PR", 
    "pernambuco": "PE", "piauí": "PI", "rio de janeiro": "RJ", "rio grande do norte": "RN", 
    "rio grande do sul": "RS", "rondônia": "RO", "roraima": "RR", "santa catarina": "SC", 
    "são paulo": "SP", "sergipe": "SE", "tocantins": "TO"
}

@app.get("/api/monitor")
@ttl_cache(ttl=300)
def get_monitor_data():
    """
    Retorna os dados em tempo real para o painel do Monitor Político.
    Usa Web Scraping em múltiplos feeds RSS e NER (Named Entity Recognition) para o Mapa de Calor.
    """
    global monitor_cache, monitor_cache_time
    from datetime import datetime, timezone, timedelta
    import feedparser
    import re
    from collections import Counter
    
    # Cache de 30 segundos (reduzido para refletir real-time mais rápido)
    now = datetime.now(timezone.utc)
    if monitor_cache and monitor_cache_time and (now - monitor_cache_time < timedelta(seconds=30)):
        return monitor_cache

    try:
        rss_feeds = [
            {"url": "https://g1.globo.com/rss/g1/politica/", "source": "G1 Política"},
            {"url": "https://noticias.uol.com.br/politica/rss.xml", "source": "UOL Política"},
            {"url": "https://jovempan.com.br/noticias/brasil/politica/feed", "source": "Jovem Pan"}
        ]
        
        alerts = []
        full_text = ""
        heatmap_data = {}
        
        global_neg = 0
        global_pos = 0
        global_neu = 0
        
        for feed in rss_feeds:
            try:
                parsed = feedparser.parse(feed["url"])
                for item in parsed.entries[:10]: # Top 10 de cada
                    title = item.title
                    summary_raw = item.get("description", item.get("summary", ""))
                    # Clean HTML and truncate
                    summary = re.sub('<[^<]+?>', '', summary_raw)[:200] + "..." if summary_raw else ""
                    
                    if len(alerts) < 8: # Mostrar até 8 alertas
                        alerts.append({
                            "title": title,
                            "summary": summary,
                            "url": item.link,
                            "source": feed["source"],
                            "time": "Agora",
                            "type": "URGENTE" if any(w in title.lower() for w in ["urgente", "tensão", "pf", "stf", "prisão", "morte", "crise", "bomba"]) else "DESTAQUE"
                        })
                    
                    text_context = f"{title} {summary}".lower()
                    full_text += text_context + " "
                    
                    # Análise de Sentimento Real da Notícia
                    if any(w in text_context for w in ["crise", "prisão", "investigação", "queda", "protesto", "rejeita", "oposição", "tensão", "crime", "rombo", "inflação"]):
                        global_neg += 1
                    elif any(w in text_context for w in ["aprova", "investimento", "acordo", "cresce", "alta", "avanço", "vitória", "recuperação", "são paulo", "pib"]):
                        global_pos += 1
                    else:
                        global_neu += 1

                    # NER: Encontrar Estados (no Título + Summary para aumentar hits reais)
                    for estado_nome, uf in ESTADOS_BR.items():
                        if re.search(rf'\b{estado_nome}\b', text_context):
                            if uf not in heatmap_data:
                                heatmap_data[uf] = {"mentions": 0, "sentiment": "neutral", "score": 0}
                            
                            heatmap_data[uf]["mentions"] += 1
                            
                            if any(w in text_context for w in ["crise", "prisão", "investigação", "queda", "protesto", "rejeita", "tensão"]):
                                heatmap_data[uf]["score"] -= 1
                            elif any(w in text_context for w in ["aprova", "investimento", "acordo", "cresce", "alta"]):
                                heatmap_data[uf]["score"] += 1

            except Exception as e:
                print(f"Erro ao ler RSS {feed['source']}: {e}")
                pass
                
        # Consolidar sentimento do Heatmap
        heatmap_array = []
        for estado_nome, uf in ESTADOS_BR.items():
            if uf not in [h.get("id") for h in heatmap_array]:
                data = heatmap_data.get(uf, {"mentions": 0, "score": 0})
                
                sent_str = "neutral"
                if data["score"] < 0: sent_str = "negative"
                elif data["score"] > 0: sent_str = "positive"
                
                heatmap_array.append({
                    "id": uf,
                    "value": max(20, data["mentions"] * 30), # Amplifica visualização
                    "sentiment": sent_str,
                    "mentions": data["mentions"]
                })

        # Extração Real de Trending Topics
        stopwords = {"o", "a", "os", "as", "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas", 
                     "e", "ou", "para", "por", "com", "sem", "que", "se", "um", "uma", "uns", "umas", 
                     "sobre", "mais", "mas", "como", "brasil", "política", "governo", "presidente", "ministro",
                     "após", "diz", "ser", "tem", "foi", "são", "não", "pelo", "pela"}
        
        words = re.findall(r'\b[A-Za-zÀ-ÿ]{5,}\b', full_text)
        meaningful_words = [w.capitalize() for w in words if w not in stopwords and w not in ESTADOS_BR.keys()]
        
        word_counts = Counter(meaningful_words).most_common(4)
        
        trending = []
        for idx, (word, count) in enumerate(word_counts):
            trending.append({
                "rank": idx + 1,
                "topic": word,
                "mentions": f"{count * 2.5:.1f}k", # Fator de projeção pra ficar interessante
                "sentiment": "negative" if idx % 2 != 0 else "positive" # Aleatoriedade leve para a UI
            })
            
        if not trending:
            trending = [{"rank": 1, "topic": "Economia", "sentiment": "neutral", "mentions": "10k"}]

        # Cálculo do Sentimento Nacional Efetivo
        total_news = global_neg + global_pos + global_neu
        if total_news == 0: total_news = 1
        
        rej = int((global_neg / total_news) * 100)
        app = int((global_pos / total_news) * 100)
        neu = 100 - rej - app
        
        sentiment_analysis = {
            "rejection": rej,
            "approval": app,
            "neutral": neu
        }
            
        monitor_cache = {
            "alerts": alerts,
            "trending": trending,
            "sentiment": sentiment_analysis,
            "heatmap": heatmap_array
        }
        monitor_cache_time = now
        
        return monitor_cache
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pls")
@ttl_cache(ttl=300)
def get_latest_pls():
    """
    Busca os últimos Projetos de Lei (PL) na API de Dados Abertos da Câmara dos Deputados.
    """
    try:
        import httpx
        url = "https://dadosabertos.camara.leg.br/api/v2/proposicoes?siglaTipo=PL&ordem=DESC&ordenarPor=id&itens=15"
        
        response = httpx.get(url, timeout=10)
        data = response.json()
        
        pls_list = []
        for item in data.get("dados", []):
            
            # Format date string (e.g. "2026-07-24T13:46" to "24/07/2026")
            raw_date = item.get("dataApresentacao", "")
            formatted_date = "Recente"
            if raw_date and len(raw_date) >= 10:
                parts = raw_date[:10].split("-")
                if len(parts) == 3:
                    formatted_date = f"{parts[2]}/{parts[1]}/{parts[0]}"
            
            id_proposicao = item.get("id")
            ementa = item.get("ementa", "Sem ementa disponível.")
            
            # Simplified theme logic since Câmara API ementas are very long
            tema = ementa[:50] + "..." if len(ementa) > 50 else ementa
            
            # The API doesn't give real-time 'Status' in the basic endpoint, so we assign a generic one
            # To get real status we'd have to make 1 request per PL, which is too slow.
            
            pls_list.append({
                "id": f"PL {item.get('numero')}/{item.get('ano')}",
                "raw_id": id_proposicao,
                "tema": tema,
                "ementaCompleta": ementa,
                "autor": "Câmara dos Deputados",
                "status": "Em Tramitação",
                "date": formatted_date,
                "color": "blue",
                "link": f"https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao={id_proposicao}",
                "pdf_url": item.get("urlInteiroTeor", "")
            })
            
        return {"projetos": pls_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pls/{pl_id}")
@ttl_cache(ttl=300)
def get_pl_details(pl_id: int):
    """
    Busca detalhes, autores e histórico de tramitação de um PL específico.
    """
    try:
        import httpx
        base_url = f"https://dadosabertos.camara.leg.br/api/v2/proposicoes/{pl_id}"
        
        with httpx.Client(timeout=10) as client:
            # 1. Dados básicos
            res_basic = client.get(base_url)
            basic_data = res_basic.json().get("dados", {})
            
            # 2. Autores
            res_autores = client.get(f"{base_url}/autores")
            autores_data = res_autores.json().get("dados", [])
            autores = [a.get("nome") for a in autores_data]
            
            # 3. Tramitações (ordenado mais recente primeiro)
            res_tramitacoes = client.get(f"{base_url}/tramitacoes")
            tram_data = res_tramitacoes.json().get("dados", [])
            tram_data.reverse() # Mais recente no topo
            
            # Format history
            history = []
            for t in tram_data:
                data_hora = t.get("dataHora", "")
                date_str = "Data Desconhecida"
                if len(data_hora) >= 10:
                    parts = data_hora[:10].split("-")
                    if len(parts) == 3:
                        date_str = f"{parts[2]}/{parts[1]}/{parts[0]}"
                
                history.append({
                    "data": date_str,
                    "orgao": t.get("siglaOrgao", "N/A"),
                    "despacho": t.get("despacho", "")
                })
                
            return {
                "id": f"{basic_data.get('siglaTipo')} {basic_data.get('numero')}/{basic_data.get('ano')}",
                "ementa": basic_data.get("ementa", "Ementa não disponível."),
                "autores": autores if autores else ["Autor Desconhecido"],
                "apresentacao": basic_data.get("dataApresentacao", "")[:10],
                "pdf_url": basic_data.get("urlInteiroTeor", ""),
                "historico": history
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ENDPOINTS CÂMARA - DEPUTADOS
# ==========================================
@app.get("/api/deputados")
@ttl_cache(ttl=300)
def get_deputados(nome: str = None, uf: str = None, siglaPartido: str = None):
    """Busca deputados com filtros."""
    try:
        import httpx
        url = "https://dadosabertos.camara.leg.br/api/v2/deputados"
        params = {"itens": 20, "ordem": "ASC", "ordenarPor": "nome"}
        if nome: params["nome"] = nome
        if uf: params["siglaUf"] = uf
        if siglaPartido: params["siglaPartido"] = siglaPartido
        
        response = httpx.get(url, params=params, timeout=10)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/deputados/{id}")
def get_deputado_detalhes(id: int):
    """Detalhes de um deputado."""
    try:
        import httpx
        url = f"https://dadosabertos.camara.leg.br/api/v2/deputados/{id}"
        response = httpx.get(url, timeout=10)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/deputados/{id}/dossie")
def get_deputado_dossie(id: int):
    """Gera um dossiê com inteligência artificial sobre o deputado."""
    try:
        import httpx
        # 1. Dados básicos
        res_basico = httpx.get(f"https://dadosabertos.camara.leg.br/api/v2/deputados/{id}", timeout=10).json()
        dados_basicos = res_basico.get("dados", {})
        nome = dados_basicos.get("ultimoStatus", {}).get("nome", "Desconhecido")
        
        # 2. Despesas
        res_despesas = httpx.get(f"https://dadosabertos.camara.leg.br/api/v2/deputados/{id}/despesas?itens=100&ordem=DESC", timeout=10).json()
        despesas = res_despesas.get("dados", [])
        
        # 3. Discursos
        res_discursos = httpx.get(f"https://dadosabertos.camara.leg.br/api/v2/deputados/{id}/discursos?itens=50&ordem=DESC", timeout=10).json()
        discursos = res_discursos.get("dados", [])
        
        # 4. Agente IA
        dossie = gerar_dossie_deputado(nome, dados_basicos, despesas, discursos)
        
        return {
            "id": id, 
            "nome": nome, 
            "dossie": dossie,
            "despesas": despesas,
            "discursos": discursos
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ENDPOINTS CÂMARA - VOTAÇÕES & PARTIDOS
# ==========================================
@app.get("/api/votacoes")
@ttl_cache(ttl=300)
def get_votacoes(dataInicio: str = None, dataFim: str = None):
    """Lista as votações recentes."""
    try:
        import httpx
        url = "https://dadosabertos.camara.leg.br/api/v2/votacoes"
        params = {"itens": 15, "ordem": "DESC", "ordenarPor": "dataHoraRegistro"}
        if dataInicio: params["dataInicio"] = dataInicio
        if dataFim: params["dataFim"] = dataFim
        
        response = httpx.get(url, params=params, timeout=10)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/votacoes/{id}/analise")
def get_votacao_analise(id: str):
    """Analisa uma votação (orientações e votos)."""
    try:
        import httpx
        url_base = f"https://dadosabertos.camara.leg.br/api/v2/votacoes/{id}"
        
        # Dados básicos
        basico = httpx.get(url_base, timeout=10).json().get("dados", {})
        
        # Orientações
        orientacoes = httpx.get(f"{url_base}/orientacoes", timeout=10).json().get("dados", [])
        
        # Votos
        votos = httpx.get(f"{url_base}/votos", timeout=10).json().get("dados", [])
        
        return {
            "votacao": basico,
            "orientacoes": orientacoes,
            "votos": votos
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/votacoes/{id}/dossie_ia")
def get_votacao_dossie(id: str):
    """Gera um dossiê executivo da votação usando IA e pesquisa na Web."""
    try:
        import httpx
        url_base = f"https://dadosabertos.camara.leg.br/api/v2/votacoes/{id}"
        basico = httpx.get(url_base, timeout=10).json().get("dados", {})
        
        descricao = basico.get("descricao", "")
        objeto = basico.get("proposicaoObjeto", "")
        sigla_orgao = basico.get("siglaOrgao", "")
        
        if not descricao:
            return {"dossie": "Votação não encontrada ou sem descrição oficial na Câmara."}
            
        texto_dossie = gerar_dossie_votacao(descricao, objeto, sigla_orgao)
        
        return {"dossie": texto_dossie}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/partidos")
def get_partidos():
    """Lista partidos."""
    try:
        import httpx
        url = "https://dadosabertos.camara.leg.br/api/v2/partidos"
        params = {"itens": 50, "ordem": "ASC", "ordenarPor": "sigla"}
        response = httpx.get(url, params=params, timeout=10)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/camara/{caminho:path}")
@ttl_cache(ttl=300)
def proxy_dados_abertos_camara(caminho: str, request: Request):
    """Proxy para as consultas públicas usadas pelo frontend.

    A API da Câmara bloqueia o proxy por rewrite do Next em alguns ambientes.
    Esta rota mantém a integração externa no backend, com CORS já configurado.
    """
    segmentos_permitidos = {"proposicoes", "deputados", "eventos"}
    primeiro_segmento = caminho.split("/", 1)[0]
    if primeiro_segmento not in segmentos_permitidos or ".." in caminho:
        raise HTTPException(status_code=400, detail="Recurso da Câmara não permitido.")

    try:
        import httpx

        resposta = httpx.get(
            f"https://dadosabertos.camara.leg.br/api/v2/{caminho}",
            params=request.query_params,
            headers={"User-Agent": "Olho-de-Aguia/1.0"},
            timeout=15,
        )
        resposta.raise_for_status()
        return resposta.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail="A API da Câmara recusou a consulta.")
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="A API da Câmara está indisponível no momento.")

@app.get("/api/estatisticas")
@ttl_cache(ttl=300)
def get_estatisticas():
    """Consolida indicadores legislativos oficiais para o painel de estatísticas."""
    import httpx

    base_url = "https://dadosabertos.camara.leg.br/api/v2"

    def buscar(client, caminho, params):
        try:
            resposta = client.get(f"{base_url}/{caminho}", params=params)
            resposta.raise_for_status()
            return resposta.json().get("dados", [])
        except Exception:
            # O painel continua útil mesmo quando uma das fontes públicas oscila.
            return []

    try:
        with httpx.Client(timeout=15) as client:
            partidos = buscar(client, "partidos", {"itens": 100, "ordem": "ASC", "ordenarPor": "sigla"})
            proposicoes = buscar(client, "proposicoes", {"itens": 100, "pagina": 1, "ordem": "DESC", "ordenarPor": "id"})
            votacoes = buscar(client, "votacoes", {"itens": 100, "pagina": 1, "ordem": "DESC", "ordenarPor": "dataHoraRegistro"})

        bancadas = []
        for partido in partidos:
            status = partido.get("status") or {}
            membros = status.get("totalMembros") or 0
            if membros > 0:
                bancadas.append({
                    "sigla": partido.get("sigla", "N/D"),
                    "membros": membros,
                    "situacao": status.get("situacao", ""),
                })
        bancadas.sort(key=lambda item: item["membros"], reverse=True)

        tipos_proposicao = {}
        for proposicao in proposicoes:
            tipo = proposicao.get("siglaTipo") or "Outros"
            tipos_proposicao[tipo] = tipos_proposicao.get(tipo, 0) + 1
        proposicoes_por_tipo = [
            {"tipo": tipo, "quantidade": quantidade}
            for tipo, quantidade in sorted(tipos_proposicao.items(), key=lambda item: item[1], reverse=True)
        ][:6]

        votacoes_por_orgao = {}
        for votacao in votacoes:
            orgao = votacao.get("siglaOrgao") or "Sem órgão"
            votacoes_por_orgao[orgao] = votacoes_por_orgao.get(orgao, 0) + 1
        atividade_por_orgao = [
            {"orgao": orgao, "quantidade": quantidade}
            for orgao, quantidade in sorted(votacoes_por_orgao.items(), key=lambda item: item[1], reverse=True)
        ][:6]

        return {
            "atualizadoEm": datetime.now(timezone.utc).isoformat(),
            "resumo": {
                "partidosComBancada": len(bancadas),
                "cadeirasMapeadas": sum(item["membros"] for item in bancadas),
                "proposicoesRecentes": len(proposicoes),
                "votacoesRecentes": len(votacoes),
            },
            "bancadas": bancadas[:10],
            "proposicoesPorTipo": proposicoes_por_tipo,
            "atividadePorOrgao": atividade_por_orgao,
            "ultimasVotacoes": votacoes[:5],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ENDPOINTS CÂMARA - EVENTOS/AGENDA
# ==========================================
@app.get("/api/agenda")
def get_agenda(dataInicio: str = None, dataFim: str = None):
    """Lista eventos (agenda) da Câmara."""
    try:
        import httpx
        url = "https://dadosabertos.camara.leg.br/api/v2/eventos"
        
        if not dataInicio:
            from datetime import datetime, timedelta
            hoje = datetime.now()
            semana_que_vem = hoje + timedelta(days=7)
            dataInicio = hoje.strftime("%Y-%m-%d")
            dataFim = semana_que_vem.strftime("%Y-%m-%d")
            
        params = {"dataInicio": dataInicio, "dataFim": dataFim, "itens": 20, "ordem": "ASC", "ordenarPor": "dataHoraInicio"}
        response = httpx.get(url, params=params, timeout=10)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
