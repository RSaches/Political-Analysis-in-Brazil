export interface Proposicao {
  id: number;
  uri: string;
  siglaTipo: string;
  numero: number;
  ano: number;
  ementa: string;
}

const CAMARA_API_URL = 'https://dadosabertos.camara.leg.br/api/v2';
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * No navegador, usa o proxy do backend. A API da Câmara bloqueia o rewrite do
 * Next com HTTP 403 em alguns ambientes. No Server Component, a URL pública
 * permanece necessária porque `fetch` não aceita URLs relativas no Node.js.
 */
function getBaseUrl() {
  return typeof window === 'undefined' ? CAMARA_API_URL : `${BACKEND_API_URL}/api/camara`;
}

export interface FetchProposicoesOptions {
  itens?: number;
  pagina?: number;
  siglaTipo?: string;
  ano?: number;
  keywords?: string;
}

/**
 * Busca as proposições (projetos de lei) da Câmara dos Deputados com filtros e paginação.
 */
export async function fetchUltimasProposicoes(options: FetchProposicoesOptions | number = 5): Promise<Proposicao[]> {
  const opts = typeof options === 'number' ? { itens: options } : options;
  const { itens = 5, pagina = 1, siglaTipo, ano, keywords } = opts;

  try {
    const url = new URL(`${getBaseUrl()}/proposicoes`, typeof window !== 'undefined' ? window.location.origin : undefined);
    url.searchParams.append('itens', itens.toString());
    url.searchParams.append('pagina', pagina.toString());
    url.searchParams.append('ordem', 'DESC');
    url.searchParams.append('ordenarPor', 'id');
    
    if (siglaTipo) url.searchParams.append('siglaTipo', siglaTipo);
    if (ano) url.searchParams.append('ano', ano.toString());
    if (keywords) url.searchParams.append('keywords', keywords);
    
    const response = await fetch(url.toString());

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.dados as Proposicao[];
  } catch {
    return [];
  }
}



export interface Autor {
  nome: string;
  siglaPartido?: string;
  siglaUF?: string;
  uri: string;
}

export interface Tramitacao {
  dataHora: string;
  sequencia: number;
  siglaOrgao: string;
  despacho: string;
  apreciacao?: string;
}

export interface ProposicaoDetalhada extends Proposicao {
  dataApresentacao: string;
  urlInteiroTeor: string;
  statusProposicao: {
    dataHora: string;
    siglaOrgao: string;
    despacho: string;
  };
  autores?: Autor[]; // Resolvido via endpoint adicional
}

/**
 * Busca os detalhes de uma proposição específica pelo ID.
 */
export async function fetchProposicaoById(id: number): Promise<ProposicaoDetalhada | null> {
  try {
    const res = await fetch(`${getBaseUrl()}/proposicoes/${id}`);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    
    // Busca os autores
    let autores = [];
    try {
      const autoresRes = await fetch(`${getBaseUrl()}/proposicoes/${id}/autores`);
      if (autoresRes.ok) {
        const autoresData = await autoresRes.json();
        autores = autoresData.dados;
      }
    } catch(e) {}

    return { ...data.dados, autores } as ProposicaoDetalhada;
  } catch {
    return null;
  }
}



/**
 * Busca o histórico de tramitações de uma proposição.
 */
export async function fetchTramitacoes(id: number): Promise<Tramitacao[]> {
  try {
    const res = await fetch(`${getBaseUrl()}/proposicoes/${id}/tramitacoes`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    
    const tramitacoes = data.dados as Tramitacao[];
    return tramitacoes.sort((a, b) => b.sequencia - a.sequencia);
  } catch {
    return [];
  }
}

// =================== DEPUTADOS ===================

export interface DeputadoBasico {
  id: number;
  uri: string;
  nome: string;
  siglaPartido: string;
  uriPartido: string;
  siglaUf: string;
  idLegislatura: number;
  urlFoto: string;
  email: string;
}

export interface FetchDeputadosOptions {
  pagina?: number;
  itens?: number;
  nome?: string;
  siglaUf?: string;
  siglaPartido?: string;
}

export async function fetchDeputados(options: FetchDeputadosOptions = {}): Promise<DeputadoBasico[]> {
  const { pagina = 1, itens = 20, nome, siglaUf, siglaPartido } = options;
  
  try {
    const url = new URL(`${getBaseUrl()}/deputados`, typeof window !== 'undefined' ? window.location.origin : undefined);
    url.searchParams.append('pagina', pagina.toString());
    url.searchParams.append('itens', itens.toString());
    url.searchParams.append('ordem', 'ASC');
    url.searchParams.append('ordenarPor', 'nome');

    if (nome) url.searchParams.append('nome', nome);
    if (siglaUf) url.searchParams.append('siglaUf', siglaUf);
    if (siglaPartido) url.searchParams.append('siglaPartido', siglaPartido);

    const res = await fetch(url.toString());
    
    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.dados as DeputadoBasico[];
  } catch {
    return [];
  }
}

// =================== AGENDA (EVENTOS) ===================

export interface EventoAgenda {
  id: number;
  uri: string;
  dataHoraInicio: string;
  dataHoraFim: string | null;
  situacao: string;
  descricaoTipo: string;
  descricao: string;
  localExterno: string | null;
  orgaos: {
    id: number;
    sigla: string;
    nome: string;
  }[];
  localCamara: {
    nome: string | null;
    predio: string | null;
    sala: string | null;
    andar: string | null;
  };
  urlRegistro: string | null;
}

export interface EventoDetalhes extends EventoAgenda {
  urlDocumentoPauta: string | null;
  requerimentos: {
    titulo: string;
    uri: string;
  }[];
  fases: string | null;
  uriDeputados: string | null;
  uriConvidados: string | null;
}

export async function fetchAgenda(dataInicio?: string, dataFim?: string): Promise<EventoAgenda[]> {
  try {
    const url = new URL(`${getBaseUrl()}/eventos`, typeof window !== 'undefined' ? window.location.origin : undefined);
    
    if (!dataInicio) {
      const hoje = new Date();
      const semanaQueVem = new Date();
      semanaQueVem.setDate(hoje.getDate() + 7);
      dataInicio = hoje.toISOString().split('T')[0];
      dataFim = semanaQueVem.toISOString().split('T')[0];
    }

    url.searchParams.append('dataInicio', dataInicio);
    if (dataFim) url.searchParams.append('dataFim', dataFim);
    url.searchParams.append('itens', '20');
    url.searchParams.append('ordem', 'ASC');
    url.searchParams.append('ordenarPor', 'dataHoraInicio');

    const res = await fetch(url.toString());
    
    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.dados as EventoAgenda[];
  } catch {
    return [];
  }
}

export async function fetchEventoDetalhes(id: number): Promise<EventoDetalhes | null> {
  try {
    const url = new URL(`${getBaseUrl()}/eventos/${id}`, typeof window !== 'undefined' ? window.location.origin : undefined);
    const res = await fetch(url.toString());
    
    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.dados as EventoDetalhes;
  } catch {
    return null;
  }
}

export interface PautaItem {
  ordem: number;
  topico: string;
  titulo: string;
  textoParecer: string | null;
  situacaoItem: string;
  relator: {
    nome: string;
    siglaPartido: string;
    siglaUf: string;
  } | null;
  proposicaoRelacionada_?: {
    ementa: string;
  };
}

export async function fetchEventoPauta(id: number): Promise<PautaItem[]> {
  try {
    const url = new URL(`${getBaseUrl()}/eventos/${id}/pauta`, typeof window !== 'undefined' ? window.location.origin : undefined);
    const res = await fetch(url.toString());
    
    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.dados as PautaItem[];
  } catch {
    return [];
  }
}
