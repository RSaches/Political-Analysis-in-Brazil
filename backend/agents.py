import os
import re
import time
from langchain_community.embeddings import HuggingFaceEmbeddings
from ddgs import DDGS
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

def gerar_texto_nuvem(messages, max_tokens=150):
    """Função base para invocar a LLM via Groq Cloud API."""
    if not groq_client:
        return "Erro: GROQ_API_KEY não configurada no ambiente."
    
    try:
        res = groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant",
            max_tokens=max_tokens,
            temperature=0.2
        )
        return res.choices[0].message.content.strip()
    except Exception as e:
        return f"Erro na geração de texto em nuvem: {str(e)}"

# ==============================================================================
# SISTEMA DE FERRAMENTAS (TOOLS)
# ==============================================================================

def pesquisar_na_web(query: str, max_results: int = 3):
    """Pesquisador Web: Coleta dados frescos da internet usando a frase natural."""
    print(f"[Agente Pesquisador] Vasculhando a internet por: '{query}'")
    try:
        with DDGS() as ddgs:
            resultados = list(ddgs.text(query, max_results=max_results))
            if resultados:
                textos = [f"- {res['title']}: {res['body']}" for res in resultados]
                return "\n".join(textos)
            return "Nenhuma notícia ou dado recente encontrado na internet."
    except Exception as e:
        return f"Erro ao acessar a web: {str(e)}"

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
# GABINETE DE CRISE (PROMPT CHAINING OTIMIZADO PARA MODELOS PEQUENOS)
# ==============================================================================

def analisar_cenario(pergunta: str):
    """
    Orquestrador: Executa o DEBATE via PROMPT CHAINING (Chamadas Isoladas)
    Isso evita alucinações e garante o formato perfeito.
    """
    print("="*60)
    print(f"[Orquestrador] Iniciando BATALHA DE AGENTES (Prompt Chaining) para: '{pergunta}'")
    
    contexto_web = pesquisar_na_web(pergunta)
    
    # --------------------------------------------------------------------------
    # PASSO 1: O PESQUISADOR (Geração do Dossiê Bruto)
    # --------------------------------------------------------------------------
    print("[Orquestrador] Acionando Agente A (O Pesquisador)...")
    prompt_pesquisador = f"""Resuma os FATOS abaixo em apenas 1 parágrafo curto. Não invente nada.
É OBRIGATÓRIO citar a origem da informação dizendo "Segundo a Internet..." para fatos da web.

=== FATOS DA INTERNET ===
{contexto_web}
"""
    msg_pesquisador = [
        {"role": "system", "content": "Você é um analista direto que sempre cita suas fontes."},
        {"role": "user", "content": prompt_pesquisador}
    ]
    dossie = gerar_texto_nuvem(msg_pesquisador, max_tokens=150)
    
    # --------------------------------------------------------------------------
    # PASSO 2: O CRÍTICO (Investigador Independente)
    # --------------------------------------------------------------------------
    print("[Orquestrador] Agente B fazendo busca reversa na web...")
    contexto_contra = pesquisar_na_web("críticas controvérsias mentiras " + pergunta)
    
    print("[Orquestrador] Acionando Agente B (Advogado do Diabo)...")
    prompt_critico = f"""Leia o DOSSIÊ do Pesquisador e os FATOS REVERSOS coletados na internet.
Sua missão é atuar como um Fact-Checker Cético. Use os FATOS REVERSOS para atacar, encontrar falácias lógicas, um viés partidário ou uma contradição no Dossiê.
Escreva apenas 1 parágrafo atacando a narrativa. Cite a sua pesquisa reversa.

=== DOSSIÊ DO PESQUISADOR ===
{dossie}

=== SUA PESQUISA INDEPENDENTE (FATOS REVERSOS) ===
{contexto_contra}
"""
    msg_critico = [
        {"role": "system", "content": "Você é um investigador impiedoso que expõe mentiras e vieses com base em dados concretos."},
        {"role": "user", "content": prompt_critico}
    ]
    critica = gerar_texto_nuvem(msg_critico, max_tokens=150)

    # --------------------------------------------------------------------------
    # PASSO 3: O JUIZ (Magistrado Supremo)
    # --------------------------------------------------------------------------
    print("[Orquestrador] Agente C consultando Base Legal RAG...")
    contexto_leis = buscar_na_base_de_conhecimento(pergunta)
    
    print("[Orquestrador] Acionando Agente C (Juiz)...")
    prompt_juiz = f"""Com base na PERGUNTA, no DEBATE DA INTERNET e na BASE LEGAL (Constituição/Leis), gere um Veredito Final.
Você DEVE seguir exatamente a estrutura abaixo nas suas 3 primeiras linhas (coloque os valores após os dois pontos):
Score de Veracidade: [0 a 100%]
Impacto Político: [1 frase curta sobre como isso afeta as eleições ou a sociedade]
Veredito: [Escreva seu parágrafo final julgando o debate com base nas Leis]

=== PERGUNTA DO USUÁRIO ===
{pergunta}

=== DEBATE DA INTERNET (AGENTES A e B) ===
Fatos do Pesquisador: {dossie}
Crítica do Fact-Checker: {critica}

=== BASE LEGAL / CONSTITUIÇÃO (Fiel da Balança) ===
{contexto_leis}
"""
    msg_juiz = [
        {"role": "system", "content": "Você é um juiz de inteligência militar e política que escreve relatórios executivos persuasivos."},
        {"role": "user", "content": prompt_juiz}
    ]
    veredito_cru = gerar_texto_nuvem(msg_juiz, max_tokens=250)
    
    # --------------------------------------------------------------------------
    # FORMATADOR PYTHON (Parsing do Score de Veracidade e Impacto)
    # --------------------------------------------------------------------------
    # Tenta extrair o Score e Impacto gerados pelo modelo via Regex ou Split para garantir visual elegante
    score_match = re.search(r"Score de Veracidade:\s*(.*?)(?=\n|$)", veredito_cru, re.IGNORECASE)
    impacto_match = re.search(r"Impacto Político:\s*(.*?)(?=\n|$)", veredito_cru, re.IGNORECASE)
    veredito_match = re.search(r"Veredito:\s*(.*)", veredito_cru, re.IGNORECASE | re.DOTALL)

    str_score = score_match.group(1).strip() if score_match else "Indeterminado"
    str_impacto = impacto_match.group(1).strip() if impacto_match else "Desconhecido"
    str_veredito = veredito_match.group(1).strip() if veredito_match else veredito_cru

    resposta_final = (
        f"📊 **Análise de Inteligência (Score: {str_score})**\n"
        f"💥 **Impacto Político:** {str_impacto}\n\n"
        f"📋 **Dossiê do Pesquisador (Fatos):**\n{dossie}\n\n"
        f"⚖️ **Contestação do Advogado do Diabo (Fact-Checking):**\n{critica}\n\n"
        f"🦅 **Veredito do Juiz (Olho de Águia):**\n{str_veredito}"
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
