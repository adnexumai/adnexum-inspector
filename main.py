"""
Script principal CLI para ejecutar el agente de scraping.
"""

import argparse
import sys
from pathlib import Path
from business_scraper import BusinessScraper
from rich.console import Console

console = Console()


def main():
    """Función principal del CLI."""
    parser = argparse.ArgumentParser(
        description='🤖 Agente de Scraping para Demos Personalizadas de Automatización',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos de uso:
  python main.py --url https://example-shop.com
  python main.py --url https://tienda.com --output ./mis_resultados
  python main.py --url https://shop.com --config mi_config.yaml

El scraper extraerá:
  • Catálogo de productos (Excel con nombre, precio, descripción, imágenes)
  • Perfil contextual del negocio (JSON y Markdown para personalizar IA)
        """
    )
    
    parser.add_argument(
        '--url',
        type=str,
        required=True,
        help='URL del sitio web a scrapear'
    )
    
    parser.add_argument(
        '--output',
        type=str,
        default='./output',
        help='Directorio de salida para los archivos generados (default: ./output)'
    )
    
    parser.add_argument(
        '--config',
        type=str,
        default='config.yaml',
        help='Ruta al archivo de configuración (default: config.yaml)'
    )
    
    args = parser.parse_args()
    
    # Validar URL
    if not args.url.startswith('http'):
        console.print("[bold red]❌ Error:[/bold red] La URL debe comenzar con http:// o https://")
        sys.exit(1)
    
    # Validar que existe el archivo de configuración
    if not Path(args.config).exists():
        console.print(f"[bold red]❌ Error:[/bold red] No se encontró el archivo de configuración: {args.config}")
        sys.exit(1)
    
    try:
        # Crear directorio de salida si no existe
        Path(args.output).mkdir(parents=True, exist_ok=True)
        
        # Ejecutar scraper
        # Se asume que BusinessScraper o scrape_business acepta un argumento 'deep'
        scraper = BusinessScraper(config_path=args.config)
        results = scraper.scrape_business(args.url, output_dir=args.output, deep=args.deep)
        
        # Verificar que se extrajeron datos
        if len(results['productos']) == 0:
            console.print("\n[bold yellow]⚠️  ADVERTENCIA:[/bold yellow] No se extrajeron productos.")
            console.print("Posibles razones:")
            console.print("  • El sitio requiere interacción adicional (scroll, clicks)")
            console.print("  • Los selectores CSS no coinciden con la estructura del sitio")
            console.print("  • El sitio tiene protección anti-scraping")
            console.print("\nSugerencia: Revisa el sitio manualmente y considera agregar selectores personalizados en config.yaml")
        
        console.print(f"\n[bold green]✅ Proceso completado.[/bold green]")
        console.print(f"Los archivos se guardaron en: [cyan]{args.output}[/cyan]")
        
    except KeyboardInterrupt:
        console.print("\n\n[yellow]⚠️  Proceso interrumpido por el usuario[/yellow]")
        sys.exit(0)
    
    except Exception as e:
        console.print(f"\n[bold red]❌ Error fatal:[/bold red] {str(e)}")
        console.print("\nPara más detalles, ejecuta con Python en modo debug:")
        console.print(f"  python -m pdb main.py --url {args.url}")
        sys.exit(1)


if __name__ == '__main__':
    main()
