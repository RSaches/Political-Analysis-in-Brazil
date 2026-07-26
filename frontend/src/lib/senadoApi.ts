// =================== SENADO FEDERAL ===================
// API: https://legis.senado.leg.br/dadosabertos/

const SENADO_BASE_URL = 'https://legis.senado.leg.br/dadosabertos';

export interface Senador {
  codigo: string;
  nome: string;
  nomeCompleto: string;
  sexo: string;
  foto: string;
  partido: string;
  uf: string;
  email: string;
  urlPagina: string;
}

export interface SenadorDetalhes extends Senador {
  dataNascimento: string;
  naturalidade: string;
  ufNaturalidade: string;
  endereco: string;
  telefones: string[];
  mandatos: MandatoSenador[];
  suplentes: { nome: string; descricao: string }[];
  servicos: ServicoSenador[];
}

export interface MandatoSenador {
  descricao: string;
  inicio: string;
  fim: string;
  partidos: string[];
}

export interface ServicoSenador {
  chave: string;
  nome: string;
  descricao: string;
  url: string;
}

export interface PerfilOficialSenador {
  fonte: string;
  dadosPessoais: Record<string, string>;
  secoes: {
    titulo: string;
    tables: { cabecalhos: string[]; linhas: string[][] }[];
    links: { titulo: string; url: string }[];
  }[];
}

export async function fetchSenadores(): Promise<Senador[]> {
  try {
    const res = await fetch(`${SENADO_BASE_URL}/senador/lista/atual`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      console.error(`[API Senado] Erro HTTP ${res.status} ao buscar senadores.`);
      return [];
    }

    const data = await res.json();
    const parlamentares = data?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];

    return parlamentares.map((p: any) => {
      const id = p.IdentificacaoParlamentar;
      return {
        codigo: id.CodigoParlamentar,
        nome: id.NomeParlamentar,
        nomeCompleto: id.NomeCompletoParlamentar,
        sexo: id.SexoParlamentar,
        foto: id.UrlFotoParlamentar,
        partido: id.SiglaPartidoParlamentar,
        uf: id.UfParlamentar,
        email: id.EmailParlamentar || '',
        urlPagina: id.UrlPaginaParlamentar || '',
      } as Senador;
    });
  } catch (error: any) {
    console.error(`[API Senado] Falha na rede ao buscar senadores:`, error.message);
    return [];
  }
}

export async function fetchSenadorDetalhes(codigo: string): Promise<SenadorDetalhes | null> {
  try {
    const [res, resMandatos] = await Promise.all([
      fetch(`${SENADO_BASE_URL}/senador/${codigo}`, { headers: { 'Accept': 'application/json' } }),
      fetch(`${SENADO_BASE_URL}/senador/${codigo}/mandatos?v=5`, { headers: { 'Accept': 'application/json' } }),
    ]);

    if (!res.ok) {
      console.error(`[API Senado] Erro HTTP ${res.status} ao buscar detalhes do senador ${codigo}.`);
      return null;
    }

    const data = await res.json();
    const parlamentar = data?.DetalheParlamentar?.Parlamentar;
    if (!parlamentar) return null;

    const id = parlamentar.IdentificacaoParlamentar;
    const dadosBasicos = parlamentar.DadosBasicosParlamentar || {};
    const mandatosRaw = resMandatos.ok
      ? resMandatos.json().then(data => data?.MandatoParlamentar?.Parlamentar?.Mandatos?.Mandato || [])
      : Promise.resolve([]);
    const mandatos = await mandatosRaw;
    const mandatosLista = Array.isArray(mandatos) ? mandatos : [mandatos];
    const mandatoAtual = mandatosLista.find((mandato: any) => !mandato?.DataFim) || mandatosLista[0] || {};
    const suplentes = mandatoAtual.Suplentes?.Suplente || [];
    const telefones = parlamentar.Telefones?.Telefone || [];
    const servicos = parlamentar.OutrasInformacoes?.Servico || [];

    return {
      codigo: id.CodigoParlamentar,
      nome: id.NomeParlamentar,
      nomeCompleto: id.NomeCompletoParlamentar,
      sexo: id.SexoParlamentar,
      foto: id.UrlFotoParlamentar,
      partido: id.SiglaPartidoParlamentar,
      uf: id.UfParlamentar,
      email: id.EmailParlamentar || '',
      urlPagina: id.UrlPaginaParlamentar || '',
      dataNascimento: dadosBasicos.DataNascimento || '',
      naturalidade: dadosBasicos.Naturalidade || '',
      ufNaturalidade: dadosBasicos.UfNaturalidade || '',
      endereco: dadosBasicos.EnderecoParlamentar || '',
      telefones: (Array.isArray(telefones) ? telefones : [telefones])
        .map((telefone: any) => telefone?.NumeroTelefone)
        .filter(Boolean),
      mandatos: mandatosLista.map((mandato: any) => ({
        descricao: mandato.DescricaoParticipacao || 'Titular',
        inicio: mandato.PrimeiraLegislaturaDoMandato?.DataInicio || '',
        fim: mandato.SegundaLegislaturaDoMandato?.DataFim || mandato.PrimeiraLegislaturaDoMandato?.DataFim || '',
        partidos: (Array.isArray(mandato.Partidos?.Partido) ? mandato.Partidos.Partido : [mandato.Partidos?.Partido])
          .map((partido: any) => partido?.Sigla || partido?.Nome)
          .filter(Boolean),
      })),
      suplentes: Array.isArray(suplentes)
        ? suplentes.map((s: any) => ({ nome: s.NomeParlamentar, descricao: s.DescricaoParticipacao }))
        : [{ nome: suplentes.NomeParlamentar, descricao: suplentes.DescricaoParticipacao }],
      servicos: (Array.isArray(servicos) ? servicos : [servicos])
        .filter((servico: any) => servico?.UrlServico)
        .map((servico: any) => ({
          nome: servico.NomeServico || 'Informação oficial',
          chave: servico.NomeServico || '',
          descricao: servico.DescricaoServico || 'Consultar informação oficial no Senado Federal.',
          url: servico.UrlServico,
        })),
    } as SenadorDetalhes;
  } catch (error: any) {
    console.error(`[API Senado] Falha na rede ao buscar detalhes do senador:`, error.message);
    return null;
  }
}

export async function fetchPerfilOficialSenador(codigo: string): Promise<PerfilOficialSenador | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${baseUrl}/api/senadores/${codigo}/perfil-oficial`);
    if (!res.ok) return null;
    return res.json() as Promise<PerfilOficialSenador>;
  } catch (error: unknown) {
    console.error('[API Senado] Falha ao importar o perfil oficial:', error);
    return null;
  }
}

export async function fetchInformacaoSenador(codigo: string, servico: string): Promise<unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const res = await fetch(`${baseUrl}/api/senadores/${codigo}/informacoes/${encodeURIComponent(servico)}`);
  if (!res.ok) throw new Error('Não foi possível carregar esta informação do Senado.');
  return res.json();
}
