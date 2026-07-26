import os
import re

directory = "/home/sanches/Documentos/Projetos/LM Person/frontend/src/app"
for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            original_content = content
            # Fix the malformed syntax: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')/api/agenda'
            content = re.sub(r"\(process\.env\.NEXT_PUBLIC_API_URL \|\| 'http://localhost:8000'\)(/.*?)\'", r"`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}\1`", content)
            
            if content != original_content:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Fixed {path}")
