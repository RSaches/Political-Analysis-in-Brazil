'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Briefcase, CalendarDays, ExternalLink, Landmark, Mail, MapPin, Phone, RefreshCw, Shield, User } from 'lucide-react';
import { fetchInformacaoSenador, fetchPerfilOficialSenador, fetchSenadorDetalhes, PerfilOficialSenador, SenadorDetalhes, ServicoSenador } from '@/lib/senadoApi';
import Modal from '@/components/Modal';
import { DataRenderer } from '@/components/DataRenderer';

const formatDate = (value: string) => {
  if (!value) return 'Não informado';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

const formatServiceName = (nome: string): string => {
  // Dicionário de tradução e formatação dos nomes dos serviços
  const translations: Record<string, string> = {
    'ApartesParlamentar': 'Apartes Parlamentares',
    'CargosParlamentar': 'Cargos Parlamentares',
    'DiscursosParlamentar': 'Discursos Parlamentares',
    'FiliacaoParlamentar': 'Filiação Parlamentar',
    'HistoricoAcademicoParlamentar': 'Histórico Acadêmico',
    'LicencaParlamentar': 'Licenças Parlamentares',
    'LiderancaParlamentar': 'Lideranças Parlamentares',
    'MateriasAutoriaParlamentar': 'Matérias de Autoria',
    'MateriasRelatoriaParlamentar': 'Matérias de Relatoria',
    'MembroComissaoParlamentar': 'Membro de Comissões',
    'ProfissaoParlamentar': 'Profissões',
    'VotacaoParlamentar': 'Votações Parlamentares',
    'MandatoParlamentar': 'Mandatos',
  };
  
  return translations[nome] || nome;
};

export default function SenadorPerfilPage() {
  const params = useParams();
  const router = useRouter();
  const codigo = params.codigo as string;
  const [senador, setSenador] = useState<SenadorDetalhes | null>(null);
  const [perfilOficial, setPerfilOficial] = useState<PerfilOficialSenador | null>(null);
  const [servicoAtivo, setServicoAtivo] = useState<ServicoSenador | null>(null);
  const [dadosServico, setDadosServico] = useState<unknown>(null);
  const [carregandoServico, setCarregandoServico] = useState(false);
  const [erroServico, setErroServico] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchSenadorDetalhes(codigo), fetchPerfilOficialSenador(codigo)]).then(([dados, perfil]) => {
      setSenador(dados);
      setPerfilOficial(perfil);
      setLoading(false);
    });
  }, [codigo]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!senador) {
    return (
      <div className="flex-1 p-10 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-foreground">Senador não encontrado</h1>
        <button onClick={() => router.back()} className="mt-4 text-primary hover:underline flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</button>
      </div>
    );
  }

  const naturalidade = [senador.naturalidade, senador.ufNaturalidade].filter(Boolean).join(' - ');

  const abrirServico = async (servico: ServicoSenador) => {
    setServicoAtivo(servico);
    setDadosServico(null);
    setErroServico('');
    setCarregandoServico(true);
    try {
      setDadosServico(await fetchInformacaoSenador(codigo, servico.chave));
    } catch (error) {
      setErroServico(error instanceof Error ? error.message : 'Não foi possível carregar esta informação.');
    } finally {
      setCarregandoServico(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <button onClick={() => router.push('/senado')} className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para Senado Federal
        </button>

        <section className="flex flex-col md:flex-row gap-8 items-start">
          <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-4 border-primary/20 flex-shrink-0 shadow-lg bg-muted">
            {senador.foto ? <img src={senador.foto} alt={senador.nomeCompleto} className="w-full h-full object-cover" /> : <User className="w-16 h-16 text-muted-foreground absolute inset-0 m-auto" />}
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-primary font-bold text-sm uppercase tracking-widest flex items-center gap-2"><Landmark className="w-4 h-4" /> Senado Federal</p>
              <h1 className="text-4xl font-black text-foreground mt-2">{senador.nome}</h1>
              {senador.nomeCompleto !== senador.nome && <p className="text-xl text-muted-foreground mt-1">{senador.nomeCompleto}</p>}
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-bold text-sm">{senador.partido}</span>
              <span className="px-3 py-1 bg-secondary text-secondary-foreground border border-border rounded-full font-bold text-sm">{senador.uf}</span>
              {senador.mandatos[0] && <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full font-bold text-sm">{senador.mandatos[0].descricao}</span>}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-5">Perfil e contato</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard icon={<CalendarDays />} label="Nascimento" value={formatDate(senador.dataNascimento)} />
            <InfoCard icon={<MapPin />} label="Naturalidade" value={naturalidade || 'Não informada'} />
            <InfoCard icon={<Mail />} label="E-mail" value={senador.email || 'Não informado'} />
            <InfoCard icon={<Phone />} label="Telefones" value={senador.telefones.join(' · ') || 'Não informado'} />
            <InfoCard icon={<Briefcase />} label="Endereço parlamentar" value={senador.endereco || 'Não informado'} className="sm:col-span-2" />
          </div>
        </section>

        {perfilOficial && (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Atuação parlamentar</h2>
                <p className="text-muted-foreground mt-1">Conteúdo importado da página oficial do Senado Federal.</p>
              </div>
              <a href={perfilOficial.fonte} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">Ver fonte <ExternalLink className="w-4 h-4" /></a>
            </div>
            {Object.entries(perfilOficial.dadosPessoais).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {Object.entries(perfilOficial.dadosPessoais).map(([label, value]) => <InfoCard key={label} icon={<Landmark />} label={label} value={value} />)}
              </div>
            )}
            <div className="space-y-6">
              {perfilOficial.secoes.map((secao) => (
                <div key={secao.titulo} className="bg-card border border-border rounded-2xl p-5 overflow-hidden">
                  <h3 className="font-bold text-lg text-foreground mb-4">{secao.titulo}</h3>
                  <div className="space-y-4">
                    {secao.tables.map((tabela, index) => (
                      <div key={index} className="overflow-x-auto border border-border rounded-xl">
                        <table className="w-full min-w-[520px] text-sm text-left">
                          {tabela.cabecalhos.length > 0 && <thead className="bg-muted text-muted-foreground"><tr>{tabela.cabecalhos.map((cabecalho, column) => <th key={column} className="px-4 py-3 font-bold">{cabecalho}</th>)}</tr></thead>}
                          <tbody>{tabela.linhas.map((linha, row) => <tr key={row} className="border-t border-border">{linha.map((celula, column) => <td key={column} className="px-4 py-3 align-top text-foreground">{celula}</td>)}</tr>)}</tbody>
                        </table>
                      </div>
                    ))}
                    {secao.links.length > 0 && <div className="flex flex-wrap gap-3">{secao.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">{link.titulo}<ExternalLink className="w-3.5 h-3.5" /></a>)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {senador.mandatos.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-5">Mandatos e filiações</h2>
            <div className="space-y-4">
              {senador.mandatos.map((mandato, index) => (
                <div key={index} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-foreground">{mandato.descricao}</strong>
                    <span className="text-sm text-muted-foreground">{formatDate(mandato.inicio)} — {formatDate(mandato.fim)}</span>
                  </div>
                  {mandato.partidos.length > 0 && <p className="mt-3 text-sm text-muted-foreground">Partidos no mandato: <span className="font-semibold text-foreground">{mandato.partidos.join(' · ')}</span></p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {senador.suplentes.length > 0 && senador.suplentes.some((suplente) => suplente.nome) && (
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-5 flex items-center gap-2"><Shield className="w-6 h-6 text-primary" /> Suplentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {senador.suplentes.filter((suplente) => suplente.nome).map((suplente, index) => <InfoCard key={index} icon={<User />} label={suplente.descricao || 'Suplente'} value={suplente.nome} />)}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-2xl font-bold text-foreground mb-2">Informações legislativas</h2>
          <p className="text-muted-foreground mb-5">Consulte os dados oficiais de atividade parlamentar, como discursos, votações, comissões, matérias e cargos, sem sair da plataforma.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {senador.servicos.map((servico) => (
              <button key={servico.url} type="button" onClick={() => abrirServico(servico)} className="bg-card border border-border rounded-2xl p-4 hover:bg-accent transition-colors group text-left h-full hover:shadow-md">
                <div className="flex flex-col gap-2 h-full">
                  <div className="flex items-start gap-3">
                    <Landmark className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <h3 className="font-bold text-foreground group-hover:text-primary leading-snug">{formatServiceName(servico.nome)}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{servico.descricao}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Modal para exibir dados */}
      <Modal
        isOpen={servicoAtivo !== null}
        onClose={() => setServicoAtivo(null)}
        title={servicoAtivo ? formatServiceName(servicoAtivo.nome) : ''}
        subtitle="Dados abertos do Senado Federal"
        loading={carregandoServico}
        error={erroServico}
      >
        <DataRenderer valor={dadosServico} expandidoPorPadrao={true} />
      </Modal>
    </div>
  );
}

function InfoCard({ icon, label, value, className = '' }: { icon: ReactNode; label: string; value: string; className?: string }) {
  return <div className={`bg-card border border-border rounded-2xl p-4 flex gap-3 items-start ${className}`}><span className="text-primary mt-0.5">{icon}</span><div className="min-w-0"><p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p><p className="text-sm font-bold text-foreground mt-1 break-words">{value}</p></div></div>;
}
