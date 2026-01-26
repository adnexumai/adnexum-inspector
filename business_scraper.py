"""
Scraper principal de negocios - orquesta la extracción de productos y contexto.
"""

import yaml
import time
from typing import Dict, List, Optional
from playwright.sync_api import sync_playwright, Browser, Page
from urllib.parse import urlparse
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

from selectors_database import SelectorsDatabase
from product_extractor import ProductExtractor
from business_context_extractor import BusinessContextExtractor
from excel_generator import ExcelGenerator
from business_profile_generator import BusinessProfileGenerator


console = Console()


class BusinessScraper:
    """Scraper principal para extraer catálogos y contexto de negocios."""
    
    def __init__(self, config_path: str = "config.yaml"):
        """
        Inicializa el scraper.
        
        Args:
            config_path: Ruta al archivo de configuración
        """
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)
        
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
    
    def scrape_business(self, url: str, output_dir: str = "./output") -> Dict[str, any]:
        """
        Realiza el scraping completo de un negocio.
        
        Args:
            url: URL del sitio web a scrapear
            output_dir: Directorio de salida
            
        Returns:
            Diccionario con resultados y rutas de archivos generados
        """
        console.print(f"\n[bold cyan]🚀 Iniciando scraping de:[/bold cyan] {url}\n")
        
        results = {
            'url': url,
            'productos': [],
            'contexto': {},
            'archivos_generados': {}
        }
        
        with sync_playwright() as p:
            # Inicializar navegador
            self.browser = p.chromium.launch(
                headless=self.config['general']['headless']
            )
            
            context = self.browser.new_context(
                user_agent=self.config['general']['user_agent']
            )
            
            self.page = context.new_page()
            
            try:
                # Navegar a la página
                console.print(f"📡 Cargando página...")
                self.page.goto(url, wait_until='networkidle', timeout=self.config['general']['timeout'])
                
                # Esperar carga adicional
                self.page.wait_for_timeout(self.config['general']['wait_for_load'])
                
                # Detectar plataforma
                platform = self._detect_platform()
                if platform:
                    console.print(f"✅ Plataforma detectada: [bold green]{platform}[/bold green]")
                else:
                    console.print("⚠️  Plataforma no detectada, usando selectores genéricos")
                
                # Extraer productos
                console.print("\n[bold yellow]📦 Extrayendo productos...[/bold yellow]")
                products = self._extract_products(platform, url)
                results['productos'] = products
                console.print(f"✅ Productos extraídos: [bold green]{len(products)}[/bold green]")
                
                # Extraer contexto del negocio
                console.print("\n[bold yellow]🏢 Extrayendo contexto del negocio...[/bold yellow]")
                # Volver a la página principal si se navegó a otras páginas
                self.page.goto(url, wait_until='networkidle', timeout=self.config['general']['timeout'])
                context_data = self._extract_business_context(url)
                results['contexto'] = context_data
                console.print("✅ Contexto extraído")
                
                # Generar archivos
                console.print("\n[bold yellow]💾 Generando archivos...[/bold yellow]")
                generated_files = self._generate_output_files(products, context_data, url, output_dir)
                results['archivos_generados'] = generated_files
                
                console.print("\n[bold green]✨ ¡Scraping completado exitosamente![/bold green]\n")
                self._print_summary(results)
                
            except Exception as e:
                console.print(f"\n[bold red]❌ Error durante el scraping:[/bold red] {str(e)}")
                raise
            
            finally:
                if self.page:
                    self.page.close()
                if self.browser:
                    self.browser.close()
        
        return results
    
    def _detect_platform(self) -> Optional[str]:
        """
        Detecta la plataforma de e-commerce.
        
        Returns:
            Nombre de la plataforma o None
        """
        html_content = self.page.content()
        return SelectorsDatabase.detect_platform(html_content)
    
    def _extract_products(self, platform: Optional[str], base_url: str) -> List[Dict]:
        """
        Extrae productos de la página.
        
        Args:
            platform: Plataforma detectada
            base_url: URL base del sitio
            
        Returns:
            Lista de productos
        """
        extractor = ProductExtractor(platform)
        products = extractor.extract_products_from_page(self.page, base_url)
        
        # Si no se encontraron productos, intentar buscar en páginas de categoría
        if len(products) == 0:
            console.print("⚠️  No se encontraron productos en la página principal")
            console.print("🔍 Intentando buscar enlaces a productos...")
            
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(self.page.content(), 'lxml')
            product_links = extractor.extract_product_links(soup, base_url)
            
            if product_links:
                console.print(f"📌 Encontrados {len(product_links)} enlaces a productos")
                # Visitar algunas páginas de productos (máximo 10 para no saturar)
                for link in product_links[:10]:
                    try:
                        self.page.goto(link, wait_until='networkidle', timeout=15000)
                        self.page.wait_for_timeout(1000)
                        product_data = extractor.extract_products_from_page(self.page, base_url)
                        if product_data:
                            products.extend(product_data)
                    except Exception as e:
                        console.print(f"⚠️  Error al visitar {link}: {str(e)}")
                        continue
        
        return products
    
    def _extract_business_context(self, base_url: str) -> Dict:
        """
        Extrae el contexto del negocio.
        
        Args:
            base_url: URL base del sitio
            
        Returns:
            Diccionario con contexto
        """
        extractor = BusinessContextExtractor()
        return extractor.extract_business_context(self.page, base_url)
    
    def _generate_output_files(
        self, 
        products: List[Dict], 
        context: Dict, 
        url: str,
        output_dir: str
    ) -> Dict[str, str]:
        """
        Genera archivos de salida (Excel y perfil).
        
        Args:
            products: Lista de productos
            context: Contexto del negocio
            url: URL del sitio
            output_dir: Directorio de salida
            
        Returns:
            Diccionario con rutas de archivos generados
        """
        domain = urlparse(url).netloc
        
        # Generar Excel
        excel_gen = ExcelGenerator(output_dir)
        excel_path = excel_gen.generate_catalog(products, domain)
        console.print(f"📊 Excel generado: [cyan]{excel_path}[/cyan]")
        
        # Generar perfil de negocio
        profile_gen = BusinessProfileGenerator(output_dir)
        profile_paths = profile_gen.generate_profile(context, domain)
        console.print(f"📄 Perfil JSON: [cyan]{profile_paths['json']}[/cyan]")
        console.print(f"📝 Perfil Markdown: [cyan]{profile_paths['markdown']}[/cyan]")
        
        return {
            'excel': excel_path,
            'perfil_json': profile_paths['json'],
            'perfil_markdown': profile_paths['markdown']
        }
    
    def _print_summary(self, results: Dict):
        """
        Imprime un resumen de los resultados.
        
        Args:
            results: Diccionario con resultados del scraping
        """
        console.print("━" * 60)
        console.print("[bold]RESUMEN DE EXTRACCIÓN[/bold]")
        console.print("━" * 60)
        console.print(f"🌐 Sitio: {results['url']}")
        console.print(f"📦 Productos extraídos: {len(results['productos'])}")
        console.print(f"🏢 Nombre del negocio: {results['contexto'].get('nombre_negocio', 'N/A')}")
        
        contacto = results['contexto'].get('contacto', {})
        if contacto.get('telefonos'):
            console.print(f"📞 Teléfono: {contacto['telefonos']}")
        if contacto.get('emails'):
            console.print(f"📧 Email: {contacto['emails']}")
        
        console.print("\n[bold]Archivos generados:[/bold]")
        for tipo, ruta in results['archivos_generados'].items():
            console.print(f"  • {tipo}: {ruta}")
        console.print("━" * 60)
