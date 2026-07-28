import sys
import os

# Adiciona o diretório atual ao path para importar os módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models
from auth import get_password_hash

# Garante que as tabelas existam
models.Base.metadata.create_all(bind=engine)

def create_admin():
    db = SessionLocal()
    email = 'admin@olhardeaguia.com.br'
    pwd = '@Aguia2026'

    try:
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            print(f'Usuário {email} já existe no banco de dados!')
        else:
            hashed = get_password_hash(pwd)
            new_user = models.User(name='Admin Olho de Águia', email=email, hashed_password=hashed)
            db.add(new_user)
            db.commit()
            print(f'✅ Usuário {email} criado com sucesso!')
    except Exception as e:
        print(f"Erro ao criar usuário: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
