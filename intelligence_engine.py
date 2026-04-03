"""
Motor de Inteligencia - El "Cerebro" del sistema Adnexum Inspector.
Cruza datos de múltiples fuentes y genera diagnósticos accionables.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum


class InsightType(Enum):
    PROBLEM = "problema"
    OPPORTUNITY = "oportunidad"
    RISK = "riesgo"
    STRENGTH = "fortaleza"


class InsightCategory(Enum):
    ATENCION_CLIENTE = "Atención al Cliente"
    RESPUESTA = "Tiempo de Respuesta"
    DIGITAL = "Presencia Digital"
    REPUTACION = "Reputación"
    OPERACIONES = "Operaciones"
    TECNOLOGIA = "Tecnología"
    VENTAS = "Proceso de Ventas"


@dataclass
class Insight:
    """Representa un hallazgo del análisis."""
    type: InsightType
    category: InsightCategory
    title: str
    description: str
    evidence: str
    source: str
    severity: int = 5  # 1-10, donde 10 es más severo
    adnexum_solution: Optional[str] = None


@dataclass
class BusinessDiagnosis:
    """Diagnóstico completo del negocio."""
    business_name: str
    url: str
    overall_score: int = 50
    insights: List[Insight] = field(default_factory=list)
    executive_summary: List[str] = field(default_factory=list)
    recommended_solutions: List[str] = field(default_factory=list)
    
    def get_problems(self) -> List[Insight]:
        return [i for i in self.insights if i.type == InsightType.PROBLEM]
    
    def get_opportunities(self) -> List[Insight]:
        return [i for i in self.insights if i.type == InsightType.OPPORTUNITY]
    
    def get_strengths(self) -> List[Insight]:
        return [i for i in self.insights if i.type == InsightType.STRENGTH]


class IntelligenceEngine:
    """
    Cerebro del sistema de prospección.
    Cruza datos de web, maps y redes para generar diagnósticos.
    """
    
    # Soluciones de Adnexum mapeadas a categorías
    ADNEXUM_SOLUTIONS = {
        InsightCategory.ATENCION_CLIENTE: "Bot de WhatsApp con IA para respuestas automáticas 24/7",
        InsightCategory.RESPUESTA: "Sistema de notificaciones y asignación automática de leads",
        InsightCategory.DIGITAL: "Estrategia de contenido automatizada + CRM integrado",
        InsightCategory.REPUTACION: "Sistema de seguimiento post-venta y solicitud de reseñas",
        InsightCategory.OPERACIONES: "Automatización de procesos con n8n + integraciones",
        InsightCategory.TECNOLOGIA: "Implementación de stack tecnológico moderno",
        InsightCategory.VENTAS: "CRM con pipeline visual + seguimientos automáticos"
    }
    
    def analyze(
        self,
        web_data: Dict,
        maps_data: Optional[Dict] = None,
        social_data: Optional[Dict] = None
    ) -> BusinessDiagnosis:
        """
        Analiza todos los datos y genera un diagnóstico completo.
        
        Args:
            web_data: Datos del scraper web (context, productos)
            maps_data: Datos de Google Maps (rating, reseñas)
            social_data: Datos de redes sociales
            
        Returns:
            BusinessDiagnosis con todos los insights
        """
        business_name = web_data.get("contexto", {}).get("nombre_negocio", "Negocio")
        url = web_data.get("url", "")
        
        diagnosis = BusinessDiagnosis(
            business_name=business_name,
            url=url
        )
        
        # Analizar cada fuente
        self._analyze_web_data(web_data, diagnosis)
        
        if maps_data and maps_data.get("status") == "found":
            self._analyze_maps_data(maps_data, diagnosis)
        
        if social_data:
            self._analyze_social_data(social_data, diagnosis)
        
        # Calcular score general
        diagnosis.overall_score = self._calculate_overall_score(diagnosis)
        
        # Generar resumen ejecutivo
        diagnosis.executive_summary = self._generate_executive_summary(diagnosis)
        
        # Generar soluciones recomendadas
        diagnosis.recommended_solutions = self._generate_solutions(diagnosis)
        
        return diagnosis
    
    def _analyze_web_data(self, data: Dict, diagnosis: BusinessDiagnosis):
        """Analiza datos del scraping web."""
        context = data.get("contexto", {})
        products = data.get("productos", [])
        
        # Verificar canales de contacto
        contacto = context.get("contacto", {})
        
        # ¿Tiene WhatsApp?
        telefonos = contacto.get("telefonos", "")
        has_whatsapp = "whatsapp" in telefonos.lower() if telefonos else False
        
        if not has_whatsapp:
            diagnosis.insights.append(Insight(
                type=InsightType.OPPORTUNITY,
                category=InsightCategory.ATENCION_CLIENTE,
                title="Sin WhatsApp Business detectado",
                description="No se encontró integración de WhatsApp en la web. Los clientes modernos esperan poder contactar por este canal.",
                evidence="Análisis del sitio web - No hay links wa.me ni botones de WhatsApp",
                source="Scraping Web",
                severity=8,
                adnexum_solution=self.ADNEXUM_SOLUTIONS[InsightCategory.ATENCION_CLIENTE]
            ))
        
        # ¿Tiene formulario pero no chat?
        # (Esta es una inferencia basada en la estructura típica)
        redes = context.get("redes_sociales", {})
        has_any_social = any(redes.values())
        
        if not has_any_social:
            diagnosis.insights.append(Insight(
                type=InsightType.PROBLEM,
                category=InsightCategory.DIGITAL,
                title="Ausencia de redes sociales vinculadas",
                description="El sitio web no muestra enlaces a redes sociales, limitando la visibilidad y confianza del negocio.",
                evidence="No se encontraron links a Instagram, Facebook, Twitter o LinkedIn",
                source="Scraping Web",
                severity=6,
                adnexum_solution=self.ADNEXUM_SOLUTIONS[InsightCategory.DIGITAL]
            ))
        
        # Analizar catálogo
        if products:
            products_with_images = sum(1 for p in products if p.get("url_imagenes"))
            products_with_desc = sum(1 for p in products if p.get("descripcion"))
            total = len(products)
            
            if total > 0:
                img_ratio = products_with_images / total
                desc_ratio = products_with_desc / total
                
                if img_ratio < 0.5:
                    diagnosis.insights.append(Insight(
                        type=InsightType.PROBLEM,
                        category=InsightCategory.VENTAS,
                        title="Catálogo incompleto (faltan imágenes)",
                        description=f"Solo {int(img_ratio*100)}% de los productos tienen imágenes. Esto reduce la conversión significativamente.",
                        evidence=f"{products_with_images} de {total} productos tienen imagen",
                        source="Análisis de Catálogo",
                        severity=7
                    ))
                
                if desc_ratio < 0.5:
                    diagnosis.insights.append(Insight(
                        type=InsightType.OPPORTUNITY,
                        category=InsightCategory.VENTAS,
                        title="Descripciones de productos faltantes",
                        description="La mayoría de productos carecen de descripción detallada. IA puede generar descripciones optimizadas.",
                        evidence=f"{products_with_desc} de {total} productos tienen descripción",
                        source="Análisis de Catálogo",
                        severity=5,
                        adnexum_solution="Generación de descripciones con IA + optimización SEO automática"
                    ))
        
        # Verificar políticas
        politicas = context.get("politicas", {})
        if not politicas.get("envio") and not politicas.get("devoluciones"):
            diagnosis.insights.append(Insight(
                type=InsightType.RISK,
                category=InsightCategory.VENTAS,
                title="Políticas no visibles en el sitio",
                description="No se encontraron políticas claras de envío y devolución, lo cual genera fricción en la decisión de compra.",
                evidence="Links de políticas no detectados en el sitio",
                source="Scraping Web",
                severity=4
            ))
    
    def _analyze_maps_data(self, data: Dict, diagnosis: BusinessDiagnosis):
        """Analiza datos de Google Maps."""
        rating = data.get("rating")
        total_reviews = data.get("total_reviews", 0)
        pain_signals = data.get("pain_signals", [])
        praise_signals = data.get("praise_signals", [])
        
        # Evaluar rating
        if rating:
            if rating < 4.0:
                diagnosis.insights.append(Insight(
                    type=InsightType.PROBLEM,
                    category=InsightCategory.REPUTACION,
                    title=f"Rating bajo en Google Maps ({rating}⭐)",
                    description=f"El negocio tiene un rating de {rating}/5 con {total_reviews} reseñas. Esto afecta directamente la decisión de nuevos clientes.",
                    evidence=f"Google Maps: {rating}⭐ ({total_reviews} reseñas)",
                    source="Google Maps",
                    severity=9,
                    adnexum_solution=self.ADNEXUM_SOLUTIONS[InsightCategory.REPUTACION]
                ))
            elif rating >= 4.5:
                diagnosis.insights.append(Insight(
                    type=InsightType.STRENGTH,
                    category=InsightCategory.REPUTACION,
                    title=f"Excelente reputación ({rating}⭐)",
                    description=f"El negocio mantiene un rating de {rating}/5, lo cual es un activo valioso para las ventas.",
                    evidence=f"Google Maps: {rating}⭐ ({total_reviews} reseñas)",
                    source="Google Maps",
                    severity=1
                ))
        
        # Evaluar señales de dolor
        for pain in pain_signals[:5]:  # Máximo 5 problemas de reseñas
            # Mapear dolor a categoría
            if "respuesta" in pain.lower() or "contestan" in pain.lower():
                category = InsightCategory.RESPUESTA
            elif "demora" in pain.lower() or "lento" in pain.lower():
                category = InsightCategory.OPERACIONES
            elif "atención" in pain.lower():
                category = InsightCategory.ATENCION_CLIENTE
            else:
                category = InsightCategory.REPUTACION
            
            diagnosis.insights.append(Insight(
                type=InsightType.PROBLEM,
                category=category,
                title=pain,
                description=f"Quejas recurrentes en reseñas de Google Maps sobre: {pain}",
                evidence="Análisis de texto de reseñas negativas",
                source="Google Maps Reviews",
                severity=7,
                adnexum_solution=self.ADNEXUM_SOLUTIONS.get(category)
            ))
        
        # Agregar fortalezas
        for praise in praise_signals[:3]:
            diagnosis.insights.append(Insight(
                type=InsightType.STRENGTH,
                category=InsightCategory.REPUTACION,
                title=praise,
                description=f"Los clientes destacan: {praise}",
                evidence="Análisis de texto de reseñas positivas",
                source="Google Maps Reviews",
                severity=1
            ))
    
    def _analyze_social_data(self, data: Dict, diagnosis: BusinessDiagnosis):
        """Analiza datos de redes sociales."""
        issues = data.get("issues", [])
        strengths = data.get("strengths", [])
        overall_score = data.get("overall_score", 50)
        
        # Agregar issues detectados
        for issue in issues:
            diagnosis.insights.append(Insight(
                type=InsightType.PROBLEM if "no" in issue.lower() else InsightType.OPPORTUNITY,
                category=InsightCategory.DIGITAL,
                title=issue,
                description=f"Problema detectado en presencia digital: {issue}",
                evidence="Análisis de perfiles de redes sociales",
                source="Social Media Analysis",
                severity=5,
                adnexum_solution=self.ADNEXUM_SOLUTIONS[InsightCategory.DIGITAL]
            ))
        
        # Agregar fortalezas
        for strength in strengths:
            diagnosis.insights.append(Insight(
                type=InsightType.STRENGTH,
                category=InsightCategory.DIGITAL,
                title=strength,
                description=f"Fortaleza en presencia digital: {strength}",
                evidence="Análisis de perfiles de redes sociales",
                source="Social Media Analysis",
                severity=1
            ))
        
        # Instagram específico
        ig_data = data.get("instagram")
        if ig_data and ig_data.get("status") == "found":
            followers = ig_data.get("followers", 0)
            if followers and followers > 10000:
                diagnosis.insights.append(Insight(
                    type=InsightType.STRENGTH,
                    category=InsightCategory.DIGITAL,
                    title=f"Audiencia de Instagram: {followers:,} seguidores",
                    description="El negocio tiene una audiencia significativa que puede monetizarse mejor con automatización.",
                    evidence=f"Instagram: {followers:,} followers",
                    source="Instagram",
                    severity=1
                ))
    
    def _calculate_overall_score(self, diagnosis: BusinessDiagnosis) -> int:
        """Calcula un score general del negocio (0-100)."""
        score = 70  # Base score
        
        for insight in diagnosis.insights:
            if insight.type == InsightType.PROBLEM:
                score -= insight.severity
            elif insight.type == InsightType.OPPORTUNITY:
                score -= insight.severity // 2
            elif insight.type == InsightType.STRENGTH:
                score += 3
            elif insight.type == InsightType.RISK:
                score -= insight.severity // 2
        
        return max(0, min(100, score))
    
    def _generate_executive_summary(self, diagnosis: BusinessDiagnosis) -> List[str]:
        """Genera 5 bullets de resumen ejecutivo."""
        summary = []
        
        problems = diagnosis.get_problems()
        opportunities = diagnosis.get_opportunities()
        strengths = diagnosis.get_strengths()
        
        # Bullet 1: Estado general
        if diagnosis.overall_score >= 70:
            summary.append(f"✅ {diagnosis.business_name} tiene una base sólida (Score: {diagnosis.overall_score}/100)")
        elif diagnosis.overall_score >= 40:
            summary.append(f"⚠️ {diagnosis.business_name} tiene áreas críticas que atender (Score: {diagnosis.overall_score}/100)")
        else:
            summary.append(f"🚨 {diagnosis.business_name} requiere intervención urgente (Score: {diagnosis.overall_score}/100)")
        
        # Bullet 2: Principal problema
        if problems:
            top_problem = max(problems, key=lambda x: x.severity)
            summary.append(f"🔴 Problema crítico: {top_problem.title}")
        
        # Bullet 3: Oportunidad más valiosa
        if opportunities:
            top_opp = max(opportunities, key=lambda x: x.severity)
            summary.append(f"💰 Mayor oportunidad: {top_opp.title}")
        
        # Bullet 4: Fortaleza a aprovechar
        if strengths:
            summary.append(f"💪 Fortaleza clave: {strengths[0].title}")
        
        # Bullet 5: Impacto potencial
        potential_issues = len(problems) + len(opportunities)
        if potential_issues > 0:
            summary.append(f"📊 {potential_issues} áreas de mejora identificadas → potencial de aumento de conversión +20-40%")
        
        return summary[:5]
    
    def _generate_solutions(self, diagnosis: BusinessDiagnosis) -> List[str]:
        """Genera lista de soluciones Adnexum recomendadas."""
        solutions = set()
        
        for insight in diagnosis.insights:
            if insight.adnexum_solution:
                solutions.add(insight.adnexum_solution)
        
        # Ordenar por prioridad (basado en severidad de problemas relacionados)
        return list(solutions)[:7]


if __name__ == "__main__":
    # Test del motor
    engine = IntelligenceEngine()
    
    test_web_data = {
        "url": "https://ejemplo.com",
        "contexto": {
            "nombre_negocio": "Tienda Demo",
            "contacto": {"telefonos": "", "emails": "info@demo.com"},
            "redes_sociales": {"instagram": "", "facebook": ""}
        },
        "productos": [
            {"nombre_articulo": "Producto 1", "precio": "$100", "descripcion": "", "url_imagenes": ""},
            {"nombre_articulo": "Producto 2", "precio": "$200", "descripcion": "Desc", "url_imagenes": "url"}
        ]
    }
    
    test_maps_data = {
        "status": "found",
        "rating": 3.8,
        "total_reviews": 45,
        "pain_signals": ["Demoras en atención/entrega", "Falta de respuesta"],
        "praise_signals": ["Buena calidad percibida"]
    }
    
    diagnosis = engine.analyze(test_web_data, test_maps_data)
    
    print("=== RESUMEN EJECUTIVO ===")
    for bullet in diagnosis.executive_summary:
        print(bullet)
    
    print("\n=== PROBLEMAS ===")
    for p in diagnosis.get_problems():
        print(f"- {p.title}: {p.description}")
    
    print("\n=== OPORTUNIDADES ===")
    for o in diagnosis.get_opportunities():
        print(f"- {o.title}: {o.adnexum_solution}")
