'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface DataRendererProps {
  valor: unknown;
  titulo?: string;
  expandidoPorPadrao?: boolean;
}

export function DataRenderer({ valor, titulo, expandidoPorPadrao = true }: DataRendererProps) {
  const [expandido, setExpandido] = useState(expandidoPorPadrao);

  if (valor === null || valor === undefined) {
    return <p className="text-muted-foreground italic">Nenhum dado disponível.</p>;
  }

  if (typeof valor !== 'object') {
    return <span className="text-foreground font-medium">{String(valor)}</span>;
  }

  if (Array.isArray(valor)) {
    if (valor.length === 0) {
      return <p className="text-muted-foreground italic">Nenhum registro encontrado.</p>;
    }

    // Verifica se é um array de registros simples (tudo primitivo ou null)
    const registrosSimples = valor.every((item) => 
      isRecord(item) && Object.values(item).every((campo) => typeof campo !== 'object' || campo === null)
    );

    if (registrosSimples) {
      return <TabelaModerna dados={valor} />;
    }

    // Array de objetos complexos
    return (
      <div className="space-y-3">
        {valor.map((item, index) => (
          <AcordeonItem
            key={index}
            titulo={`Registro ${index + 1}`}
            conteudo={item}
            expandidoPorPadrao={index === 0}
          />
        ))}
      </div>
    );
  }

  // Objeto
  const entries = Object.entries(valor as Record<string, unknown>)
    .filter(([chave]) => chave !== 'Metadados' && chave !== 'noNamespaceSchemaLocation');

  if (entries.length === 0) {
    return <p className="text-muted-foreground italic">Nenhum dado disponível.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map(([chave, conteudo]) => {
        const temSubestruturas = typeof conteudo === 'object' && conteudo !== null;
        
        if (temSubestruturas) {
          return (
            <AcordeonItem
              key={chave}
              titulo={formatarLabel(chave)}
              conteudo={conteudo}
              expandidoPorPadrao={true}
            />
          );
        }

        return (
          <div key={chave} className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
              {formatarLabel(chave)}
            </p>
            <p className="text-sm text-foreground font-medium">
              {formatarValor(conteudo)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function AcordeonItem({ titulo, conteudo, expandidoPorPadrao = false }: { titulo: string; conteudo: unknown; expandidoPorPadrao?: boolean }) {
  const [expandido, setExpandido] = useState(expandidoPorPadrao);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden bg-muted/10">
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <h4 className="font-bold text-foreground text-sm">{titulo}</h4>
        <ChevronDown
          className="w-4 h-4 text-muted-foreground transition-transform"
          style={{ transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {expandido && (
        <div className="border-t border-border/50 px-4 py-3 bg-background/50">
          <DataRenderer valor={conteudo} expandidoPorPadrao={false} />
        </div>
      )}
    </div>
  );
}

function TabelaModerna({ dados }: { dados: Record<string, unknown>[] }) {
  const colunas = [...new Set(dados.flatMap((item) => Object.keys(item)))];

  return (
    <div className="overflow-x-auto rounded-lg border border-border/50 bg-background">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-primary/10 border-b border-border/50">
            {colunas.map((coluna) => (
              <th
                key={coluna}
                className="px-4 py-3 text-left font-bold text-foreground text-xs uppercase tracking-wider"
              >
                {formatarLabel(coluna)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dados.map((item, linha) => (
            <tr
              key={linha}
              className="border-t border-border/50 hover:bg-muted/30 transition-colors"
            >
              {colunas.map((coluna) => (
                <td
                  key={coluna}
                  className="px-4 py-3 text-foreground text-sm break-words max-w-xs"
                >
                  {formatarValor(item[coluna])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function isRecord(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function formatarLabel(valor: string): string {
  return valor
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letra) => letra.toUpperCase())
    .trim();
}

function formatarValor(valor: unknown): string {
  if (valor === null || valor === undefined) return '—';
  if (typeof valor === 'object') return JSON.stringify(valor);
  return String(valor);
}
