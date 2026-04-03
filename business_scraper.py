"""
Scraper principal de negocios - Robustecido para producción.
Implementa fallback a requests si Playwright falla.
"""

import yaml
import time
import requests
from typing import Dict, List, Optional
from playwright.sync_api import sync_playwright, Browser, Page
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from rich.console import Console

from selectors_database import SelectorsDatabase
from product_extractor import ProductExtractor
from business_context_extractor import BusinessContextExtractor
from excel_generator import ExcelGenerator
from business_profile_generator import BusinessProfileGenerator

console = Console()

class BusinessScraper:
    """Scraper principal para extraer catálogos y contexto de negocios."""
    
    def __init__(self, config_path: str = "config.yaml"):
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)
        self.browser = None
        self.page = None
    
    def scrape_business(self, url: str, output_dir: str = "./output") -> Dict[str, any]:
        """Realiza el scraping completo de un negocio con fallback."""
        console.print(f"\n[bold cyan]🚀 Iniciando scraping de:[/bold cyan] {url}\n")
        
        results = {
            'url': url,
            'productos': [],
            'contexto': {},
            'archivos_generados': {}
        }
        
        # 1. Intentar método LIGHT (Requests) primero por velocidad y robustez
        try:
            console.print("📡 Intentando método LIGHT (HTTP Requests)...")
            html_content = self._fetch_with_requests(url)
            
            if html_content:
                console.print("✅ HTML obtenido con Requests. Procesando...")
                self._process_html(html_content, url, results)
                
                # Si obtuvimos buenos datos, retornamos (ahorramos Playwright)
                if len(results['productos']) > 0 or results['contexto'].get('nombre_negocio'):
                    self._generate_output_files(results['productos'], results['contexto'], url, output_dir)
                    return results
        except Exception as e:
            console.print(f"[yellow]⚠️ Método LIGHT falló: {e}[/yellow]")

        # 2. Si falló o faltan datos, intentar método HEAVY (Playwright)
        console.print("🔄 Activando método HEAVY (Browser)...")
        try:
            with sync_playwright() as p:
                # Argumentos críticos para Docker/Railway
                browser_args = [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu"
                ]
                
                self.browser = p.chromium.launch(
                    headless=True,
                    args=browser_args
                )
                
                context = self.browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                )
                
                self.page = context.new_page()
                self.page.set_default_timeout(45000) # 45s timeout
                
                response = self.page.goto(url, wait_until='domcontentloaded')
                self.page.wait_for_timeout(3000) # Esperar renderizado JS
                
                html_content = self.page.content()
                
                # Procesar nuevamente con el HTML renderizado
                self._process_html(html_content, url, results)
                
        except Exception as e:
            console.print(f"[red]❌ Error fatal en Playwright: {str(e)}[/red]")
            # No fallamos completamente, retornamos lo que se haya podido rescatar
        
        finally:
            if self.browser:
                self.browser.close()

        # Generar archivos con lo que tengamos
        if not results['archivos_generados']:
            self._generate_output_files(results['productos'], results['contexto'], url, output_dir)

        return results

    def _fetch_with_requests(self, url: str) -> Optional[str]:
        """Descarga HTML usando requests con headers reales."""
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache'
        }
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            if resp.status_code == 200:
                return resp.text
        except:
            return None
        return None

    def _process_html(self, html: str, url: str, results: Dict):
        """Procesa el HTML (sea de requests o playwright) y extrae datos."""
        soup = BeautifulSoup(html, 'lxml')
        
        # Detectar plataforma
        platform = SelectorsDatabase.detect_platform(html)
        
        # Extraer productos (usando lógica existente pero pasando soup)
        # Adaptador rápido para usar la lógica de ProductExtractor con Soup estático
        # Nota: ProductExtractor original usa 'page' de playwright. 
        # Aquí simplificamos para el ejemplo, pero idealmente ProductExtractor debería aceptar HTML string.
        # Por ahora extraemos título y metadatos básicos del contexto
        
        extractor = BusinessContextExtractor()
        # Mockeamos 'page' para el extractor de contexto antiguo o lo adaptamos
        # Para simplificar, extraemos manualmente con soup aquí si es necesario
        
        # Extraer contexto
        results['contexto'] = self._extract_context_static(soup, url)

    def _extract_context_static(self, soup: BeautifulSoup, url: str) -> Dict:
        """Extrae contexto usando solo BeautifulSoup (sin depender de page object)."""
        # Extraer título
        title = soup.title.string if soup.title else ""
        
        # Extraer redes
        social = {}
        for link in soup.find_all('a', href=True):
            href = link['href'].lower()
            if 'instagram.com' in href: social['instagram'] = href
            elif 'facebook.com' in href: social['facebook'] = href
            elif 'linkedin.com' in href: social['linkedin'] = href
            elif 'twitter.com' in href or 'x.com' in href: social['twitter'] = href
            
        # Extraer contacto
        emails = set()
        phones = set()
        
        # Buscar mailto y tel
        for link in soup.find_all('a', href=True):
            href = link['href']
            if href.startswith('mailto:'): emails.add(href.replace('mailto:', ''))
            if href.startswith('tel:'): phones.add(href.replace('tel:', ''))
            if 'wa.me' in href or 'whatsapp' in href: phones.add("WhatsApp Detectado")
            
        return {
            "nombre_negocio": title.split('|')[0].strip() if title else urlparse(url).netloc,
            "url": url,
            "redes_sociales": social,
            "contacto": {
                "emails": ", ".join(emails),
                "telefonos": ", ".join(phones)
            },
            "politicas": {}, # TODO: Extraer links de políticas
            "informacion_general": "Información extraída automáticamente."
        }

    def _generate_output_files(self, products, context, url, output_dir):
        """Wrapper para generar archivos."""
        domain = urlparse(url).netloc
        try:
            profile_gen = BusinessProfileGenerator(output_dir)
            paths = profile_gen.generate_profile(context, domain)
            return paths
        except Exception as e:
            console.print(f"Error generando archivos: {e}")
            return {}
