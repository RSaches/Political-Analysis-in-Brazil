import os
import glob

directory = "/home/sanches/Documentos/Projetos/LM Person/frontend/src/app"
for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            if "http://localhost:8000" in content:
                new_content = content.replace("'http://localhost:8000", "(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')")
                new_content = new_content.replace("`http://localhost:8000", "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}")
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated {path}")
