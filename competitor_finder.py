"""
Módulo buscador de competidores para Adnexum Inspector.
Identifica y analiza competidores del prospecto.
"""

import os
from typing import Dict, List
from urllib.parse import quote_plus
from playwright.sync_api import sync_playwright

class CompetitorFinder:
    """Busca y analiza competidores en la web."""
    
    def __init__(self, headless: bool = True):
        self.headless = headless

    def find_competitors(self, business_name: str, sector: str = "") -> List[Dict]:
        """
        Busca competidores top 3 para el negocio.
        """
        query = f'competidores de "{business_name}" {sector}'
        competitors = []

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=self.headless)
            page = browser.new_page()
            
            try:
                # Buscar en Google
                search_url = f"https://www.google.com/search?q={quote_plus(query)}"
                page.goto(search_url, wait_until="networkidle")
                
                # Extraer enlaces
                links = page.query_selector_all('div.g a')
                potential_urls = []
                for link in links:
                    href = link.get_attribute("href")
                    if href and "http" in href and "google" not in href:
                        potential_urls.append(href)
                
                # Para el MVP, tomamos los 3 primeros únicos
                unique_urls = []
                for u in potential_urls:
                    domain = u.split('/')[2]
                    if domain not in [x.split('/')[2] if '/' in x else '' for x in unique_urls]:
                        unique_urls.append(u)
                        if len(unique_urls) >= 3: break
                
                for url in unique_urls:
                    competitors.append({
                        "name": url.split('/')[2].replace("www.", ""),
                        "url": url,
                        "analysis": "Análisis pendiente de scraping profundo"
                    })
                    
            except Exception as e:
                print(f"Error buscando competidores: {e}")
            finally:
                browser.close()
                
        return competitors

    def export_competitors(self, competitors: List[Dict], output_path: str):
        """Genera un archivo Markdown con la comparativa."""
        md = f"# Análisis de Competencia\n\n"
        md += "| Competidor | URL | Diferencial Detectado |\n"
        md += "|------------|-----|------------------------|\n"
        
        for c in competitors:
            md += f"| {c['name']} | {c['url']} | {c['analysis']} |\n"
            
        md += "\n> [!TIP]\n"
        md += "> Estos competidores fueron detectados automáticamente. Su análisis profundo permitirá a NotebookLM encontrar GAPs estratégicos."

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(md)
        return output_path

if __name__ == "__main__":
    finder = CompetitorFinder(headless=False)
    comp = finder.find_competitors("Mottesi Materiales", "construcción comodoro rivadavia")
    finder.export_competitors(comp, "test_competencia.md")
