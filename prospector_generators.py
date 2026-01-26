"""
Generadores de Entregables para Adnexum Inspector.
Crea informes vendibles, guiones Loom y preguntas para llamadas.
"""

import os
from datetime import datetime
from typing import Dict, List
from intelligence_engine import BusinessDiagnosis, InsightType


class ReportGenerator:
    """Genera informes vendibles en formato Markdown."""
    
    def generate_report(self, diagnosis: BusinessDiagnosis, output_path: str) -> str:
        """
        Genera un informe vendible completo.
        
        Args:
            diagnosis: Diagnóstico del negocio
            output_path: Ruta para guardar el archivo
            
        Returns:
            Contenido del informe
        """
        lines = []
        
        # Header
        lines.append(f"# 📊 Informe de Diagnóstico: {diagnosis.business_name}")
        lines.append("")
        lines.append(f"**URL:** {diagnosis.url}")
        lines.append(f"**Fecha:** {datetime.now().strftime('%d/%m/%Y %H:%M')}")
        lines.append(f"**Score General:** {diagnosis.overall_score}/100")
        lines.append("")
        lines.append("---")
        lines.append("")
        
        # Resumen Ejecutivo
        lines.append("## 🎯 Resumen Ejecutivo")
        lines.append("")
        for bullet in diagnosis.executive_summary:
            lines.append(f"- {bullet}")
        lines.append("")
        
        # Problemas Detectados
        problems = diagnosis.get_problems()
        if problems:
            lines.append("## 🔴 Problemas Detectados")
            lines.append("")
            for i, p in enumerate(problems[:5], 1):
                lines.append(f"### {i}. {p.title}")
                lines.append("")
                lines.append(f"**Descripción:** {p.description}")
                lines.append("")
                lines.append(f"**Evidencia:** {p.evidence}")
                lines.append("")
                lines.append(f"**Fuente:** {p.source}")
                lines.append("")
                if p.adnexum_solution:
                    lines.append(f"**💡 Solución Adnexum:** {p.adnexum_solution}")
                    lines.append("")
                lines.append("---")
                lines.append("")
        
        # Oportunidades
        opportunities = diagnosis.get_opportunities()
        if opportunities:
            lines.append("## 💰 Oportunidades Identificadas")
            lines.append("")
            for i, o in enumerate(opportunities[:7], 1):
                lines.append(f"### {i}. {o.title}")
                lines.append("")
                lines.append(f"**Descripción:** {o.description}")
                lines.append("")
                if o.adnexum_solution:
                    lines.append(f"**💡 Cómo Adnexum lo resuelve:** {o.adnexum_solution}")
                    lines.append("")
        
        # Fortalezas
        strengths = diagnosis.get_strengths()
        if strengths:
            lines.append("## 💪 Fortalezas del Negocio")
            lines.append("")
            for s in strengths[:5]:
                lines.append(f"- **{s.title}:** {s.description}")
            lines.append("")
        
        # Plan de Implementación
        lines.append("## 🚀 Plan de Implementación Sugerido")
        lines.append("")
        lines.append("### Fase 1: Quick Wins (Semana 1-2)")
        solutions = diagnosis.recommended_solutions[:3]
        for sol in solutions:
            lines.append(f"- [ ] {sol}")
        lines.append("")
        lines.append("### Fase 2: Consolidación (Semana 3-4)")
        if len(diagnosis.recommended_solutions) > 3:
            for sol in diagnosis.recommended_solutions[3:5]:
                lines.append(f"- [ ] {sol}")
        lines.append("")
        lines.append("### Fase 3: Optimización (Mes 2)")
        lines.append("- [ ] Análisis de métricas y ajustes")
        lines.append("- [ ] Expansión de automatizaciones")
        lines.append("")
        
        # Limitaciones
        lines.append("## ⚠️ Limitaciones del Análisis")
        lines.append("")
        lines.append("- Este análisis se basa en información pública disponible")
        lines.append("- Algunos datos requieren confirmación directa con el cliente")
        lines.append("- Las cifras de impacto son estimaciones basadas en benchmarks de la industria")
        lines.append("")
        
        # Footer
        lines.append("---")
        lines.append("")
        lines.append("*Informe generado por Adnexum Inspector*")
        lines.append("")
        lines.append("**¿Listo para implementar estas mejoras?** Agenda una llamada: [link]")
        
        content = "\n".join(lines)
        
        # Guardar archivo
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)
        
        return content


class LoomScriptGenerator:
    """Genera guiones de Loom de 60-90 segundos."""
    
    def generate_script(self, diagnosis: BusinessDiagnosis, output_path: str) -> str:
        """
        Genera un guion personalizado para grabar un Loom.
        
        Estructura: Gancho → Problema → Costo → Solución → CTA
        
        Args:
            diagnosis: Diagnóstico del negocio
            output_path: Ruta para guardar el archivo
            
        Returns:
            Guion completo
        """
        lines = []
        
        # Obtener el problema más crítico
        problems = diagnosis.get_problems()
        top_problem = problems[0] if problems else None
        
        # Obtener la oportunidad más valiosa
        opportunities = diagnosis.get_opportunities()
        top_opportunity = opportunities[0] if opportunities else None
        
        lines.append(f"# 🎬 GUION LOOM - {diagnosis.business_name}")
        lines.append("")
        lines.append("**Duración objetivo:** 60-90 segundos")
        lines.append("")
        lines.append("---")
        lines.append("")
        
        # Sección 1: Gancho (10 segundos)
        lines.append("## 🎯 GANCHO (0:00 - 0:10)")
        lines.append("")
        lines.append("*[Mostrar pantalla con el sitio web del prospecto]*")
        lines.append("")
        lines.append(f'"Hola, soy Tomás de Adnexum. Estuve analizando {diagnosis.business_name} y encontré algo que creo que te va a interesar..."')
        lines.append("")
        
        # Sección 2: Problema (20 segundos)
        lines.append("## 🔴 PROBLEMA (0:10 - 0:30)")
        lines.append("")
        if top_problem:
            lines.append(f"*[Mostrar evidencia: {top_problem.source}]*")
            lines.append("")
            lines.append(f'"Vi que {top_problem.description.lower()}"')
            lines.append("")
            lines.append(f'"La evidencia: {top_problem.evidence}"')
        else:
            lines.append('"Noté que hay algunas áreas donde podrían estar perdiendo clientes o ventas..."')
        lines.append("")
        
        # Sección 3: Costo / Agitación (15 segundos)
        lines.append("## 💸 COSTO (0:30 - 0:45)")
        lines.append("")
        lines.append("*[Hablar mirando a cámara]*")
        lines.append("")
        if top_problem and "respuesta" in top_problem.title.lower():
            lines.append('"Esto probablemente significa que cada día están perdiendo consultas que nunca se responden. Y cada consulta perdida es una venta que se va a la competencia."')
        elif top_problem and "reputación" in top_problem.category.value.lower():
            lines.append('"Un rating por debajo de 4.5 hace que los nuevos clientes duden antes de comprar. Literalmente estás perdiendo ventas antes de que lleguen a tu puerta."')
        else:
            lines.append('"Cada punto de fricción en el proceso significa clientes que abandonan, ventas perdidas, y dinero que debería estar entrando pero no lo hace."')
        lines.append("")
        
        # Sección 4: Solución (20 segundos)
        lines.append("## 💡 SOLUCIÓN (0:45 - 1:05)")
        lines.append("")
        lines.append("*[Mostrar diagrama simple o demo si la tienes]*")
        lines.append("")
        if top_problem and top_problem.adnexum_solution:
            lines.append(f'"Lo bueno es que esto se puede arreglar. En Adnexum, lo que hacemos es implementar {top_problem.adnexum_solution.lower()}."')
        else:
            lines.append('"Lo bueno es que esto se puede arreglar con automatización inteligente. En Adnexum implementamos sistemas que responden automáticamente, califican leads y hacen seguimiento sin que tengas que estar encima."')
        lines.append("")
        lines.append('"La mayoría de nuestros clientes ven resultados en las primeras 2 semanas."')
        lines.append("")
        
        # Sección 5: CTA (15 segundos)
        lines.append("## 📞 LLAMADO A LA ACCIÓN (1:05 - 1:20)")
        lines.append("")
        lines.append("*[Mirar a cámara, tono amigable]*")
        lines.append("")
        lines.append('"¿Te gustaría ver cómo funcionaría esto específicamente para tu negocio? Te propongo una llamada corta de 15 minutos donde te muestro exactamente qué haría y cuánto costaría."')
        lines.append("")
        lines.append('"Abajo te dejo el link para agendar. Espero tu mensaje. ¡Éxitos!"')
        lines.append("")
        
        lines.append("---")
        lines.append("")
        lines.append("## 📝 NOTAS PARA LA GRABACIÓN")
        lines.append("")
        lines.append("- Tono: Profesional pero cercano, como si hablaras con un amigo que tiene un negocio")
        lines.append("- Velocidad: Normal, no apurado")
        lines.append("- Personalización: Mencionar el nombre del negocio al menos 2 veces")
        lines.append("- Pantalla: Alternar entre web del cliente y cámara")
        lines.append(f"- Score del negocio: {diagnosis.overall_score}/100 (usar como referencia, no mencionar)")
        
        content = "\n".join(lines)
        
        # Guardar archivo
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)
        
        return content


class CallQuestionsGenerator:
    """Genera preguntas para la llamada de discovery."""
    
    def generate_questions(self, diagnosis: BusinessDiagnosis, output_path: str) -> str:
        """
        Genera 10-12 preguntas personalizadas para la llamada.
        
        Args:
            diagnosis: Diagnóstico del negocio
            output_path: Ruta para guardar el archivo
            
        Returns:
            Lista de preguntas
        """
        lines = []
        
        lines.append(f"# 📞 Preguntas para Llamada - {diagnosis.business_name}")
        lines.append("")
        lines.append(f"**Fecha de análisis:** {datetime.now().strftime('%d/%m/%Y')}")
        lines.append(f"**Score previo:** {diagnosis.overall_score}/100")
        lines.append("")
        lines.append("---")
        lines.append("")
        
        # Sección 1: Contexto General
        lines.append("## 1️⃣ CONTEXTO DEL NEGOCIO")
        lines.append("")
        lines.append("1. **¿Cuál es tu rol en el negocio?** *(Dueño, gerente, marketing)*")
        lines.append("")
        lines.append("2. **¿Aproximadamente cuántas consultas/leads reciben por semana?**")
        lines.append("   - *Contexto: Esto me ayuda a dimensionar el volumen*")
        lines.append("")
        lines.append("3. **¿Por qué canales llegan la mayoría de esas consultas?**")
        lines.append("   - WhatsApp, Instagram DM, Web, Teléfono, etc.")
        lines.append("")
        
        # Sección 2: Preguntas basadas en problemas detectados
        lines.append("## 2️⃣ VALIDACIÓN DE PROBLEMAS DETECTADOS")
        lines.append("")
        
        problems = diagnosis.get_problems()
        question_num = 4
        
        for problem in problems[:3]:
            if "respuesta" in problem.title.lower() or "respuesta" in problem.category.value.lower():
                lines.append(f"{question_num}. **Vi que algunos clientes mencionan tiempos de respuesta. ¿Cuánto tardan actualmente en responder una consulta nueva?**")
                lines.append("   - *Buscar: < 5 min = ok, > 1 hora = problema, > 24h = crítico*")
            elif "reputación" in problem.category.value.lower() or "rating" in problem.title.lower():
                lines.append(f"{question_num}. **Noté el rating en Google Maps. ¿Tienen algún proceso para pedir reseñas a clientes satisfechos?**")
                lines.append("   - *Buscar: Si no tienen proceso, es oportunidad directa*")
            elif "whatsapp" in problem.title.lower():
                lines.append(f"{question_num}. **¿Tienen WhatsApp Business o un número dedicado para atención?**")
                lines.append("   - *Si es personal = problema, si no tienen = oportunidad*")
            elif "digital" in problem.category.value.lower():
                lines.append(f"{question_num}. **¿Quién maneja las redes sociales actualmente? ¿Cuánto tiempo le dedican?**")
                lines.append("   - *Buscar: Si es el dueño y tiene poco tiempo = dolor*")
            else:
                lines.append(f"{question_num}. **Sobre [{problem.title}]: ¿Cómo manejan esto actualmente?**")
                lines.append(f"   - *Evidencia encontrada: {problem.evidence}*")
            lines.append("")
            question_num += 1
        
        # Sección 3: Preguntas de dolor/impacto
        lines.append("## 3️⃣ CUANTIFICACIÓN DEL DOLOR")
        lines.append("")
        lines.append(f"{question_num}. **Si tuvieras que estimar, ¿cuántas consultas crees que se pierden por mes sin respuesta o con respuesta tardía?**")
        lines.append("   - *Objetivo: Que el prospecto ponga un número*")
        lines.append("")
        question_num += 1
        
        lines.append(f"{question_num}. **¿Cuánto vale en promedio una venta para ustedes?**")
        lines.append("   - *Objetivo: Calcular costo de leads perdidos*")
        lines.append("")
        question_num += 1
        
        lines.append(f"{question_num}. **¿Alguna vez perdieron un cliente por no responder a tiempo o por un error de comunicación?**")
        lines.append("   - *Objetivo: Historia emocional para usar en el cierre*")
        lines.append("")
        question_num += 1
        
        # Sección 4: Preguntas de proceso actual
        lines.append("## 4️⃣ PROCESO ACTUAL")
        lines.append("")
        lines.append(f"{question_num}. **¿Usan algún CRM o sistema para organizar las conversaciones y seguimientos?**")
        lines.append("   - *Si usan: ¿Cuál? ¿Están contentos?*")
        lines.append("   - *Si no: ¿Cómo hacen seguimiento? (Excel, memoria, nada)*")
        lines.append("")
        question_num += 1
        
        lines.append(f"{question_num}. **¿Tienen algún proceso de seguimiento para clientes que consultan pero no compran?**")
        lines.append("   - *Si no: Oportunidad de recuperación*")
        lines.append("")
        question_num += 1
        
        # Sección 5: Cierre
        lines.append("## 5️⃣ VALIDACIÓN DE INTERÉS")
        lines.append("")
        lines.append(f"{question_num}. **Si pudiéramos automatizar [PROBLEMA MÁS GRANDE que mencionaron], ¿qué impacto crees que tendría en el negocio?**")
        lines.append("   - *Objetivo: Que el prospecto verbalice el beneficio*")
        lines.append("")
        question_num += 1
        
        lines.append(f"{question_num}. **¿Qué intentaste antes para resolver esto? ¿Por qué no funcionó?**")
        lines.append("   - *Objetivo: Entender objeciones previas y diferenciarnos*")
        lines.append("")
        
        lines.append("---")
        lines.append("")
        lines.append("## 📊 DATOS CLAVE A CONFIRMAR")
        lines.append("")
        lines.append("| Métrica | Valor Estimado | Confirmado |")
        lines.append("|---------|----------------|------------|")
        lines.append("| Consultas/semana | _____ | [ ] |")
        lines.append("| Valor promedio venta | $_____ | [ ] |")
        lines.append("| Tiempo de respuesta | _____ | [ ] |")
        lines.append("| Leads perdidos/mes | _____ | [ ] |")
        lines.append("| Equipo de atención | _____ personas | [ ] |")
        lines.append("")
        lines.append("## 💡 FÓRMULA PARA DIMENSIONAR")
        lines.append("")
        lines.append("```")
        lines.append("Leads perdidos × Valor promedio × Tasa conversión esperada = Dinero perdido")
        lines.append("")
        lines.append("Ejemplo: 20 leads × $500 × 30% = $3,000/mes perdidos")
        lines.append("```")
        
        content = "\n".join(lines)
        
        # Guardar archivo
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)
        
        return content


if __name__ == "__main__":
    from intelligence_engine import IntelligenceEngine, Insight, InsightType, InsightCategory
    
    # Test rápido
    diagnosis = BusinessDiagnosis(
        business_name="Demo Store",
        url="https://demo.com",
        overall_score=55
    )
    diagnosis.insights = [
        Insight(
            type=InsightType.PROBLEM,
            category=InsightCategory.RESPUESTA,
            title="Tiempo de respuesta lento",
            description="Los clientes reportan demoras en la atención",
            evidence="Reseñas en Google Maps",
            source="Google Maps",
            severity=8,
            adnexum_solution="Bot de WhatsApp con respuesta automática"
        ),
        Insight(
            type=InsightType.OPPORTUNITY,
            category=InsightCategory.ATENCION_CLIENTE,
            title="Sin WhatsApp detectado",
            description="No hay integración de WhatsApp en el sitio",
            evidence="Análisis web",
            source="Web Scraping",
            severity=7,
            adnexum_solution="Implementación de WhatsApp Business API"
        )
    ]
    diagnosis.executive_summary = [
        "Score: 55/100",
        "Problema: Demoras",
        "Oportunidad: WhatsApp"
    ]
    diagnosis.recommended_solutions = ["Bot WhatsApp", "CRM", "Seguimientos"]
    
    # Generar entregables
    report_gen = ReportGenerator()
    report_gen.generate_report(diagnosis, "./test_output/informe.md")
    
    loom_gen = LoomScriptGenerator()
    loom_gen.generate_script(diagnosis, "./test_output/guion_loom.md")
    
    questions_gen = CallQuestionsGenerator()
    questions_gen.generate_questions(diagnosis, "./test_output/preguntas.md")
    
    print("Entregables generados en ./test_output/")
