"""
Script de ejemplo para probar el agente de scraping con sitios populares.
"""

from business_scraper import BusinessScraper
from rich.console import Console

console = Console()


def test_scraper():
    """Prueba el scraper con diferentes tipos de sitios."""
    
    # Lista de URLs de ejemplo para probar
    test_urls = [
        # Puedes agregar URLs de sitios reales aquí
        # Por ejemplo:
        # "https://ejemplo-shopify.myshopify.com",
        # "https://ejemplo-tienda.com",
    ]
    
    if not test_urls:
        console.print("[yellow]⚠️  No hay URLs de prueba configuradas.[/yellow]")
        console.print("\nPara probar el scraper, edita este archivo y agrega URLs en la lista 'test_urls'")
        console.print("\nO ejecuta directamente:")
        console.print("  [cyan]python main.py --url https://tu-sitio.com[/cyan]")
        return
    
    console.print("[bold cyan]🧪 Iniciando pruebas del scraper...[/bold cyan]\n")
    
    scraper = BusinessScraper()
    
    for idx, url in enumerate(test_urls, 1):
        console.print(f"\n[bold]Prueba {idx}/{len(test_urls)}[/bold]")
        console.print("─" * 60)
        
        try:
            results = scraper.scrape_business(url, output_dir=f"./test_output_{idx}")
            
            # Validar resultados
            if len(results['productos']) > 0:
                console.print(f"[green]✅ Test exitoso: {len(results['productos'])} productos extraídos[/green]")
            else:
                console.print(f"[yellow]⚠️  Test parcial: No se extrajeron productos[/yellow]")
            
        except Exception as e:
            console.print(f"[red]❌ Test fallido: {str(e)}[/red]")
    
    console.print("\n[bold green]✨ Pruebas completadas[/bold green]")


if __name__ == '__main__':
    test_scraper()
