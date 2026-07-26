import requests
import time

# Configuração do Servidor Local do LM Studio
LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"

def conversar_com_ia(sistema_prompt, mensagem_usuario):
    """Envia uma mensagem para o LM Studio e retorna a resposta."""
    payload = {
        "model": "local-model", # O LM Studio ignora o nome, ele usa o modelo que estiver carregado
        "messages": [
            {"role": "system", "content": sistema_prompt},
            {"role": "user", "content": mensagem_usuario}
        ],
        "temperature": 0.7,
        "max_tokens": 150
    }
    
    try:
        resposta = requests.post(LM_STUDIO_URL, json=payload)
        resposta.raise_for_status()
        dados = resposta.json()
        return dados["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"\n[Erro de Conexão] Certifique-se de que o Servidor Local do LM Studio está ligado!")
        print(f"Erro: {e}")
        return None

def iniciar_loop():
    print("=== Iniciando o Loop de IAs ===")
    print("Para parar, pressione Ctrl+C no terminal.\n")
    
    # Personalidades das duas IAs
    prompt_ia_1 = "Você é um filósofo questionador que gosta de levantar debates profundos. Mantenha suas respostas curtas (máximo 2 frases)."
    prompt_ia_2 = "Você é um cientista prático e objetivo que tenta responder às questões filosóficas com fatos científicos. Mantenha suas respostas curtas (máximo 2 frases)."
    
    # Mensagem inicial que dá início ao debate
    mensagem_atual = "O que é mais importante: a jornada ou o destino?"
    print(f"Ponto de partida: {mensagem_atual}\n")
    
    # Vamos fazer as duas IAs conversarem em loop 5 vezes
    for i in range(5):
        # Turno da IA 1 (Filósofo)
        print(f"IA 1 (Filósofo) pensando...")
        resposta_ia_1 = conversar_com_ia(prompt_ia_1, mensagem_atual)
        if not resposta_ia_1: break
        print(f"\n🤖 IA 1 (Filósofo): {resposta_ia_1}\n")
        
        time.sleep(2) # Pequena pausa para lermos a resposta
        
        # O que a IA 1 disse se torna a entrada para a IA 2
        mensagem_atual = resposta_ia_1
        
        # Turno da IA 2 (Cientista)
        print(f"IA 2 (Cientista) pensando...")
        resposta_ia_2 = conversar_com_ia(prompt_ia_2, mensagem_atual)
        if not resposta_ia_2: break
        print(f"\n🔬 IA 2 (Cientista): {resposta_ia_2}\n")
        
        time.sleep(2)
        
        # O que a IA 2 disse volta como entrada para a IA 1 no próximo loop
        mensagem_atual = resposta_ia_2

    print("=== Fim do Loop ===")

if __name__ == "__main__":
    iniciar_loop()
