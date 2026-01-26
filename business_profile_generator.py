"""
Generador de perfiles de negocio en formatos JSON y Markdown.
"""

import json
import os
from datetime import datetime
from typing import Dict


class BusinessProfileGenerator:
    """Genera perfiles contextuales de negocios."""
    
    def __init__(self, output_dir: str = "./output"):
        """
        Inicializa el generador de perfiles.
        
        Args:
            output_dir: Directorio de salida
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def generate_profile(self, context: Dict, domain: str) -> Dict[str, str]:
        """
        Genera perfil de negocio en JSON y Markdown.
        
        Args:
            context: Diccionario con contexto del negocio
            domain: Dominio del sitio
            
        Returns:
            Dict con rutas de archivos generados
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        sanitized_domain = self._sanitize_domain(domain)
        
        # Generar JSON
        json_path = self._generate_json(context, sanitized_domain, timestamp)
        
        # Generar Markdown
        md_path = self._generate_markdown(context, sanitized_domain, timestamp)
        
        return {
            'json': json_path,
            'markdown': md_path
        }
    
    def _generate_json(self, context: Dict, domain: str, timestamp: str) -> str:
        """
        Genera archivo JSON con el perfil del negocio.
        
        Args:
            context: Contexto del negocio
            domain: Dominio sanitizado
            timestamp: Timestamp
            
        Returns:
            Ruta del archivo JSON
        """
        filename = f"perfil_{domain}_{timestamp}.json"
        filepath = os.path.join(self.output_dir, filename)
        
        # Agregar metadata
        profile = {
            'metadata': {
                'fecha_extraccion': datetime.now().isoformat(),
                'url': context.get('url', '')
            },
            'negocio': context
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(profile, f, ensure_ascii=False, indent=2)
        
        return filepath
    
    def _generate_markdown(self, context: Dict, domain: str, timestamp: str) -> str:
        """
        Genera archivo Markdown con el perfil del negocio.
        
        Args:
            context: Contexto del negocio
            domain: Dominio sanitizado
            timestamp: Timestamp
            
        Returns:
            Ruta del archivo Markdown
        """
        filename = f"perfil_{domain}_{timestamp}.md"
        filepath = os.path.join(self.output_dir, filename)
        
        # Construir contenido Markdown
        md_content = self._build_markdown_content(context)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(md_content)
        
        return filepath
    
    def _build_markdown_content(self, context: Dict) -> str:
        """
        Construye el contenido en formato Markdown.
        
        Args:
            context: Contexto del negocio
            
        Returns:
            Contenido en Markdown
        """
        lines = []
        
        # Encabezado
        lines.append(f"# Perfil de Negocio: {context.get('nombre_negocio', 'N/A')}")
        lines.append("")
        lines.append(f"**URL:** {context.get('url', 'N/A')}")
        lines.append(f"**Fecha de extracción:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("")
        lines.append("---")
        lines.append("")
        
        # Información de contacto
        lines.append("## 📞 Información de Contacto")
        lines.append("")
        contacto = context.get('contacto', {})
        
        if contacto.get('telefonos'):
            lines.append(f"**Teléfonos:** {contacto['telefonos']}")
        
        if contacto.get('emails'):
            lines.append(f"**Emails:** {contacto['emails']}")
        
        if contacto.get('direccion'):
            lines.append(f"**Dirección:** {contacto['direccion']}")
        
        lines.append("")
        
        # Redes sociales
        lines.append("## 🌐 Redes Sociales")
        lines.append("")
        redes = context.get('redes_sociales', {})
        
        for platform, url in redes.items():
            if url:
                lines.append(f"- **{platform.capitalize()}:** {url}")
        
        if not any(redes.values()):
            lines.append("*No se encontraron redes sociales*")
        
        lines.append("")
        
        # Información general
        lines.append("## ℹ️ Información General del Negocio")
        lines.append("")
        info = context.get('informacion_general', 'No disponible')
        lines.append(info)
        lines.append("")
        
        # Políticas
        lines.append("## 📋 Políticas")
        lines.append("")
        politicas = context.get('politicas', {})
        
        if politicas.get('envio'):
            lines.append(f"- **Política de envío:** {politicas['envio']}")
        
        if politicas.get('devoluciones'):
            lines.append(f"- **Política de devoluciones:** {politicas['devoluciones']}")
        
        if politicas.get('terminos'):
            lines.append(f"- **Términos y condiciones:** {politicas['terminos']}")
        
        if not any(politicas.values()):
            lines.append("*No se encontraron políticas*")
        
        lines.append("")
        
        # FAQs
        faqs = context.get('faq', [])
        if faqs:
            lines.append("## ❓ Preguntas Frecuentes")
            lines.append("")
            
            for idx, faq in enumerate(faqs, 1):
                lines.append(f"### {idx}. {faq.get('pregunta', 'N/A')}")
                lines.append("")
                lines.append(faq.get('respuesta', 'Sin respuesta'))
                lines.append("")
        
        # Sección para personalización de IA
        lines.append("---")
        lines.append("")
        lines.append("## 🤖 Datos para Personalización de IA")
        lines.append("")
        lines.append("### Resumen Ejecutivo")
        lines.append("")
        lines.append(f"Este negocio ({context.get('nombre_negocio', 'N/A')}) puede ser contactado vía:")
        
        contact_methods = []
        if contacto.get('telefonos'):
            contact_methods.append(f"teléfono ({contacto['telefonos']})")
        if contacto.get('emails'):
            contact_methods.append(f"email ({contacto['emails']})")
        
        if contact_methods:
            lines.append(f"- {', '.join(contact_methods)}")
        
        lines.append("")
        lines.append("### Prompt Sugerido para Agente de IA")
        lines.append("")
        lines.append("```")
        lines.append(self._generate_ai_prompt(context))
        lines.append("```")
        
        return "\n".join(lines)
    
    def _generate_ai_prompt(self, context: Dict) -> str:
        """
        Genera un prompt sugerido para personalizar un agente de IA.
        
        Args:
            context: Contexto del negocio
            
        Returns:
            Prompt para IA
        """
        nombre = context.get('nombre_negocio', '[NOMBRE_NEGOCIO]')
        info = context.get('informacion_general', '')
        contacto = context.get('contacto', {})
        
        prompt_parts = [
            f"Eres un asistente de atención al cliente para {nombre}.",
            "",
            "INFORMACIÓN DEL NEGOCIO:",
            info[:500] if info else "Negocio de comercio electrónico.",
            "",
            "INFORMACIÓN DE CONTACTO:"
        ]
        
        if contacto.get('telefonos'):
            prompt_parts.append(f"- Teléfono: {contacto['telefonos']}")
        
        if contacto.get('emails'):
            prompt_parts.append(f"- Email: {contacto['emails']}")
        
        if contacto.get('direccion'):
            prompt_parts.append(f"- Dirección: {contacto['direccion']}")
        
        prompt_parts.extend([
            "",
            "INSTRUCCIONES:",
            "- Responde de manera amable y profesional",
            "- Proporciona información precisa sobre productos y políticas",
            "- Si no sabes algo, ofrece derivar al equipo de soporte",
            "- Mantén un tono conversacional y útil"
        ])
        
        return "\n".join(prompt_parts)
    
    @staticmethod
    def _sanitize_domain(domain: str) -> str:
        """Limpia el dominio para nombres de archivo."""
        domain = domain.replace('https://', '').replace('http://', '')
        domain = domain.replace('www.', '').rstrip('/')
        return domain.replace('/', '_').replace(':', '_')
