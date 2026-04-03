"""
Base de datos de selectores CSS para plataformas de e-commerce comunes.
Detecta automáticamente la plataforma y aplica los selectores apropiados.
"""

import re
from typing import Dict, Optional


class SelectorsDatabase:
    """Gestiona selectores CSS para diferentes plataformas de e-commerce."""
    
    PLATFORM_SIGNATURES = {
        'shopify': [
            r'cdn\.shopify\.com',
            r'myshopify\.com',
            r'Shopify\.theme',
        ],
        'woocommerce': [
            r'woocommerce',
            r'wp-content/plugins/woocommerce',
        ],
        'tiendanube': [
            r'tiendanube\.com',
            r'nube\.com\.ar',
        ],
        'mercadoshops': [
            r'mercadoshops\.com',
        ],
        'vtex': [
            r'vteximg\.com\.br',
            r'vtex\.com',
        ]
    }
    
    PLATFORM_SELECTORS = {
        'shopify': {
            'producto': '.product-card, .product-item, [data-product-grid-item]',
            'nombre': '.product-card__title, .product__title, h2.h3',
            'precio': '.price, .price__regular, .price-item--regular',
            'descripcion': '.product-card__description, .product__description',
            'imagen': '.product-card__image img, .product__media img',
            'url_producto': 'a.product-card__link, a[href*="/products/"]'
        },
        'woocommerce': {
            'producto': '.product, li.product, .product-item',
            'nombre': '.woocommerce-loop-product__title, h2.product-title, h3',
            'precio': '.price, .woocommerce-Price-amount',
            'descripcion': '.woocommerce-product-details__short-description, .product-short-description',
            'imagen': '.wp-post-image, .product-image img',
            'url_producto': 'a.woocommerce-LoopProduct-link, a[href*="/product/"]'
        },
        'tiendanube': {
            'producto': '.product-item, .item-product',
            'nombre': '.item-name, .product-name',
            'precio': '.price, .item-price',
            'descripcion': '.item-description, .product-description',
            'imagen': '.item-image img, .product-image img',
            'url_producto': 'a.item-link, a[href*="/productos/"]'
        },
        'mercadoshops': {
            'producto': '.eshop-item, .product-card',
            'nombre': '.eshop-item__title, .product-title',
            'precio': '.eshop-price, .price',
            'descripcion': '.eshop-item__description',
            'imagen': '.eshop-item__image img',
            'url_producto': 'a.eshop-item__link'
        },
        'vtex': {
            'producto': '.vtex-product-summary, .product-item',
            'nombre': '.vtex-product-summary__product-name, .productName',
            'precio': '.vtex-product-price, .sellingPrice',
            'descripcion': '.vtex-product-summary__description',
            'imagen': '.vtex-product-summary__image img',
            'url_producto': 'a.vtex-product-summary__container'
        }
    }
    
    @staticmethod
    def detect_platform(html_content: str) -> Optional[str]:
        """
        Detecta la plataforma de e-commerce basándose en el contenido HTML.
        
        Args:
            html_content: Contenido HTML de la página
            
        Returns:
            Nombre de la plataforma detectada o None
        """
        for platform, signatures in SelectorsDatabase.PLATFORM_SIGNATURES.items():
            for signature in signatures:
                if re.search(signature, html_content, re.IGNORECASE):
                    return platform
        return None
    
    @staticmethod
    def get_selectors(platform: Optional[str] = None) -> Dict[str, str]:
        """
        Obtiene los selectores CSS para una plataforma específica.
        
        Args:
            platform: Nombre de la plataforma (opcional)
            
        Returns:
            Diccionario con selectores CSS
        """
        if platform and platform in SelectorsDatabase.PLATFORM_SELECTORS:
            return SelectorsDatabase.PLATFORM_SELECTORS[platform]
        
        # Selectores genéricos por defecto
        return {
            'producto': '.product, .product-item, .item, [data-product]',
            'nombre': 'h2, h3, .product-title, .product-name, .item-name',
            'precio': '.price, .product-price, .precio, [data-price]',
            'descripcion': '.description, .product-description, p',
            'imagen': 'img',
            'url_producto': 'a'
        }
    
    @staticmethod
    def get_business_selectors() -> Dict[str, str]:
        """
        Obtiene selectores para información contextual del negocio.
        
        Returns:
            Diccionario con selectores de contexto empresarial
        """
        return {
            'phone': 'a[href^="tel:"], a[href*="whatsapp"], .phone, .telefono',
            'email': 'a[href^="mailto:"], .email, .mail',
            'address': '.address, .direccion, [itemtype*="PostalAddress"]',
            'social_instagram': 'a[href*="instagram.com"]',
            'social_facebook': 'a[href*="facebook.com"]',
            'social_twitter': 'a[href*="twitter.com"]',
            'social_linkedin': 'a[href*="linkedin.com"]',
            'about': 'a[href*="nosotros"], a[href*="about"], #about, .about',
            'contact': 'a[href*="contacto"], a[href*="contact"], #contact, .contact',
            'faq': 'a[href*="preguntas"], a[href*="faq"], #faq, .faq'
        }
