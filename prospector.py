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


console = Console()


class AdnexumInspector:
    """
    Sistema completo de prospección B2B para Adnexum.
    Investiga negocios en 360° y genera entregables vendibles.
    """
    
    def __init__(self, headless: bool = True):
        """
        Inicializa el inspector.
        
        Args:
            headless: Si True, ejecuta navegadores sin interfaz gráfica
        """
        self.headless = headless
        
        # Inicializar componentes
        self.web_scraper = BusinessScraper()
        self.maps_scraper = GoogleMapsScraper(headless=headless)
        self.social_analyzer = SocialAnalyzer(headless=headless)
        self.intelligence = IntelligenceEngine()
        
        # Generadores
        self.report_gen = ReportGenerator()
        self.loom_gen = LoomScriptGenerator()
        self.questions_gen = CallQuestionsGenerator()
    
    def investigate(self, url: str, output_dir: str = "./investigaciones") -> Dict:
        """
        Ejecuta una investigación completa de un negocio.
        
        Args:
            url: URL del sitio web del negocio
            output_dir: Directorio base para guardar resultados
            
        Returns:
            Dict con todos los resultados y rutas de archivos
        """
        console.print("")
        console.print(Panel.fit(
            f"[bold cyan]🔍 ADNEXUM INSPECTOR[/bold cyan]\n"
            f"Investigación 360° de: {url}",
            border_style="cyan"
        ))
        console.print("")
        
        results = {
            "url": url,
            "timestamp": datetime.now().isoformat(),
            "web_data": None,
            "maps_data": None,
            "social_data": None,
            "diagnosis": None,
            "files": {}
        }
        
        # Crear carpeta de salida
        domain = urlparse(url).netloc.replace("www.", "")
        safe_domain = domain.replace(".", "_").replace(":", "_")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_folder = os.path.join(output_dir, f"{safe_domain}_{timestamp}")
        os.makedirs(output_folder, exist_ok=True)
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            
            # FASE 1: Scraping Web
            task1 = progress.add_task("[cyan]Fase 1/5: Analizando sitio web...", total=None)
            try:
                web_results = self.web_scraper.scrape_business(url, output_dir=output_folder)
                results["web_data"] = web_results
                results["files"]["catalogo"] = web_results.get("archivos_generados", {}).get("excel")
                results["files"]["perfil_json"] = web_results.get("archivos_generados", {}).get("perfil_json")
                progress.update(task1, description="[green]✓ Sitio web analizado")
            except Exception as e:
                console.print(f"[yellow]⚠️ Error en scraping web: {e}[/yellow]")
                results["web_data"] = {"error": str(e), "productos": [], "contexto": {}}
            
            # FASE 2: Google Maps
            task2 = progress.add_task("[cyan]Fase 2/5: Investigando reputación (Google Maps)...", total=None)
            try:
                # Obtener nombre del negocio para buscar en Maps
                business_name = results["web_data"].get("contexto", {}).get("nombre_negocio", "")
                if not business_name:
                    business_name = domain.split(".")[0].replace("-", " ").title()
                
                maps_results = self.maps_scraper.search_business(business_name)
                results["maps_data"] = maps_results
                
                if maps_results.get("status") == "found":
                    progress.update(task2, description=f"[green]✓ Google Maps: {maps_results.get('rating', 'N/A')}⭐ ({maps_results.get('total_reviews', 0)} reseñas)")
                else:
                    progress.update(task2, description="[yellow]⚠ Google Maps: No encontrado")
            except Exception as e:
                console.print(f"[yellow]⚠️ Error en Google Maps: {e}[/yellow]")
                results["maps_data"] = {"status": "error", "error": str(e)}
            
            # FASE 3: Redes Sociales
            task3 = progress.add_task("[cyan]Fase 3/5: Analizando presencia digital...", total=None)
            try:
                social_links = results["web_data"].get("contexto", {}).get("redes_sociales", {})
                if any(social_links.values()):
                    social_results = self.social_analyzer.analyze_social_presence(social_links)
                    results["social_data"] = social_results
                    progress.update(task3, description=f"[green]✓ Redes sociales: Score {social_results.get('overall_score', 'N/A')}/100")
                else:
                    results["social_data"] = {"overall_score": 0, "issues": ["Sin redes sociales detectadas"], "strengths": []}
                    progress.update(task3, description="[yellow]⚠ Sin redes sociales detectadas")
            except Exception as e:
                console.print(f"[yellow]⚠️ Error en redes sociales: {e}[/yellow]")
                results["social_data"] = {"status": "error", "error": str(e)}
            
            # FASE 4: Análisis de Inteligencia
            task4 = progress.add_task("[cyan]Fase 4/5: Generando diagnóstico...", total=None)
            try:
                diagnosis = self.intelligence.analyze(
                    web_data=results["web_data"],
                    maps_data=results["maps_data"],
                    social_data=results["social_data"]
                )
                results["diagnosis"] = {
                    "business_name": diagnosis.business_name,
                    "overall_score": diagnosis.overall_score,
                    "problems_count": len(diagnosis.get_problems()),
                    "opportunities_count": len(diagnosis.get_opportunities()),
                    "executive_summary": diagnosis.executive_summary,
                    "recommended_solutions": diagnosis.recommended_solutions
                }
                progress.update(task4, description=f"[green]✓ Diagnóstico: Score {diagnosis.overall_score}/100")
            except Exception as e:
                console.print(f"[red]❌ Error en análisis: {e}[/red]")
                raise
            
            # FASE 5: Generación de Entregables
            task5 = progress.add_task("[cyan]Fase 5/5: Generando entregables vendibles...", total=None)
            try:
                # Informe
                report_path = os.path.join(output_folder, "informe_vendible.md")
                self.report_gen.generate_report(diagnosis, report_path)
                results["files"]["informe"] = report_path
                
                # Guion Loom
                loom_path = os.path.join(output_folder, "guion_loom.md")
                self.loom_gen.generate_script(diagnosis, loom_path)
                results["files"]["guion_loom"] = loom_path
                
                # Preguntas
                questions_path = os.path.join(output_folder, "preguntas_llamada.md")
                self.questions_gen.generate_questions(diagnosis, questions_path)
                results["files"]["preguntas"] = questions_path
                
                # Guardar JSON completo
                json_path = os.path.join(output_folder, "investigacion_completa.json")
                with open(json_path, "w", encoding="utf-8") as f:
                    # Crear versión serializable
                    serializable = {
                        "url": results["url"],
                        "timestamp": results["timestamp"],
                        "diagnosis": results["diagnosis"],
                        "maps_data": results["maps_data"],
                        "files": results["files"]
                    }
                    json.dump(serializable, f, ensure_ascii=False, indent=2)
                results["files"]["json_completo"] = json_path
                
                progress.update(task5, description="[green]✓ Entregables generados")
                
            except Exception as e:
                console.print(f"[red]❌ Error generando entregables: {e}[/red]")
                raise
        
        # Mostrar resumen final
        self._print_summary(results, diagnosis, output_folder)
        
        return results
    
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
    
    args = parser.parse_args()
    
    # Validar URL
    if not args.url.startswith('http'):
        console.print("[bold red]❌ Error:[/bold red] La URL debe comenzar con http:// o https://")
        return
    
    try:
        # Ejecutar investigación
        inspector = AdnexumInspector(headless=not args.no_headless)
        results = inspector.investigate(args.url, output_dir=args.output)
        
    except KeyboardInterrupt:
        console.print("\n[yellow]⚠️ Investigación cancelada por el usuario[/yellow]")
    except Exception as e:
        console.print(f"\n[bold red]❌ Error:[/bold red] {str(e)}")
        raise


if __name__ == "__main__":
    main()
