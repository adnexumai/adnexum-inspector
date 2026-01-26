"""
Scraper de Google Maps para extraer reputación y reseñas de negocios.
Usa Playwright para navegar y extraer datos públicos.
"""

import re
from typing import Dict, List, Optional
from playwright.sync_api import sync_playwright, Page
from urllib.parse import quote_plus


class GoogleMapsScraper:
    """Extrae información de reputación desde Google Maps."""
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.timeout = 15000
    
    def search_business(self, business_name: str, location: str = "") -> Dict:
        """
        Busca un negocio en Google Maps y extrae su información.
        
        Args:
            business_name: Nombre del negocio
            location: Ciudad/ubicación opcional
            
        Returns:
            Dict con rating, total_reviews, reviews_text, address, etc.
        """
        result = {
            "status": "not_found",
            "business_name": business_name,
            "rating": None,
            "total_reviews": 0,
            "address": "",
            "phone": "",
            "website": "",
            "hours": "",
            "reviews": [],
            "pain_signals": [],
            "praise_signals": []
        }
        
        search_query = f"{business_name} {location}".strip()
        search_url = f"https://www.google.com/maps/search/{quote_plus(search_query)}"
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=self.headless)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            page = context.new_page()
            
            try:
                page.goto(search_url, wait_until="networkidle", timeout=self.timeout)
                page.wait_for_timeout(2000)
                
                # Verificar si encontró resultados
                if self._has_results(page):
                    # Hacer clic en el primer resultado si hay lista
                    self._click_first_result(page)
                    page.wait_for_timeout(2000)
                    
                    # Extraer información básica
                    result["status"] = "found"
                    result["rating"] = self._extract_rating(page)
                    result["total_reviews"] = self._extract_review_count(page)
                    result["address"] = self._extract_address(page)
                    result["phone"] = self._extract_phone(page)
                    result["hours"] = self._extract_hours(page)
                    
                    # Extraer reseñas si hay
                    if result["total_reviews"] > 0:
                        reviews = self._extract_reviews(page)
                        result["reviews"] = reviews
                        
                        # Analizar señales de dolor y elogio
                        result["pain_signals"] = self._detect_pain_signals(reviews)
                        result["praise_signals"] = self._detect_praise_signals(reviews)
                
            except Exception as e:
                result["status"] = "error"
                result["error"] = str(e)
            
            finally:
                browser.close()
        
        return result
    
    def _has_results(self, page: Page) -> bool:
        """Verifica si hay resultados en la búsqueda."""
        try:
            # Buscar elementos que indiquen que hay un negocio
            selectors = [
                '[data-value="Rating"]',
                '.fontDisplayLarge',
                'button[data-item-id="rating"]',
                '[aria-label*="estrellas"]',
                '[aria-label*="stars"]'
            ]
            for sel in selectors:
                if page.query_selector(sel):
                    return True
            return page.query_selector('[role="main"]') is not None
        except:
            return False
    
    def _click_first_result(self, page: Page):
        """Hace clic en el primer resultado de la lista."""
        try:
            first_result = page.query_selector('[role="feed"] > div:first-child a')
            if first_result:
                first_result.click()
                page.wait_for_timeout(1500)
        except:
            pass
    
    def _extract_rating(self, page: Page) -> Optional[float]:
        """Extrae el rating (estrellas)."""
        try:
            selectors = [
                '[aria-label*="estrellas"]',
                '[aria-label*="stars"]',
                '.fontDisplayLarge',
                'span[role="img"][aria-label]'
            ]
            for sel in selectors:
                elem = page.query_selector(sel)
                if elem:
                    text = elem.get_attribute("aria-label") or elem.inner_text()
                    match = re.search(r'(\d[.,]\d)', text)
                    if match:
                        return float(match.group(1).replace(",", "."))
        except:
            pass
        return None
    
    def _extract_review_count(self, page: Page) -> int:
        """Extrae el número total de reseñas."""
        try:
            selectors = [
                'button[aria-label*="reseñas"]',
                'button[aria-label*="reviews"]',
                '[aria-label*="reseñas"]',
                '[aria-label*="reviews"]'
            ]
            for sel in selectors:
                elem = page.query_selector(sel)
                if elem:
                    text = elem.get_attribute("aria-label") or elem.inner_text()
                    match = re.search(r'(\d+[.,]?\d*)', text.replace(".", "").replace(",", ""))
                    if match:
                        return int(match.group(1))
        except:
            pass
        return 0
    
    def _extract_address(self, page: Page) -> str:
        """Extrae la dirección del negocio."""
        try:
            elem = page.query_selector('[data-item-id="address"] .fontBodyMedium')
            if elem:
                return elem.inner_text().strip()
        except:
            pass
        return ""
    
    def _extract_phone(self, page: Page) -> str:
        """Extrae el teléfono del negocio."""
        try:
            elem = page.query_selector('[data-item-id^="phone"] .fontBodyMedium')
            if elem:
                return elem.inner_text().strip()
        except:
            pass
        return ""
    
    def _extract_hours(self, page: Page) -> str:
        """Extrae los horarios del negocio."""
        try:
            elem = page.query_selector('[aria-label*="horario"], [aria-label*="hours"]')
            if elem:
                return elem.get_attribute("aria-label") or ""
        except:
            pass
        return ""
    
    def _extract_reviews(self, page: Page, max_reviews: int = 15) -> List[Dict]:
        """Extrae las reseñas más recientes."""
        reviews = []
        try:
            # Hacer clic en el botón de reseñas para abrir el panel
            review_btn = page.query_selector('button[aria-label*="reseñas"], button[aria-label*="reviews"]')
            if review_btn:
                review_btn.click()
                page.wait_for_timeout(2000)
            
            # Scroll para cargar más reseñas
            review_container = page.query_selector('[role="feed"], .m6QErb.DxyBCb')
            if review_container:
                for _ in range(3):
                    page.evaluate('(el) => el.scrollTop = el.scrollHeight', review_container)
                    page.wait_for_timeout(1000)
            
            # Extraer reseñas
            review_elements = page.query_selector_all('.jftiEf, [data-review-id]')
            
            for elem in review_elements[:max_reviews]:
                try:
                    # Texto de la reseña
                    text_elem = elem.query_selector('.wiI7pd, .MyEned')
                    text = text_elem.inner_text() if text_elem else ""
                    
                    # Rating de la reseña individual
                    stars_elem = elem.query_selector('[aria-label*="estrellas"], [aria-label*="stars"]')
                    stars = 0
                    if stars_elem:
                        label = stars_elem.get_attribute("aria-label") or ""
                        match = re.search(r'(\d)', label)
                        if match:
                            stars = int(match.group(1))
                    
                    if text:
                        reviews.append({
                            "text": text[:500],
                            "stars": stars
                        })
                except:
                    continue
                    
        except:
            pass
        
        return reviews
    
    def _detect_pain_signals(self, reviews: List[Dict]) -> List[str]:
        """Detecta señales de dolor en las reseñas negativas."""
        pain_keywords = {
            "demora": "Demoras en atención/entrega",
            "tarda": "Demoras en atención/entrega",
            "lento": "Servicio lento",
            "no contestan": "Falta de respuesta",
            "no responden": "Falta de respuesta",
            "sin respuesta": "Falta de respuesta",
            "mala atención": "Mala atención al cliente",
            "pésimo": "Experiencia muy negativa",
            "horrible": "Experiencia muy negativa",
            "nunca más": "Clientes perdidos permanentemente",
            "no recomiendo": "No recomiendan el negocio",
            "perdí tiempo": "Pérdida de tiempo del cliente",
            "caro": "Precios percibidos como altos",
            "estafa": "Desconfianza/sensación de fraude",
            "mentira": "Comunicación engañosa",
            "incompleto": "Pedidos incompletos",
            "equivocado": "Errores en pedidos",
            "roto": "Productos dañados",
            "sucio": "Problemas de higiene/limpieza"
        }
        
        signals = set()
        for review in reviews:
            if review.get("stars", 5) <= 3:
                text_lower = review.get("text", "").lower()
                for keyword, signal in pain_keywords.items():
                    if keyword in text_lower:
                        signals.add(signal)
        
        return list(signals)
    
    def _detect_praise_signals(self, reviews: List[Dict]) -> List[str]:
        """Detecta señales positivas en las reseñas."""
        praise_keywords = {
            "excelente": "Excelente servicio",
            "rápido": "Rapidez en atención",
            "amable": "Trato amable",
            "recomiendo": "Clientes que recomiendan",
            "volvería": "Alta intención de recompra",
            "calidad": "Buena calidad percibida",
            "profesional": "Profesionalismo",
            "puntual": "Puntualidad",
            "limpio": "Buena higiene/presentación"
        }
        
        signals = set()
        for review in reviews:
            if review.get("stars", 0) >= 4:
                text_lower = review.get("text", "").lower()
                for keyword, signal in praise_keywords.items():
                    if keyword in text_lower:
                        signals.add(signal)
        
        return list(signals)


if __name__ == "__main__":
    scraper = GoogleMapsScraper(headless=False)
    result = scraper.search_business("Starbucks", "Buenos Aires")
    print(result)
