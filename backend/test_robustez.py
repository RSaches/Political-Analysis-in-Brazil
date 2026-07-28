import sys
import os
import time
sys.path.append(os.getcwd())
from agents import analisar_cenario

perguntas = [
    "O que foi votado no Senado sobre a reforma tributária?",
    "Quais as últimas notícias sobre a regulamentação das redes sociais no Brasil?",
    "Qual a posição do governo sobre o desmatamento na Amazônia?",
    "Como estão as relações diplomáticas entre Brasil e Venezuela?",
    "Quais os impactos da atual taxa Selic na economia?",
    "O que dizem sobre a privatização de presídios?",
    "Quais os planos para o SUS e a educação pública?",
    "Quais são as novas regras para emendas parlamentares?",
    "Qual o impacto das eleições municipais no congresso?",
    "Como o STF está julgando os casos de segurança pública?"
]

for i, p in enumerate(perguntas):
    print(f"\n==========================================")
    print(f"TESTE {i+1}/10: {p}")
    try:
        inicio = time.time()
        res = analisar_cenario(p)
        fim = time.time()
        print(f"-> Concluído com sucesso em {fim - inicio:.2f} segundos.")
        print(f"RESUMO DO VEREDITO: {res.split('🦅 **VEREDITO INSTITUCIONAL (Olho de Águia):**')[-1][:200]}...")
    except Exception as e:
        print(f"-> ERRO NO TESTE {i+1}: {e}")
    time.sleep(2) # Pausa pequena entre testes
