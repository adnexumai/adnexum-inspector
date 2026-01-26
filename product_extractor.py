"""
Módulo de extracción de productos desde páginas web.
Detecta y extrae nombre, precio, descripción e imágenes de productos.
"""

import re
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from selectors_database import SelectorsDatabase


class ProductExtractor:
    """Extrae información de productos desde páginas web."""
    
    def __init__(self, platform: Optional[str] = None):
        """
        Inicializa el extractor de productos.
        
        Args:
            platform: Plataforma de e-commerce detectada (opcional)
        """
        self.platform = platform
        self.selectors = SelectorsDatabase.get_selectors(platform)
    
    def extract_products_from_page(self, page: Page, base_url: str) -> List[Dict[str, str]]:
        """
        Extrae todos los productos de una página usando Playwright.
        
        Args:
            page: Objeto Page de Playwright
            base_url: URL base del sitio
            
        Returns:
            Lista de diccionarios con datos de productos
        """
        products = []
        
        # Obtener el contenido HTML
        html_content = page.content()
        soup = BeautifulSoup(html_content, 'lxml')
        
        # Buscar elementos de productos
        product_elements = self._find_product_elements(soup)
        
        for product_elem in product_elements:
            product_data = self._extract_product_data(product_elem, base_url)
            if product_data and product_data.get('nombre'):
                products.append(product_data)
        
        return products
    
    def _find_product_elements(self, soup: BeautifulSoup) -> List:
        """
        Encuentra todos los elementos de productos en la página.
        
        Args:
            soup: Objeto BeautifulSoup
            
        Returns:
            Lista de elementos de productos
        """
        # Intentar con selectores de la plataforma
        for selector in self.selectors['producto'].split(','):
            selector = selector.strip()
            products = soup.select(selector)
            if len(products) > 0:
                return products
        
        return []
    
    def _extract_product_data(self, product_elem, base_url: str) -> Dict[str, str]:
        """
        Extrae datos de un elemento de producto individual.
        
        Args:
            product_elem: Elemento HTML del producto
            base_url: URL base para resolver URLs relativas
            
        Returns:
            Diccionario con datos del producto
        """
        return {
            'nombre_articulo': self._extract_name(product_elem),
            'precio': self._extract_price(product_elem),
            'descripcion': self._extract_description(product_elem),
            'url_imagenes': self._extract_image_urls(product_elem, base_url)
        }
    
    def _extract_name(self, product_elem) -> str:
        """Extrae el nombre del producto."""
        for selector in self.selectors['nombre'].split(','):
            selector = selector.strip()
            elem = product_elem.select_one(selector)
            if elem:
                # Obtener texto limpio
                text = elem.get_text(strip=True)
                if text:
                    return text
        
        # Fallback: buscar cualquier heading
        for tag in ['h1', 'h2', 'h3', 'h4']:
            elem = product_elem.find(tag)
            if elem:
                text = elem.get_text(strip=True)
                if text:
                    return text
        
        return ""
    
    def _extract_price(self, product_elem) -> str:
        """Extrae y normaliza el precio del producto."""
        for selector in self.selectors['precio'].split(','):
            selector = selector.strip()
            elem = product_elem.select_one(selector)
            if elem:
                price_text = elem.get_text(strip=True)
                # Normalizar el precio
                normalized_price = self._normalize_price(price_text)
                if normalized_price:
                    return normalized_price
        
        # Buscar patrones de precio en el texto
        text_content = product_elem.get_text()
        price_match = re.search(r'[\$\€\£]\s*[\d,.]+|[\d,.]+\s*[\$\€\£]', text_content)
        if price_match:
            return self._normalize_price(price_match.group(0))
        
        return ""
    
    def _normalize_price(self, price_text: str) -> str:
        """
        Normaliza el formato del precio.
        
        Args:
            price_text: Texto con el precio
            
        Returns:
            Precio normalizado
        """
        if not price_text:
            return ""
        
        # Eliminar espacios en blanco extra
        price_text = price_text.strip()
        
        # Extraer números y símbolos monetarios
        # Mantener el formato original pero limpiar
        price_text = re.sub(r'\s+', ' ', price_text)
        
        return price_text
    
    def _extract_description(self, product_elem) -> str:
        """Extrae la descripción del producto."""
        for selector in self.selectors['descripcion'].split(','):
            selector = selector.strip()
            elem = product_elem.select_one(selector)
            if elem:
                desc = elem.get_text(strip=True)
                if desc and len(desc) > 10:  # Evitar descripciones muy cortas
                    return desc[:500]  # Limitar longitud
        
        # Fallback: buscar párrafos
        paragraphs = product_elem.find_all('p')
        if paragraphs:
            desc = ' '.join(p.get_text(strip=True) for p in paragraphs[:2])
            if desc:
                return desc[:500]
        
        return ""
    
    def _extract_image_urls(self, product_elem, base_url: str) -> str:
        """
        Extrae URLs de imágenes del producto.
        
        Args:
            product_elem: Elemento del producto
            base_url: URL base para resolver URLs relativas
            
        Returns:
            URLs de imágenes separadas por coma
        """
        image_urls = []
        
        # Buscar imágenes con los selectores
        for selector in self.selectors['imagen'].split(','):
            selector = selector.strip()
            images = product_elem.select(selector)
            
            for img in images[:3]:  # Máximo 3 imágenes por producto
                # Intentar obtener URL de diferentes atributos
                url = (
                    img.get('src') or 
                    img.get('data-src') or 
                    img.get('data-lazy-src') or
                    img.get('data-original')
                )
                
                if url:
                    # Resolver URL relativa
                    if url.startswith('//'):
                        url = 'https:' + url
                    elif url.startswith('/'):
                        url = base_url.rstrip('/') + url
                    elif not url.startswith('http'):
                        url = base_url.rstrip('/') + '/' + url
                    
                    # Evitar imágenes placeholder o muy pequeñas
                    if not any(x in url.lower() for x in ['placeholder', 'loading', 'spinner']):
                        if url not in image_urls:
                            image_urls.append(url)
        
        return ', '.join(image_urls) if image_urls else ""
    
    def extract_product_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """
        Extrae enlaces a páginas de productos individuales.
        
        Args:
            soup: Objeto BeautifulSoup
            base_url: URL base del sitio
            
        Returns:
            Lista de URLs de productos
        """
        product_urls = []
        
        # Intentar con selector específico de URLs de productos
        if 'url_producto' in self.selectors:
            for selector in self.selectors['url_producto'].split(','):
                selector = selector.strip()
                links = soup.select(selector)
                
                for link in links:
                    href = link.get('href')
                    if href:
                        # Resolver URL relativa
                        if href.startswith('/'):
                            full_url = base_url.rstrip('/') + href
                        elif not href.startswith('http'):
                            full_url = base_url.rstrip('/') + '/' + href
                        else:
                            full_url = href
                        
                        if full_url not in product_urls:
                            product_urls.append(full_url)
        
        return product_urls
