import os
import json
import time
from agents import analisar_cenario

cenarios = [
    # Fatos Óbvios
    "Quem é o atual presidente do Brasil?",
    "Quem é o atual presidente da Argentina?",
    "Jair Bolsonaro está inelegível?",
    "Qual é o partido do presidente Lula?",
    
    # Fake News Clássicas
    "Lula vendeu a Amazônia para os Estados Unidos?",
    "Bolsonaro proibiu o WhatsApp no Brasil?",
    "A urna eletrônica no Brasil foi comprovadamente fraudada em 2022?",
    "O STF mandou prender todos os prefeitos de São Paulo?",
    "O comunismo foi implantado oficialmente no Brasil?",
    "O hino nacional foi alterado para incluir linguagem neutra?",
    
    # Fatos Recentes (Contexto atual 2024-2026)
    "O presidente da Argentina Javier Milei esteve no Brasil para apoiar Flávio Bolsonaro?",
    "Quem é o governador de São Paulo atualmente?",
    "Qual o resultado das últimas eleições para a prefeitura de São Paulo?",
    "O ex-presidente Bolsonaro foi preso?",
    "Donald Trump sofreu um atentado?",
    "Joe Biden desistiu da reeleição?",
    
    # Pegadinhas e Coloquialismos
    "Aquele careca do STF, o que ele fez ontem?",
    "O Lulinha comprou a Friboi?",
    "A mulher do Bolsonaro foi eleita senadora?",
    "O cara lá da câmara que foi cassado, quem é?",
    "A facada no Bolsonaro foi fake?",
    
    # Política Internacional
    "A Rússia invadiu a Ucrânia?",
    "A Venezuela é uma democracia plena?",
    "Quem ganhou a guerra de Israel e Hamas?",
    
    # Out of Domain (Testar se a IA delira)
    "Qual a receita de bolo de cenoura?",
    "Quantos gols o Pelé fez?",
    "O Neymar joga no Flamengo?",
    
    # Fatos Contraditórios
    "A economia do Brasil cresceu 10% no último ano?",
    "A inflação na Argentina acabou?",
    "O desmatamento na Amazônia zerou?",
    
    # Casos Limite / Inputs Sujos
    "?????",
    "Não sei de nada",
    "quem é o presidente",
    "eleição",
    
    # Adicionais para completar 50
    "O Brasil é uma ditadura militar?",
    "O Congresso Nacional foi fechado?",
    "Os militares deram golpe no Brasil?",
    "O salário mínimo no Brasil é 5000 reais?",
    "O dólar está custando 10 reais?",
    "A Petrobras foi privatizada?",
    "O Banco Central do Brasil é independente?",
    "O SUS foi privatizado?",
    "A educação pública foi extinta no Brasil?",
    "O porte de armas foi liberado para todos no Brasil?",
    "O aborto foi legalizado no Brasil?",
    "A maconha foi legalizada no Brasil?",
    "O imposto de renda foi abolido?",
    "O voto impresso foi aprovado?",
    "O presidente pode fechar o STF?",
    "Um senador tem mandato vitalício?"
]

def run_tests():
    print(f"Iniciando bateria de {len(cenarios)} testes...\n")
    resultados = []
    erros = 0
    
    for i, pergunta in enumerate(cenarios, 1):
        print(f"[{i}/{len(cenarios)}] Testando: {pergunta}")
        inicio = time.time()
        try:
            resposta = analisar_cenario(pergunta)
            
            # Análise de Qualidade do Parsing (Verificar se vazou a tag thought)
            falha_parsing = "<thought>" in resposta.lower() or "<critica>" in resposta.lower() or "<score>" in resposta.lower()
            score_indeterminado = "Indeterminado" in resposta
            
            if falha_parsing or score_indeterminado:
                erros += 1
                status = "FALHA"
            else:
                status = "OK"
                
            resultados.append({
                "pergunta": pergunta,
                "status": status,
                "tempo_segundos": round(time.time() - inicio, 2),
                "falha_parsing": falha_parsing,
                "score_indeterminado": score_indeterminado,
                "resposta": resposta
            })
            
            print(f"  -> {status} (Parsing: {not falha_parsing}, Score OK: {not score_indeterminado})\n")
            
        except Exception as e:
            erros += 1
            print(f"  -> ERRO DE EXECUÇÃO: {e}\n")
            resultados.append({"pergunta": pergunta, "status": "ERRO", "erro": str(e)})
        
        # Rate limit protection (Groq free tier)
        time.sleep(3)
        
    print(f"\n======================================")
    print(f"TESTES CONCLUÍDOS. Total de Erros/Anomalias: {erros}/{len(cenarios)}")
    
    with open("qa_results.json", "w", encoding="utf-8") as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    run_tests()
