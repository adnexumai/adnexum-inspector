"""
Adnexum Inspector - Sistema de Prospección B2B 360°
Orquestador principal que integra todos los módulos.
"""

import os
import argparse
import json
from datetime import datetime
from typing import Dict, Optional
from urllib.parse import urlparse

from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

# Importar módulos del sistema
from business_scraper import BusinessScraper
from google_maps_scraper import GoogleMapsScraper
from social_analyzer import SocialAnalyzer
from intelligence_engine import IntelligenceEngine
from prospector_generators import ReportGenerator, LoomScriptGenerator, CallQuestionsGenerator
from deep_researcher import DeepResearcher
from competitor_finder import CompetitorFinder

console = Console()

class AdnexumInspector:
    """
    Sistema completo de prospección B2B para Adnexum.
    Investiga negocios en 360° y genera entregables vendibles.
    """
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.web_scraper = BusinessScraper()
        self.maps_scraper = GoogleMapsScraper(headless=headless)
        self.social_analyzer = SocialAnalyzer(headless=headless)
        self.deep_researcher = DeepResearcher(headless=headless)
        self.competitor_finder = CompetitorFinder(headless=headless)
        self.intelligence = IntelligenceEngine()
        
        # Generadores
        self.report_gen = ReportGenerator()
        self.loom_gen = LoomScriptGenerator()
        self.questions_gen = CallQuestionsGenerator()
    
    def investigate(self, url: str, output_dir: str = "./investigaciones", deep: bool = False) -> Dict:
        """
        Ejecuta una investigación completa de un negocio.
        """
        console.print("")
        console.print(Panel.fit(
            f"[bold cyan]🔍 ADNEXUM INSPECTOR - INVESTIGACIÓN {'PROFUNDA' if deep else 'BÁSICA'}[/bold cyan]\n"
            f"Analizando: {url}",
            border_style="cyan"
        ))
        
        results = {
            "url": url,
            "timestamp": datetime.now().isoformat(),
            "web_data": None,
            "maps_data": None,
            "social_data": None,
            "deep_data": None,
            "competitors": [],
            "diagnosis": None,
            "files": {}
        }
        
        # Crear carpeta de salida
        domain = urlparse(url).netloc.replace("www.", "")
        safe_domain = domain.replace(".", "_").replace(":", "_")
        output_folder = os.path.join(output_dir, f"{safe_domain}_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        os.makedirs(output_folder, exist_ok=True)
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            
            # 1. Web Scraping
            task_web = progress.add_task("[cyan]1/6: Analizando sitio web...", total=None)
            web_results = self.web_scraper.scrape_business(url, output_dir=output_folder)
            results["web_data"] = web_results
            progress.update(task_web, description="[green]✓ Web analizada")
            
            business_name = web_results.get("contexto", {}).get("nombre_negocio", "")
            if not business_name: business_name = domain.split(".")[0].title()

            # 2. Google Maps
            task_maps = progress.add_task("[cyan]2/6: Investigando reputación...", total=None)
            maps_results = self.maps_scraper.search_business(business_name)
            results["maps_data"] = maps_results
            progress.update(task_maps, description="[green]✓ Reputación analizada")
            
            # 3. Redes Sociales
            task_social = progress.add_task("[cyan]3/6: Analizando redes sociales...", total=None)
            social_links = web_results.get("contexto", {}).get("redes_sociales", {})
            if any(social_links.values()):
                social_results = self.social_analyzer.analyze_social_presence(social_links)
                results["social_data"] = social_results
            progress.update(task_social, description="[green]✓ RRSS analizadas")

            if deep:
                # 4. Deep Research
                task_deep = progress.add_task("[magenta]4/6: DEEP RESEARCH (Google/Noticias)...", total=None)
                deep_data = self.deep_researcher.research(business_name, domain)
                results["deep_data"] = deep_data
                results["files"]["research_md"] = self.deep_researcher.save_research(deep_data, os.path.join(output_folder, "deep_research.md"))
                progress.update(task_deep, description="[green]✓ Deep research completado")

                # 5. Competencia
                task_comp = progress.add_task("[magenta]5/6: Localizando competidores...", total=None)
                competitors = self.competitor_finder.find_competitors(business_name, "sector")
                results["competitors"] = competitors
                results["files"]["competitors_md"] = self.competitor_finder.export_competitors(competitors, os.path.join(output_folder, "competencia.md"))
                progress.update(task_comp, description="[green]✓ Competencia analizada")

            # 6. Diagnóstico y Entregables
            task_final = progress.add_task("[cyan]6/6: Generando diagnóstico y propuestas...", total=None)
            diagnosis = self.intelligence.analyze(results["web_data"], results["maps_data"], results["social_data"])
            
            # Generar entregables estándar
            results["files"]["informe"] = self.report_gen.generate_report(diagnosis, os.path.join(output_folder, "informe_vendible.md"))
            results["files"]["loom"] = self.loom_gen.generate_script(diagnosis, os.path.join(output_folder, "guion_loom.md"))
            results["files"]["preguntas"] = self.questions_gen.generate_questions(diagnosis, os.path.join(output_folder, "preguntas_llamada.md"))
            
            # Generar archivo específico para NotebookLM
            results["files"]["notebook_md"] = self._generate_notebook_md(results, output_folder)
            
            progress.update(task_final, description="[green]✓ Todo listo")

        self._print_summary(results, diagnosis, output_folder)
        return results

    def _generate_notebook_md(self, results: Dict, folder: str) -> str:
        """Crea el archivo estructurado para NotebookLM."""
        path = os.path.join(folder, "INVESTIGACION_PARA_NOTEBOOKLM.md")
        with open(path, "w", encoding="utf-8") as f:
            f.write(f"# Expediente de Inteligencia: {results['url']}\n\n")
            f.write("## 🏢 Perfil de Empresa\n")
            f.write(f"Nombre: {results['web_data']['contexto'].get('nombre_negocio')}\n")
            f.write(f"Contacto: {results['web_data']['contexto'].get('contacto')}\n\n")
            
            if results.get('deep_data'):
                f.write("## 🔴 Hallazgos de Deep Research\n")
                for p in results['deep_data']['pain_points']: f.write(f"- {p}\n")
            
            f.write("\n## 📊 Análisis de Reputación (Maps)\n")
            if results['maps_data']:
                f.write(f"Rating: {results['maps_data'].get('rating')} / 5\n")
                for signal in results['maps_data'].get('pain_signals', []): f.write(f"- {signal}\n")
            
            f.write("\n## 🏁 Competencia\n")
            for c in results.get('competitors', []):
                f.write(f"- {c['name']} ({c['url']})\n")
        return path

    def _print_summary(self, results: Dict, diagnosis, output_folder: str):
        # Mantenemos lógica de print existente o simplificamos
        console.print(f"\n[bold green]✨ INVESTIGACIÓN {'PROFUNDA' if results.get('deep_data') else 'BÁSICA'} COMPLETADA[/bold green]")
        console.print(f"Archivos listos en: [link=file:///{output_folder.replace('\\', '/')}] {output_folder} [/link]")
    
    def _print_summary(self, results: Dict, diagnosis, output_folder: str):
        """Imprime un resumen visual de la investigación."""
        console.print("")
        console.print("=" * 70)
        console.print("[bold green]✨ INVESTIGACIÓN COMPLETADA[/bold green]")
        console.print("=" * 70)
        console.print("")
        
        # Tabla de resumen
        table = Table(title="📊 Resumen Ejecutivo", show_header=False, border_style="cyan")
        table.add_column("Métrica", style="cyan")
        table.add_column("Valor", style="white")
        
        table.add_row("Negocio", diagnosis.business_name)
        table.add_row("Score General", f"{diagnosis.overall_score}/100")
        table.add_row("Problemas Detectados", str(len(diagnosis.get_problems())))
        table.add_row("Oportunidades", str(len(diagnosis.get_opportunities())))
        
        if results.get("maps_data", {}).get("rating"):
            table.add_row("Rating Google Maps", f"{results['maps_data']['rating']}⭐")
        
        console.print(table)
        console.print("")
        
        # Mostrar resumen ejecutivo
        console.print("[bold]📌 Puntos Clave:[/bold]")
        for bullet in diagnosis.executive_summary:
            console.print(f"   {bullet}")
        console.print("")
        
        # Mostrar archivos generados
        console.print("[bold]📁 Archivos Generados:[/bold]")
        for tipo, ruta in results["files"].items():
            if ruta:
                console.print(f"   • {tipo}: [cyan]{ruta}[/cyan]")
        console.print("")
        
        console.print(f"[bold green]📂 Todo guardado en:[/bold green] {output_folder}")
        console.print("")
        console.print("[dim]Para usar estos entregables:[/dim]")
        console.print("  1. Abre [cyan]guion_loom.md[/cyan] y graba un Loom de 60-90s")
        console.print("  2. Envía el Loom al prospecto con el [cyan]informe_vendible.md[/cyan]")
        console.print("  3. Usa [cyan]preguntas_llamada.md[/cyan] en la reunión de discovery")
        console.print("")


def main():
    """CLI principal del Adnexum Inspector."""
    parser = argparse.ArgumentParser(
        description='🔍 Adnexum Inspector - Sistema de Prospección B2B 360°',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos de uso:
  python prospector.py --url https://negocio.com
  python prospector.py --url https://tienda.com --output ./clientes
  python prospector.py --url https://ejemplo.com --no-headless  # Ver navegador

El sistema investigará:
  • Sitio web (catálogo, contacto, políticas)
  • Google Maps (rating, reseñas, quejas)
  • Redes sociales (presencia, actividad)

Y generará:
  • Informe vendible con problemas y oportunidades
  • Guion Loom de 60-90 segundos
  • Preguntas para la llamada de discovery
        """
    )
    
    parser.add_argument(
        '--url',
        type=str,
        required=True,
        help='URL del sitio web a investigar'
    )
    
    parser.add_argument(
        '--output',
        type=str,
        default='./investigaciones',
        help='Directorio para guardar los resultados (default: ./investigaciones)'
    )
    
    parser.add_argument(
        '--no-headless',
        action='store_true',
        help='Mostrar el navegador durante el scraping (útil para debug)'
    )

    parser.add_argument(
        '--deep',
        action='store_true',
        help='Ejecutar investigación profunda 360° con NotebookLM e inteligencia de mercado'
    )
    
    args = parser.parse_args()
    
    # Validar URL
    if not args.url.startswith('http'):
        console.print("[bold red]❌ Error:[/bold red] La URL debe comenzar con http:// o https://")
        return
    
    try:
        # Ejecutar investigación
        inspector = AdnexumInspector(headless=not args.no_headless)
        results = inspector.investigate(args.url, output_dir=args.output, deep=args.deep)
        
    except KeyboardInterrupt:
        console.print("\n[yellow]⚠️ Investigación cancelada por el usuario[/yellow]")
    except Exception as e:
        console.print(f"\n[bold red]❌ Error:[/bold red] {str(e)}")
        raise


if __name__ == "__main__":
    main()
