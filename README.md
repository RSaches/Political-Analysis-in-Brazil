# 🦅 Olho de Águia — Political Analysis in Brazil

> Plataforma inteligente de monitoramento, análise de dados e inteligência artificial aplicada ao cenário político brasileiro.

---

## 📋 Visão Geral

O **Olho de Águia (Political Analysis in Brazil)** é um sistema integrado que combina **inteligência artificial (LLM via Groq API)**, **banco de dados vetorial (ChromaDB)**, **raspagem de dados em tempo real** (notícias, discursos, dados da Câmara dos Deputados e YouTube) e um **painel interativo de análise política**.

A plataforma oferece monitoramento contínuo de agentes políticos, verificação de fatos, sumarização de discursos e relatórios em tempo real.

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Linguagem:** Python 3.12
- **Framework Web:** FastAPI (com Uvicorn)
- **Inteligência Artificial:** Groq SDK (`llama-3.1-8b-instant`), LangChain, HuggingFace (`sentence-transformers/all-MiniLM-L6-v2`)
- **Banco de Dados Relacional:** SQLite (`olho_de_aguia.db`) com SQLAlchemy
- **Banco de Dados Vetorial (RAG):** ChromaDB (`chroma_db`)
- **Autenticação:** PyJWT, Bcrypt, OAuth2 Password Bearer
- **Raspadores & Coleta:** DuckDuckGo Search, BeautifulSoup4, Feedparser, API da Câmara dos Deputados

### Frontend
- **Framework Web:** Next.js (React 18 / TypeScript)
- **Estilização:** Tailwind CSS, Shadcn UI / Radix UI
- **Ícones:** Lucide React

---

## 🔑 Configuração da Chave da Groq API

> [!IMPORTANT]
> Por razões estritas de **segurança e transparência**, a chave de API real da Groq **não está exposta nem incluída neste repositório**.

Para utilizar as funcionalidades de inteligência artificial (agentes de análise política e geração de relatórios), você deve obter a sua própria chave de API gratuita e configurá-la no arquivo de ambiente do backend:

1. Acesse o console da Groq: [https://console.groq.com/keys](https://console.groq.com/keys)
2. Crie uma nova **API Key**.
3. Crie (ou edite) o arquivo `.env` dentro da pasta `backend/` a partir do modelo `.env.example`:
   ```bash
   cd backend
   cp .env.example .env
   ```
4. Adicione sua chave no arquivo `backend/.env`:
   ```env
   GROQ_API_KEY=gsk_suachaveaqui
   ```

---

## 🔐 Credenciais de Acesso do Administrador (Admin)

Para acessar o painel administrativo e utilizar todas as funcionalidades restritas do sistema, utilize as credenciais padrão de inicialização:

- **E-mail / Login:** `admin@olhardeaguia.com.br`
- **Senha:** `@Aguia2026`

### 🚀 Inicialização da Conta Admin no Banco de Dados
Para garantir que a conta administrativa seja criada no banco de dados local (`olho_de_aguia.db`), execute o script de criação antes de iniciar a aplicação:

```bash
cd backend
python create_admin.py
```
*Se a conta já existir no banco de dados, o script notificará sem sobrescrever ou corromper os dados.*

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
- **Python 3.12** ou superior instalado
- **Node.js 18+** e **npm** instalados

---

### 2. Configurando e Executando o Backend

1. Navegue até o diretório do backend:
   ```bash
   cd backend
   ```

2. Crie e ative um ambiente virtual Python:
   ```bash
   # Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate

   # Windows:
   python -m venv venv
   venv\Scripts\activate
   ```

3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure o arquivo `.env` com a sua `GROQ_API_KEY`:
   ```bash
   cp .env.example .env
   ```

5. Crie a conta do Administrador:
   ```bash
   python create_admin.py
   ```

6. Inicie o servidor FastAPI:
   ```bash
   python main.py
   ```
   *O backend estará rodando em:* `http://localhost:8000` *(documentação Swagger interativa em `http://localhost:8000/docs`).*

---

### 3. Configurando e Executando o Frontend

1. Abra um novo terminal e navegue até o diretório do frontend:
   ```bash
   cd frontend
   ```

2. Instale as dependências do Node.js:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento do Next.js:
   ```bash
   npm run dev
   ```
   *O frontend estará acessível em:* `http://localhost:3000`

---

## 📂 Estrutura de Diretórios

```
Political-Analysis-in-Brazil/
├── backend/
│   ├── agents.py           # Definição e lógica dos agentes de IA (Groq + LangChain)
│   ├── auth.py             # Autenticação JWT, geração de hash de senhas e rotas de login
│   ├── create_admin.py     # Script para povoamento do usuário administrador inicial
│   ├── database.py         # Configuração da conexão SQLite com SQLAlchemy
│   ├── ingest.py           # Pipeline de ingestão de dados para o ChromaDB
│   ├── main.py             # Servidor principal FastAPI com todas as rotas e endpoints
│   ├── models.py           # Modelos de tabelas do banco de dados (User, etc.)
│   ├── scrapers.py         # Módulos de raspagem (Notícias, G1, Câmara dos Deputados)
│   ├── requirements.txt    # Lista de dependências Python
│   ├── .env.example        # Modelo de variáveis de ambiente
│   └── .env                # Arquivo de variáveis de ambiente (contém a GROQ_API_KEY local)
│
├── frontend/
│   ├── src/                # Código fonte da aplicação Next.js (Páginas, Componentes, Hooks)
│   ├── public/             # Arquivos estáticos e ativos visuais
│   ├── package.json        # Dependências e scripts do Node.js
│   └── next.config.ts      # Configurações do framework Next.js
│
└── README.md               # Documentação principal do projeto
```

---

## 📜 Licença

Este projeto é licenciado sob a **Apache License 2.0** (`Apache-2.0`). Veja o arquivo [LICENSE](LICENSE) para o texto jurídico completo.

### ⚖️ Resumo Técnico de Direitos e Condições (Padrão de Mercado):

| Categoria | Descrição |
| :--- | :--- |
| **Permissões** | Uso comercial, modificação, distribuição, uso privado, execução e concessão explícita de patentes. |
| **Condições** | Manutenção dos avisos de copyright, inclusão de cópia da licença `Apache 2.0` e notificação ostensiva de arquivos alterados. |
| **Garantia & Responsabilidade** | O software é fornecido *"COMO ESTÁ"* (*AS IS*), sem garantias de qualquer tipo. Desenvolvedores e colaboradores não responderão por eventuais danos. |