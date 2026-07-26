from playwright.sync_api import sync_playwright
import time

def buscar_posts_do_x(usuario_x: str, limite_posts: int = 5):
    """
    Usa o Playwright para raspar os posts mais recentes de um perfil do X (Twitter).
    Isso contorna bloqueios de API, simulando um navegador real.
    """
    print(f"[Scraper] Iniciando extração de posts de @{usuario_x}...")
    posts_extraidos = []
    
    try:
        with sync_playwright() as p:
            # Lança um navegador Chromium (headless=False se quiser ver acontecendo)
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = context.new_page()
            
            url = f"https://x.com/{usuario_x}"
            page.goto(url, wait_until="networkidle")
            
            # Espera o feed carregar (pode demorar dependendo da conexão e do X)
            page.wait_for_timeout(5000) 
            
            # Seleciona os elementos de texto dos tweets (O seletor pode mudar frequentemente no X)
            # Um seletor genérico atual para o texto do tweet é "[data-testid='tweetText']"
            elementos_tweet = page.locator("[data-testid='tweetText']").all()
            
            for elemento in elementos_tweet[:limite_posts]:
                texto = elemento.inner_text()
                posts_extraidos.append(texto)
                
            browser.close()
            
            print(f"[Scraper] {len(posts_extraidos)} posts extraídos com sucesso.")
            return posts_extraidos
            
    except Exception as e:
        print(f"[Scraper] Erro ao raspar X: {str(e)}")
        return []

if __name__ == "__main__":
    # Teste rápido
    posts = buscar_posts_do_x("SenadoFederal", limite_posts=2)
    for p in posts:
        print("POST:", p)
        print("-" * 50)
