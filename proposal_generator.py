"""
Generador de Propuestas Comerciales Tangibles.
Toma los insights de NotebookLM (o del análisis local) y genera un documento listo para presentar.
"""

import os
from typing import Dict, List

class ProposalGenerator:
    """Crea documentos de propuesta personalizados."""
    
    def __init__(self, output_dir: str = "./propuestas"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    def generate_tangible_proposal(self, business_name: str, insights: Dict, output_filename: str) -> str:
        """
        Genera un Markdown profesional con la propuesta de valor.
        """
        md = f"# 🚀 Propuesta de Transformación Digital: {business_name}\n\n"
        
        md += "## 1. Diagnóstico de Inteligencia\n"
        md += "Tras analizar su presencia digital, reputación y competencia, hemos detectado lo siguiente:\n\n"
        
        # Inserción de Insights de NotebookLM (Pain Points)
        md += "### 🔴 Dolores Críticos Detectados\n"
        if "pain_points" in insights:
            for p in insights["pain_points"]:
                md += f"- {p}\n"
        else:
            md += "- Eficiencia operativa mejorable en atención al cliente.\n"
            
        md += "\n## 2. Nuestra Solución (Adnexum Match)\n"
        md += "Basado en su catálogo actual, proponemos la implementación de los siguientes módulos de automatización:\n\n"
        
        # Inserción de Gap Analysis
        if "suggested_services" in insights:
            for s in insights["suggested_services"]:
                md += f"### ✅ {s['nombre']}\n"
                md += f"{s['descripcion']}\n\n"
        else:
            md += "### ✅ Automatización de Lead Management\n"
            md += "Captura y respuesta instantánea de consultas vía WhatsApp y Web.\n\n"

        md += "## 3. Análisis de Competencia (GAPs)\n"
        md += "Su competencia está avanzando en las siguientes áreas donde Adnexum puede darle la ventaja:\n"
        if "competitor_gaps" in insights:
            for gap in insights["competitor_gaps"]:
                md += f"- {gap}\n"

        md += "\n## 4. Próximos Pasos\n"
        md += "1. Breve llamada de 15 minutos para validar estos hallazgos.\n"
        md += "2. Demo personalizada con sus propios datos.\n"
        md += "3. Implementación en 7 días.\n\n"
        
        md += "---\n*Propuesta generada por Adnexum Intelligence 360°*"
        
        path = os.path.join(self.output_dir, output_filename)
        with open(path, "w", encoding="utf-8") as f:
            f.write(md)
            
        return path

if __name__ == "__main__":
    gen = ProposalGenerator()
    dummy_insights = {
        "pain_points": ["Demora de más de 2 horas en responder WhatsApp", "Stock desactualizado en web"],
        "suggested_services": [
            {"nombre": "Bot Sync Stock", "descripcion": "Sincroniza tus materiales con la web en tiempo real."}
        ]
    }
    gen.generate_tangible_proposal("Test Corp", dummy_insights, "test_propuesta.md")
