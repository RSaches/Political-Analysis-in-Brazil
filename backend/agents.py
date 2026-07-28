import os
import re
import time
# pyrefly: ignore [missing-import]
from langchain_community.embeddings import HuggingFaceEmbeddings
from duckduckgo_search import DDGS
import chromadb
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# ==============================================================================
# CONFIGURAÇÕES E BANCO DE DADOS
# ==============================================================================
chroma_client = chromadb.PersistentClient(path="./chroma_db")
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

try:
    knowledge_base = chroma_client.get_collection(name="base_conhecimento")
except Exception:
    knowledge_base = None

print("[Sistema] Carregando cliente da Groq API...")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

if groq_client:
    print("[Sistema] Groq API configurada com sucesso!")
else:
    print("[Sistema Erro] GROQ_API_KEY não encontrada no .env!")

def gerar_texto_nuvem(messages, max_tokens=150, modelo="llama-3.1-8b-instant"):
    """Função base para invocar a LLM via Groq Cloud API."""
    if not groq_client:
        return "Erro: GROQ_API_KEY não configurada no ambiente."
    
    try:
        res = groq_client.chat.completions.create(
            messages=messages,
            model=modelo,
            max_tokens=max_tokens,
            temperature=0.2
        )
        return res.choices[0].message.content.strip()
    except Exception as e:
        return f"Erro na geração de texto em nuvem: {str(e)}"

# ==============================================================================
# SISTEMA DE FERRAMENTAS (TOOLS)
# ==============================================================================

import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import time
import requests
from bs4 import BeautifulSoup

CACHE_NOTICIAS = {}
CACHE_TTL = 600 # 10 minutos de cache para evitar raspar a mesma coisa repetidamente

def extrair_texto_noticia(url: str):
    """Engenharia Reversa: Extrai o conteúdo real da matéria burlando bloqueios básicos."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        # requests segue redirects automaticamente (útil para links do Google News)
        res = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Coleta parágrafos reais (ignorando menus e rodapés)
        paragrafos = soup.find_all('p')
        texto = " ".join([p.text.strip() for p in paragrafos if len(p.text.strip()) > 30])
        # Retorna os primeiros 800 caracteres como snippet profundo
        return texto[:800] + "..." if texto else ""
    except Exception:
        return ""

def buscar_noticias_google(query: str, max_results: int = 3):
    """Busca manchetes frescas do dia via Google News RSS e extrai conteúdo profundo."""
    try:
        query_encoded = urllib.parse.quote(query + " when:1d")
        url = f"https://news.google.com/rss/search?q={query_encoded}&hl=pt-BR&gl=BR&ceid=BR:pt-419"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        xml_data = urllib.request.urlopen(req, timeout=5).read()
        root = ET.fromstring(xml_data)
        
        resultados = []
        for i, item in enumerate(root.findall('.//item')[:max_results]):
            title = item.find('title').text
            link = item.find('link').text
            source = item.find('source').text if item.find('source') is not None else 'Google News'
            
            # Se for a primeira e principal notícia, fazemos o scraping profundo
            conteudo_extra = ""
            if i == 0:
                texto_profundo = extrair_texto_noticia(link)
                if texto_profundo:
                    conteudo_extra = f"\n  RESUMO DA MATÉRIA: {texto_profundo}"
            
            resultados.append(f"- [MANCHETE via {source}] {title}{conteudo_extra}")
            
        return "\n".join(resultados) if resultados else ""
    except Exception as e:
        print(f"[Google News] Erro: {e}")
        return ""

def pesquisar_na_web(query: str, max_results: int = 5):
    """Pesquisador Híbrido: Combina manchetes do dia (Google) com busca aprofundada (DDG). Usa cache."""
    
    agora = time.time()
    # Limpeza básica do cache e checagem
    if query in CACHE_NOTICIAS and (agora - CACHE_NOTICIAS[query]['timestamp']) < CACHE_TTL:
        print(f"[Agente Pesquisador] Lendo do Cache Central de Dossiê para: '{query}'")
        return CACHE_NOTICIAS[query]['dados']

    print(f"[Agente Pesquisador] Vasculhando a internet (Híbrido) por: '{query}'")
    
    textos_finais = []
    
    # 1. Busca manchetes quentes do dia (Google News)
    google_news = buscar_noticias_google(query, max_results=3)
    if google_news:
        textos_finais.append(google_news)
        
    # 2. Busca contextual / aprofundada (DuckDuckGo News)
    try:
        # Usar um tempo pequeno de espera e tentar ignorar rate limits pesados
        with DDGS() as ddgs:
            # Tenta usar o DDGS.news primeiro (focado em artigos)
            resultados = list(ddgs.news(query, max_results=max_results, region="br-pt"))
            if resultados:
                ddg_textos = [f"- [Artigo DDG - {res.get('source', '')}]: {res.get('title', '')} - {res.get('body', '')}" for res in resultados]
                textos_finais.extend(ddg_textos)
            else:
                # Fallback para busca de texto geral se não achar news
                fallback_query = " ".join(query.split()[:4])
                resultados_fb = list(ddgs.text(fallback_query, max_results=3, region="br-pt"))
                if resultados_fb:
                    fb_textos = [f"- [Busca DDG]: {res.get('title', '')}: {res.get('body', '')}" for res in resultados_fb]
                    textos_finais.extend(fb_textos)
    except Exception as e:
        print(f"[DDGS] Aviso/Erro de Limite: {e}. Usando apenas Google News se disponível.")
        
    resultado_final = "Nenhuma notícia ou dado recente encontrado na internet."
    if textos_finais:
        resultado_final = "\n".join(textos_finais)
        
    # Salva no cache
    CACHE_NOTICIAS[query] = {'timestamp': time.time(), 'dados': resultado_final}
    return resultado_final



def gerar_query_pesquisa(pergunta: str):
    """Agentic Query Transformation: converte a pergunta coloquial em keywords otimizadas para o DuckDuckGo."""
    msg = [
        {"role": "system", "content": "Você é um especialista em SEO. Extraia APENAS as 3 a 5 palavras-chave mais importantes desta pergunta, sem usar vírgulas, aspas, ou palavras extras. Apenas as keywords separadas por espaço."},
        {"role": "user", "content": pergunta}
    ]
    query_otimizada = gerar_texto_nuvem(msg, max_tokens=50)
    query_otimizada = re.sub(r"[^a-zA-Z0-9áéíóúÁÉÍÓÚçÇãõÃÕ\s]", "", query_otimizada).strip()
    return query_otimizada if query_otimizada else pergunta

def buscar_na_base_de_conhecimento(query: str, n_results: int = 3):
    """Pesquisador Local: Coleta leis e histórico do RAG."""
    print(f"[Agente Pesquisador] Consultando o Arquivo Histórico e Legal...")
    if not knowledge_base:
        return "Base de Conhecimentos ainda não ingerida ou indisponível."
    try:
        query_vector = embeddings.embed_query(query)
        resultados = knowledge_base.query(query_embeddings=[query_vector], n_results=n_results)
        if resultados and resultados['documents'] and resultados['documents'][0]:
            return "\n".join(resultados['documents'][0])
    except Exception as e:
        print(f"Erro na busca RAG: {e}")
    return "Nenhuma informação histórica relevante encontrada na Base Local."

# ==============================================================================
# GABINETE DE MINISTROS (ANÁLISE MULTI-ESPECTRO)
# ==============================================================================

PERSONAS = {
    "Esquerda": "Você é um Sociólogo e Economista de Esquerda. Foca em impacto social, combate à desigualdade, direitos trabalhistas, minorias e fortalecimento do Estado. Seja direto e analítico.",
    "Centro": "Você é um Cientista Político de Centro. Foca em moderação, pragmatismo, consenso político, estabilidade institucional e equilíbrio fiscal. Seja ponderado e direto.",
    "Direita": "Você é um Analista Político e Econômico de Direita (Patriota). Foca em liberdade econômica, soberania nacional, responsabilidade fiscal, segurança pública, livre mercado e valores tradicionais. Seja incisivo e direto.",
    "Economista": "Você é o Ministro da Economia (Técnico de Mercado). Foca estritamente em impacto financeiro, PIB, inflação, contas públicas, risco fiscal e reação do mercado. Analítico, sem viés ideológico.",
    "Constitucionalista": "Você é um Ministro do STF / Especialista Constitucional. Foca na legalidade, jurisprudência e no que diz a Constituição. Avalia se a medida fere leis ou o pacto federativo. Técnico e objetivo.",
    "RelacoesExteriores": "Você é o Ministro das Relações Exteriores (Geopolítica). Foca em acordos internacionais, impacto na imagem do Brasil, relações comerciais e diplomacia. Analítico e global.",
    "MeioAmbiente": "Você é o Ministro do Meio Ambiente e Sustentabilidade. Foca em impactos ambientais, mudanças climáticas, preservação da Amazônia, ESG e transição energética. Embasa-se na ciência.",
    "Defesa": "Você é o Ministro da Defesa e Segurança Pública. Foca em soberania, controle de fronteiras, inteligência policial, forças armadas e combate ao crime organizado. Visão estratégica e disciplinada.",
    "Tecnologia": "Você é o Ministro da Ciência e Tecnologia. Foca em inovação, inteligência artificial, privacidade de dados, cibersegurança e inclusão digital. Visão científica, moderna e técnica.",
    "SaudeEducacao": "Você é o Ministro de Políticas Sociais (Saúde e Educação). Foca no desenvolvimento humano, eficiência do SUS, indicadores educacionais e bem-estar da população. Visão humanista e científica."
}

def agente_especialista(nome_persona: str, pergunta: str, contexto_noticias: str):
    """Executa um agente específico usando o Dossiê de Notícias centralizado."""
    print(f"[Orquestrador] Convocando Ministro/Analista: {nome_persona}...")
    
    prompt = f"""Responda à pergunta do usuário a partir da sua visão/lente ({nome_persona}).
Seja muito direto, profissional e vá direto ao ponto em 1 ou 2 parágrafos.
Use os fatos da web abaixo para embasar sua opinião (cite-os se útil).

=== FATOS DA WEB (Contexto) ===
{contexto_noticias}

=== PERGUNTA ===
{pergunta}
"""
    msg = [
        {"role": "system", "content": PERSONAS.get(nome_persona, "Você é um analista experiente.")},
        {"role": "user", "content": prompt}
    ]
    
    # Usa um modelo mais robusto (70b) para os pareceres, se possível no Groq
    return gerar_texto_nuvem(msg, max_tokens=300, modelo="llama-3.3-70b-versatile")

def analisar_cenario(pergunta: str):
    """
    Orquestrador: Executa o Gabinete de Ministros. 
    1. Triagem (Define quem chamar)
    2. Coleta de Pareceres Independentes
    3. Veredito Presidencial/Jurídico
    """
    print("="*60)
    print(f"[Orquestrador] Iniciando GABINETE DE MINISTROS para: '{pergunta}'")
    
    # --------------------------------------------------------------------------
    # PASSO 1: O PESQUISADOR BASE E RAG
    # --------------------------------------------------------------------------
    print("[Orquestrador] Coletando Contexto Geral e Base Legal...")
    query_otimizada = gerar_query_pesquisa(pergunta)
    contexto_web_geral = pesquisar_na_web(query_otimizada, max_results=4)
    contexto_leis = buscar_na_base_de_conhecimento(pergunta)

    # --------------------------------------------------------------------------
    # PASSO 2: TRIAGEM TÉCNICA (Quem deve ser convocado?)
    # --------------------------------------------------------------------------
    print("[Orquestrador] Realizando Triagem do Gabinete...")
    opcoes = ", ".join(PERSONAS.keys())
    prompt_triagem = f"""Baseado na pergunta abaixo, escolha EXATAMENTE os 3 especialistas mais relevantes para o debate, dentre as opções: {opcoes}.
Retorne apenas os 3 nomes separados por vírgula. Ex: Esquerda, Direita, Economista
Pergunta: {pergunta}"""
    msg_triagem = [{"role": "system", "content": "Você é o Chefe da Casa Civil."}, {"role": "user", "content": prompt_triagem}]
    triagem_raw = gerar_texto_nuvem(msg_triagem, max_tokens=20, modelo="llama-3.1-8b-instant")
    
    ministros_convocados = [m.strip() for m in triagem_raw.split(',') if m.strip() in PERSONAS]
    if len(ministros_convocados) < 3:
        ministros_convocados = ["Esquerda", "Direita", "Centro"] # Fallback padrão
        
    print(f"[Orquestrador] Ministros convocados: {', '.join(ministros_convocados)}")

    # --------------------------------------------------------------------------
    # PASSO 3: COLETA DE PARECERES (Prompt Chaining Paralelo Simulad0)
    # --------------------------------------------------------------------------
    pareceres = {}
    for ministro in ministros_convocados[:3]: # Limita a 3 para não explodir tempo/tokens
        pareceres[ministro] = agente_especialista(ministro, pergunta, contexto_web_geral)

    texto_pareceres = ""
    for min, par in pareceres.items():
        texto_pareceres += f"### Visão do Analista ({min})\n{par}\n\n"

    # --------------------------------------------------------------------------
    # PASSO 4: O VEREDITO (Presidente do Conselho)
    # --------------------------------------------------------------------------
    print("[Orquestrador] Acionando Juiz/Presidente para Veredito...")
    prompt_juiz = f"""Com base na PERGUNTA, no CONTEXTO GERAL, na BASE LEGAL e no DEBATE DOS MINISTROS, formule um Veredito Final Executivo.
Seja imparcial, objetivo e consolide as diferentes visões num parecer final coeso de alto nível.

Você DEVE retornar o resultado preenchendo as seguintes tags XML:
<score>0 a 100% (Grau de Tensão/Impacto do tema)</score>
<impacto>1 frase curta de consequência</impacto>
<veredito>Escreva seu Veredito Executivo (2 a 3 parágrafos) julgando o debate</veredito>

=== PERGUNTA ===
{pergunta}

=== CONTEXTO DA INTERNET ===
{contexto_web_geral}

=== BASE LEGAL (Constituição/Leis) ===
{contexto_leis}

=== DEBATE DOS MINISTROS ===
{texto_pareceres}
"""
    msg_juiz = [
        {"role": "system", "content": "Você é o Presidente do Conselho de Inteligência Estratégica. Seu tom é institucional, neutro e impecavelmente técnico."},
        {"role": "user", "content": prompt_juiz}
    ]
    # Usa o modelo mais forte para o veredito
    veredito_cru = gerar_texto_nuvem(msg_juiz, max_tokens=500, modelo="llama-3.3-70b-versatile")

    
    # --------------------------------------------------------------------------
    # FORMATADOR PYTHON (Parsing Seguro via Tags XML)
    # --------------------------------------------------------------------------
    score_match = re.search(r"<score>(.*?)</score>", veredito_cru, re.IGNORECASE | re.DOTALL)
    impacto_match = re.search(r"<impacto>(.*?)</impacto>", veredito_cru, re.IGNORECASE | re.DOTALL)
    veredito_match = re.search(r"<veredito>(.*?)</veredito>", veredito_cru, re.IGNORECASE | re.DOTALL)

    str_score = score_match.group(1).strip() if score_match else "N/A"
    str_impacto = impacto_match.group(1).strip() if impacto_match else "Desconhecido"
    
    if veredito_match:
        str_veredito = veredito_match.group(1).strip()
    else:
        partes = re.split(r"<veredito>", veredito_cru, flags=re.IGNORECASE)
        if len(partes) > 1:
            str_veredito = partes[-1].replace("</veredito>", "").strip()
        else:
            str_veredito = re.sub(r"<[^>]+>", "", veredito_cru, flags=re.DOTALL | re.IGNORECASE).strip()

    resposta_final = (
        f"📊 **Grau de Tensão/Impacto:** {str_score}\n"
        f"💥 **Resumo de Consequência:** {str_impacto}\n\n"
        f"🏛️ **O DEBATE DO GABINETE** 🏛️\n"
        f"---\n\n"
        f"{texto_pareceres}"
        f"---\n"
        f"🦅 **VEREDITO INSTITUCIONAL (Olho de Águia):**\n{str_veredito}"
    )
    
    print("[Orquestrador] Debate finalizado e formatado com sucesso.")
    return resposta_final

def gerar_dossie_deputado(nome_deputado: str, dados_basicos: dict, despesas: list, discursos: list):
    """
    Gera um dossiê analítico do deputado usando a LLM local, com base em suas despesas e discursos recentes.
    """
    print(f"[Agente Dossiê] Gerando dossiê para o deputado {nome_deputado}...")
    
    # Prepara o contexto
    contexto_despesas = "\n".join([f"- {d.get('dataDocumento', '')}: {d.get('tipoDespesa', '')} (R$ {d.get('valorDocumento', 0)})" for d in despesas[:10]])
    contexto_discursos = "\n".join([f"- {d.get('dataHoraInicio', '')}: {d.get('sumario', '')}" for d in discursos[:5]])
    
    ultimo_status = dados_basicos.get('ultimoStatus', {})
    
    prompt = f"""Você é um Analista de Inteligência Estratégica Sênior. Seu trabalho é redigir um Dossiê Executivo de alto nível sobre o parlamentar {nome_deputado}.

ATENÇÃO: NÃO faça listas de despesas individuais nem copie datas literais. O usuário já tem acesso à tabela de dados brutos na interface. 
Sua missão é agregar valor através de UMA SÍNTESE ANALÍTICA, identificando padrões, prioridades e o modus operandi do mandato.

Estruture a sua resposta OBRIGATORIAMENTE nas seguintes seções, usando markdown (negrito) para destacar os títulos:

**1. Perfil e Posicionamento Político**
Analise o espectro político com base no partido, estado e histórico.

**2. Análise de Gastos (Follow the Money)**
Qual é a prioridade financeira do mandato? (Ex: Concentra recursos em marketing? Voos? Manutenção de base?). Faça uma análise crítica do padrão de gastos, apontando onde está o maior volume de dinheiro, mas sem listar transações isoladas.

**3. Pautas e Ideologia**
Quais são os temas centrais defendidos nos discursos? Qual é a agenda principal do parlamentar?

=== DADOS BÁSICOS ===
Partido/UF: {ultimo_status.get('siglaPartido', '')} / {ultimo_status.get('siglaUf', '')}
Situação: {ultimo_status.get('situacao', '')}

=== AMOSTRA DE DESPESAS RECENTES (Para análise de padrão, não liste os itens) ===
{contexto_despesas if contexto_despesas else "Sem registros recentes."}

=== AMOSTRA DE DISCURSOS (Para análise de pauta, não copie na íntegra) ===
{contexto_discursos if contexto_discursos else "Sem registros recentes."}
"""
    msg = [
        {"role": "system", "content": "Você é um Analista de Inteligência Estratégica que escreve dossiês executivos profissionais, perspicazes e analíticos, com tom jornalístico investigativo de alto nível."},
        {"role": "user", "content": prompt}
    ]
    
    # O dossiê pode precisar de mais tokens agora que é analítico e profissional.
    dossie = gerar_texto_nuvem(msg, max_tokens=800)
    return dossie

def gerar_dossie_votacao(descricao: str, objeto: str, sigla_orgao: str):
    """
    Agente especialista em decodificar votações cripticas da Câmara (Ex: "REQ 2726/2026").
    Ele usa o buscador da web para entender as manchetes em torno dessa votação e gerar um contexto real.
    """
    print(f"[Agente Votações] Pesquisando contexto real para: {descricao}...")
    
    # Monta uma query focada para o DuckDuckGo achar notícias. 
    # Ex: "Câmara dos Deputados Votação Deferido o requerimento n. 2726/2026"
    search_query = f"Câmara dos Deputados Política {descricao}"
    if objeto:
        search_query += f" {objeto[:50]}"
        
    contexto_noticias = pesquisar_na_web(search_query, max_results=4)
    
    prompt = f"""Você é um Assessor Parlamentar de Inteligência. 
Sua missão é explicar para um político ocupado do que se trata EXATAMENTE a votação abaixo.
Muitas vezes o título é burocrático (ex: "REQ 123/2024"). Você DEVE usar os "FATOS DA INTERNET" para descobrir a pauta real que estava por trás desse requerimento ou votação e explicar as consequências.

Escreva o relatório em Markdown nas seguintes sessões:

### Contexto Real
Explique qual é a verdadeira pauta sendo votada em linguagem simples. Se não souber o projeto específico, explique do que se trata esse TIPO de requerimento no legislativo.

### Impacto Político
Qual a consequência dessa aprovação (ou rejeição) no mundo real? Quem ganha e quem perde?

---
=== TÍTULO OFICIAL DA VOTAÇÃO ===
{descricao}
Órgão: {sigla_orgao}
Objeto: {objeto if objeto else 'Não especificado na API'}

=== FATOS DA INTERNET (Use isso para deduzir o tema real da pauta) ===
{contexto_noticias}
"""
    
    msg = [
        {"role": "system", "content": "Você é um assessor analítico que traduz burocracia legislativa em análises políticas diretas, neutras e perspicazes."},
        {"role": "user", "content": prompt}
    ]
    
    dossie = gerar_texto_nuvem(msg, max_tokens=600)
    return dossie
