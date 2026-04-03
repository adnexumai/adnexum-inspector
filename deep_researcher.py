"""
Módulo de Investigación Profunda para Adnexum Inspector.
Busca información externa, noticias y opiniones sobre el negocio.
Optimizado para funcionar sin API keys mediante búsqueda web inteligente.
"""

import json
import os
import re
from typing import Dict, List, Optional
from urllib.parse import quote_plus
from playwright.sync_api import sync_playwright

class DeepResearcher:
    """Busca y consolida información externa de un negocio."""
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.timeout = 30000

    def research(self, business_name: str, domain: str) -> Dict:
        """
        Ejecuta una investigación profunda en fuentes externas.
        """
        results = {
            "business_name": business_name,
            "domain": domain,
            "news": [],
            "reviews_summary": [],
            "pain_points": [],
            "social_mentions": [],
            "status": "completed"
        }

        # Consultas de búsqueda estratégica
        queries = [
            f'opiniones reales "{business_name}"',
            f'"{business_name}" problemas quejas',
            f'noticias "{business_name}" 2024 2025',
            f'"{business_name}" vs competencia'
        ]

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=self.headless)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            page = context.new_page()

            for query in queries:
                try:
                    search_results = self._search_google(page, query)
                    if "opiniones" in query or "problemas" in query:
                        results["pain_points"].extend(self._extract_insights(search_results))
                    elif "noticias" in query:
                        results["news"].extend(search_results[:5])
                    else:
                        results["social_mentions"].extend(search_results[:3])
                except Exception as e:
                    print(f"Error buscando '{query}': {e}")

            browser.close()

        # Limpiar duplicados y formatear
        results["pain_points"] = list(set(results["pain_points"]))[:10]
        
        return results

    def _search_google(self, page, query: str) -> List[Dict]:
        """Realiza una búsqueda en Google y extrae resultados básicos."""
        search_url = f"https://www.google.com/search?q={quote_plus(query)}"
        page.goto(search_url, wait_until="networkidle")
        
        results = []
        # Selectores comunes de resultados de búsqueda
        search_items = page.query_selector_all('div.g')
        for item in search_items[:8]:
            try:
                title_elem = item.query_selector('h3')
                link_elem = item.query_selector('a')
                snippet_elem = item.query_selector('div.VwiC3b')
                
                if title_elem and link_elem:
                    results.append({
                        "title": title_elem.inner_text(),
                        "url": link_elem.get_attribute("href"),
                        "snippet": snippet_elem.inner_text() if snippet_elem else ""
                    })
            except:
                continue
        return results

    def _extract_insights(self, search_results: List[Dict]) -> List[str]:
        """Extrae posibles dolores o insights de los snippets de búsqueda."""
        insights = []
        pain_keywords = ["mal", "pobre", "tarda", "error", "problema", "no responde", "caro", "peor", "estafa", "decepción"]
        
        for res in search_results:
            snippet = res.get("snippet", "").lower()
            for kw in pain_keywords:
                if kw in snippet:
                    # Intentar extraer la frase completa o el contexto
                    sentences = re.split(r'[.!?]', res["snippet"])
                    for s in sentences:
                        if kw in s.lower():
                            insights.append(s.strip())
        return insights

    def save_research(self, results: Dict, output_path: str):
        """Guarda los resultados en un archivo Markdown para NotebookLM."""
        md_content = f"# Investigación Profunda: {results['business_name']}\n\n"
        
        md_content += "## 🔴 Dolores y Quejas Detectadas\n"
        if results["pain_points"]:
            for pp in results["pain_points"]:
                md_content += f"- {pp}\n"
        else:
            md_content += "- No se detectaron quejas críticas en fuentes abiertas.\n"
        
        md_content += "\n## 📰 Noticias y Menciones Recientes\n"
        for item in results["news"]:
            md_content += f"### {item['title']}\n"
            md_content += f"- **Fuente:** {item['url']}\n"
            md_content += f"- **Resumen:** {item['snippet']}\n\n"
            
        md_content += "\n## 🌐 Presencia en la Red\n"
        for item in results["social_mentions"]:
            md_content += f"- [{item['title']}]({item['url']}): {item['snippet']}\n"

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(md_content)
        
        return output_path

if __name__ == "__main__":
    # Test rápido
    researcher = DeepResearcher(headless=False)
    data = researcher.research("Mottesi Materiales", "mottesimateriales.com.ar")
    researcher.save_research(data, "test_deep_research.md")
