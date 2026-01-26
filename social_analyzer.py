"""
Analizador de presencia en redes sociales.
Extrae métricas públicas de Instagram y Facebook.
"""

import re
from typing import Dict, Optional
from playwright.sync_api import sync_playwright, Page
from urllib.parse import urlparse


class SocialAnalyzer:
    """Analiza la presencia digital de un negocio en redes sociales."""
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.timeout = 15000
    
    def analyze_social_presence(self, social_links: Dict[str, str]) -> Dict:
        """
        Analiza todos los perfiles sociales proporcionados.
        
        Args:
            social_links: Dict con claves 'instagram', 'facebook', 'twitter', 'linkedin'
            
        Returns:
            Dict con análisis de cada plataforma
        """
        result = {
            "instagram": None,
            "facebook": None,
            "overall_score": 0,
            "issues": [],
            "strengths": []
        }
        
        if social_links.get("instagram"):
            result["instagram"] = self._analyze_instagram(social_links["instagram"])
        
        if social_links.get("facebook"):
            result["facebook"] = self._analyze_facebook(social_links["facebook"])
        
        # Calcular score general y detectar problemas
        result["overall_score"], result["issues"], result["strengths"] = self._calculate_score(result)
        
        return result
    
    def _analyze_instagram(self, url: str) -> Dict:
        """Analiza un perfil público de Instagram."""
        data = {
            "url": url,
            "status": "not_found",
            "followers": None,
            "following": None,
            "posts_count": None,
            "bio": "",
            "is_business": False,
            "last_post_date": None,
            "engagement_signals": []
        }
        
        # Limpiar URL
        if not url.startswith("http"):
            url = "https://www.instagram.com/" + url.replace("@", "")
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=self.headless)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            page = context.new_page()
            
            try:
                page.goto(url, wait_until="networkidle", timeout=self.timeout)
                page.wait_for_timeout(2000)
                
                # Verificar si el perfil existe y es público
                if self._is_instagram_valid(page):
                    data["status"] = "found"
                    
                    # Extraer métricas del header
                    metrics = self._extract_instagram_metrics(page)
                    data.update(metrics)
                    
                    # Extraer bio
                    data["bio"] = self._extract_instagram_bio(page)
                    
                    # Detectar si es cuenta business
                    data["is_business"] = self._is_instagram_business(page)
                    
                else:
                    data["status"] = "private_or_not_found"
                    
            except Exception as e:
                data["status"] = "error"
                data["error"] = str(e)
            
            finally:
                browser.close()
        
        return data
    
    def _is_instagram_valid(self, page: Page) -> bool:
        """Verifica si el perfil de Instagram es válido y público."""
        try:
            # Buscar indicadores de perfil válido
            if page.query_selector('article') or page.query_selector('[role="tablist"]'):
                return True
            # Verificar si no es privado
            private_text = page.query_selector('h2:has-text("Esta cuenta es privada")')
            if private_text:
                return False
            return page.query_selector('header section') is not None
        except:
            return False
    
    def _extract_instagram_metrics(self, page: Page) -> Dict:
        """Extrae seguidores, seguidos y posts de Instagram."""
        metrics = {
            "followers": None,
            "following": None,
            "posts_count": None
        }
        
        try:
            # Buscar los contadores en el header
            stats = page.query_selector_all('header section ul li')
            
            for stat in stats:
                text = stat.inner_text().lower()
                number = self._parse_social_number(text)
                
                if "publicacion" in text or "post" in text:
                    metrics["posts_count"] = number
                elif "seguidor" in text or "follower" in text:
                    metrics["followers"] = number
                elif "seguido" in text or "following" in text:
                    metrics["following"] = number
                    
        except:
            pass
        
        return metrics
    
    def _extract_instagram_bio(self, page: Page) -> str:
        """Extrae la biografía del perfil."""
        try:
            bio_elem = page.query_selector('header section > div:nth-child(3)')
            if bio_elem:
                return bio_elem.inner_text().strip()[:300]
        except:
            pass
        return ""
    
    def _is_instagram_business(self, page: Page) -> bool:
        """Detecta si es una cuenta de negocio."""
        try:
            # Buscar botones de contacto o categoría de negocio
            contact_btn = page.query_selector('[href*="mailto:"], [href*="tel:"], button:has-text("Contactar")')
            category = page.query_selector('header a[href*="/explore/locations/"]')
            return contact_btn is not None or category is not None
        except:
            return False
    
    def _analyze_facebook(self, url: str) -> Dict:
        """Analiza una página pública de Facebook."""
        data = {
            "url": url,
            "status": "not_found",
            "page_name": "",
            "likes": None,
            "followers": None,
            "category": "",
            "about": "",
            "is_verified": False,
            "response_rate": None
        }
        
        if not url.startswith("http"):
            url = "https://www.facebook.com/" + url
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=self.headless)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            page = context.new_page()
            
            try:
                page.goto(url, wait_until="networkidle", timeout=self.timeout)
                page.wait_for_timeout(2000)
                
                # Verificar si la página existe
                if self._is_facebook_valid(page):
                    data["status"] = "found"
                    
                    # Extraer nombre
                    name_elem = page.query_selector('h1')
                    if name_elem:
                        data["page_name"] = name_elem.inner_text().strip()
                    
                    # Extraer likes/followers
                    data.update(self._extract_facebook_metrics(page))
                    
                    # Verificar badge
                    verified = page.query_selector('[aria-label*="verificado"], [aria-label*="verified"]')
                    data["is_verified"] = verified is not None
                    
            except Exception as e:
                data["status"] = "error"
                data["error"] = str(e)
            
            finally:
                browser.close()
        
        return data
    
    def _is_facebook_valid(self, page: Page) -> bool:
        """Verifica si la página de Facebook es válida."""
        try:
            # Buscar indicadores de página válida
            return page.query_selector('h1') is not None and \
                   page.query_selector('[role="main"]') is not None
        except:
            return False
    
    def _extract_facebook_metrics(self, page: Page) -> Dict:
        """Extrae métricas de la página de Facebook."""
        metrics = {"likes": None, "followers": None}
        
        try:
            # Buscar texto con likes/seguidores
            text_content = page.inner_text('body')
            
            # Patrón para likes
            likes_match = re.search(r'(\d+[.,]?\d*)\s*(?:me gusta|likes)', text_content, re.IGNORECASE)
            if likes_match:
                metrics["likes"] = self._parse_social_number(likes_match.group(1))
            
            # Patrón para seguidores
            followers_match = re.search(r'(\d+[.,]?\d*)\s*(?:seguidores|followers)', text_content, re.IGNORECASE)
            if followers_match:
                metrics["followers"] = self._parse_social_number(followers_match.group(1))
                
        except:
            pass
        
        return metrics
    
    def _parse_social_number(self, text: str) -> Optional[int]:
        """Parsea números de redes sociales (ej: 1.5K, 2M, 1,234)."""
        try:
            text = text.strip().upper()
            
            # Buscar número con sufijo
            match = re.search(r'([\d.,]+)\s*([KMB])?', text)
            if match:
                num_str = match.group(1).replace(",", "").replace(".", "")
                number = float(num_str) if "." in match.group(1) else int(num_str)
                
                suffix = match.group(2)
                if suffix == "K":
                    number *= 1000
                elif suffix == "M":
                    number *= 1000000
                elif suffix == "B":
                    number *= 1000000000
                
                return int(number)
        except:
            pass
        return None
    
    def _calculate_score(self, data: Dict) -> tuple:
        """Calcula score general y detecta issues/strengths."""
        score = 50  # Base score
        issues = []
        strengths = []
        
        # Evaluar Instagram
        ig = data.get("instagram")
        if ig:
            if ig["status"] == "found":
                if ig.get("followers"):
                    if ig["followers"] > 10000:
                        score += 20
                        strengths.append("Buena audiencia en Instagram (+10K)")
                    elif ig["followers"] > 1000:
                        score += 10
                        strengths.append("Audiencia moderada en Instagram")
                    else:
                        score += 5
                
                if ig.get("posts_count") and ig["posts_count"] < 10:
                    issues.append("Poca actividad en Instagram (< 10 posts)")
                    score -= 10
            elif ig["status"] == "private_or_not_found":
                issues.append("Instagram privado o no encontrado")
                score -= 5
        else:
            issues.append("Sin presencia en Instagram detectada")
            score -= 10
        
        # Evaluar Facebook
        fb = data.get("facebook")
        if fb:
            if fb["status"] == "found":
                if fb.get("followers") and fb["followers"] > 5000:
                    score += 15
                    strengths.append("Comunidad activa en Facebook")
                if fb.get("is_verified"):
                    score += 10
                    strengths.append("Página de Facebook verificada")
            else:
                issues.append("Página de Facebook no accesible")
                score -= 5
        else:
            issues.append("Sin presencia en Facebook detectada")
            score -= 10
        
        # Limitar score entre 0 y 100
        score = max(0, min(100, score))
        
        return score, issues, strengths


if __name__ == "__main__":
    analyzer = SocialAnalyzer(headless=False)
    result = analyzer.analyze_social_presence({
        "instagram": "starbucks",
        "facebook": "starbucks"
    })
    print(result)
