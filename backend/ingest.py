import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
import chromadb

def ingest_data():
    print("Iniciando a ingestão da Base de Conhecimento...")
    
    # 1. Carregar documentos da pasta data/
    loader = DirectoryLoader('./data', glob="**/*.txt", loader_cls=TextLoader)
    documents = loader.load()
    print(f"[{len(documents)}] Documentos carregados.")

    # 2. Dividir em chunks para caber no contexto do LLM
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    docs = text_splitter.split_documents(documents)
    print(f"[{len(docs)}] Chunks gerados após a divisão.")

    # 3. Inicializar o modelo de Embeddings Local (Leve e rápido)
    print("Baixando/Carregando o modelo de embeddings local...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    # 4. Inicializar o ChromaDB e a coleção
    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    # Deletamos a coleção se ela já existir para recriar os embeddings do zero
    try:
        chroma_client.delete_collection("base_conhecimento")
    except:
        pass
        
    collection = chroma_client.create_collection(name="base_conhecimento")

    # 5. Inserir os documentos com embeddings no ChromaDB
    print("Calculando embeddings e salvando no ChromaDB...")
    texts = [doc.page_content for doc in docs]
    metadatas = [doc.metadata for doc in docs]
    ids = [f"doc_{i}" for i in range(len(docs))]
    
    # Gerar embeddings
    embedded_docs = embeddings.embed_documents(texts)
    
    # Adicionar à coleção
    collection.add(
        embeddings=embedded_docs,
        documents=texts,
        metadatas=metadatas,
        ids=ids
    )
    
    print("✅ Ingestão concluída com sucesso! A Base de Conhecimentos está pronta.")

if __name__ == "__main__":
    ingest_data()
