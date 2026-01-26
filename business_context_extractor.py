"""
Módulo de extracción de información contextual del negocio.
Extrae datos como contacto, redes sociales, políticas, etc.
"""

import re
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from selectors_database import SelectorsDatabase


class BusinessContextExtractor:
    """Extrae información contextual de un negocio desde su sitio web."""
    
    def __init__(self):
        """Inicializa el extractor de contexto empresarial."""
        self.selectors = SelectorsDatabase.get_business_selectors()
    
    def extract_business_context(self, page: Page, base_url: str) -> Dict:
        """
        Extrae toda la información contextual del negocio.
        
        Args:
            page: Objeto Page de Playwright
            base_url: URL base del sitio
            
        Returns:
            Diccionario con información del negocio
        """
        html_content = page.content()
        soup = BeautifulSoup(html_content, 'lxml')
        
        context = {
            'url': base_url,
            'nombre_negocio': self._extract_business_name(soup, page),
            'contacto': self._extract_contact_info(soup),
            'redes_sociales': self._extract_social_media(soup),
            'informacion_general': self._extract_general_info(soup, page, base_url),
            'politicas': self._extract_policies(soup),
            'faq': self._extract_faq(soup, page, base_url)
        }
        
        return context
    
    def _extract_business_name(self, soup: BeautifulSoup, page: Page) -> str:
        """Extrae el nombre del negocio."""
        # Intentar con el tag title
        title = soup.find('title')
        if title:
            title_text = title.get_text(strip=True)
            # Limpiar texto común del título
            name = re.sub(r'\s*[-|–]\s*.*$', '', title_text)
            if name:
                return name
        
        # Intentar con meta property og:site_name
        og_site = soup.find('meta', property='og:site_name')
        if og_site and og_site.get('content'):
            return og_site['content']
        
        # Buscar en el logo o header
        logo = soup.select_one('header img[alt], .logo img[alt], .brand img[alt]')
        if logo and logo.get('alt'):
            return logo['alt']
        
        # Fallback: primer h1
        h1 = soup.find('h1')
        if h1:
            return h1.get_text(strip=True)
        
        return "Nombre no encontrado"
    
    def _extract_contact_info(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extrae información de contacto."""
        contact = {}
        
        # Teléfonos
        phones = []
        phone_links = soup.select(self.selectors['phone'])
        for link in phone_links:
            href = link.get('href', '')
            if 'tel:' in href:
                phone = href.replace('tel:', '').strip()
                phones.append(phone)
            elif 'whatsapp' in href.lower():
                # Extraer número de WhatsApp
                match = re.search(r'phone=(\d+)', href)
                if match:
                    phones.append(f"WhatsApp: {match.group(1)}")
        
        contact['telefonos'] = ', '.join(phones) if phones else ""
        
        # Emails
        emails = []
        email_links = soup.select(self.selectors['email'])
        for link in email_links:
            href = link.get('href', '')
            if 'mailto:' in href:
                email = href.replace('mailto:', '').strip()
                emails.append(email)
        
        contact['emails'] = ', '.join(emails) if emails else ""
        
        # Dirección
        address_elem = soup.select_one(self.selectors['address'])
        if address_elem:
            contact['direccion'] = address_elem.get_text(strip=True)
        else:
            contact['direccion'] = ""
        
        return contact
    
    def _extract_social_media(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extrae enlaces a redes sociales."""
        social = {}
        
        social_platforms = {
            'instagram': self.selectors['social_instagram'],
            'facebook': self.selectors['social_facebook'],
            'twitter': self.selectors['social_twitter'],
            'linkedin': self.selectors['social_linkedin']
        }
        
        for platform, selector in social_platforms.items():
            link = soup.select_one(selector)
            if link:
                social[platform] = link.get('href', '')
            else:
                social[platform] = ""
        
        return social
    
    def _extract_general_info(self, soup: BeautifulSoup, page: Page, base_url: str) -> str:
        """Extrae información general del negocio (sobre nosotros, misión, etc)."""
        info_parts = []
        
        # Buscar sección "Sobre nosotros"
        about_link = soup.select_one(self.selectors['about'])
        if about_link:
            href = about_link.get('href')
            if href:
                try:
                    # Navegar a la página "sobre nosotros"
                    if href.startswith('/'):
                        about_url = base_url.rstrip('/') + href
                    else:
                        about_url = href
                    
                    page.goto(about_url, wait_until='networkidle', timeout=10000)
                    about_soup = BeautifulSoup(page.content(), 'lxml')
                    
                    # Extraer contenido principal
                    main_content = about_soup.select_one('main, .main, #main, .content, article')
                    if main_content:
                        paragraphs = main_content.find_all('p')
                        text = ' '.join(p.get_text(strip=True) for p in paragraphs[:5])
                        info_parts.append(text[:1000])
                except Exception as e:
                    # Si falla, continuar
                    pass
        
        # Buscar en meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            info_parts.append(meta_desc['content'])
        
        return ' '.join(info_parts) if info_parts else "No disponible"
    
    def _extract_policies(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extrae políticas del negocio (envío, devoluciones, términos)."""
        policies = {}
        
        # Buscar enlaces a políticas
        shipping_link = soup.select_one(self.selectors.get('shipping', ''))
        if shipping_link:
            policies['envio'] = shipping_link.get('href', '')
        else:
            policies['envio'] = ""
        
        returns_link = soup.select_one(self.selectors.get('returns', ''))
        if returns_link:
            policies['devoluciones'] = returns_link.get('href', '')
        else:
            policies['devoluciones'] = ""
        
        terms_link = soup.select_one(self.selectors.get('terms', ''))
        if terms_link:
            policies['terminos'] = terms_link.get('href', '')
        else:
            policies['terminos'] = ""
        
        return policies
    
    def _extract_faq(self, soup: BeautifulSoup, page: Page, base_url: str) -> List[Dict[str, str]]:
        """Extrae preguntas frecuentes si están disponibles."""
        faqs = []
        
        # Buscar enlace a FAQ
        faq_link = soup.select_one(self.selectors['faq'])
        if faq_link:
            href = faq_link.get('href')
            if href:
                try:
                    # Navegar a la página de FAQ
                    if href.startswith('/'):
                        faq_url = base_url.rstrip('/') + href
                    else:
                        faq_url = href
                    
                    page.goto(faq_url, wait_until='networkidle', timeout=10000)
                    faq_soup = BeautifulSoup(page.content(), 'lxml')
                    
                    # Intentar extraer preguntas y respuestas
                    # Patrón común: divs con clase faq-item, question, answer
                    faq_items = faq_soup.select('.faq-item, .faq-question, [itemtype*="Question"]')
                    
                    for item in faq_items[:10]:  # Máximo 10 FAQs
                        question = ""
                        answer = ""
                        
                        # Intentar encontrar pregunta
                        q_elem = item.select_one('.question, h3, h4, strong, [itemprop="name"]')
                        if q_elem:
                            question = q_elem.get_text(strip=True)
                        
                        # Intentar encontrar respuesta
                        a_elem = item.select_one('.answer, p, [itemprop="text"]')
                        if a_elem:
                            answer = a_elem.get_text(strip=True)
                        
                        if question:
                            faqs.append({
                                'pregunta': question,
                                'respuesta': answer
                            })
                except Exception as e:
                    # Si falla, continuar
                    pass
        
        return faqs
