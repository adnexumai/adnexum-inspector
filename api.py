"""
FastAPI Backend para Adnexum Inspector.
Provee endpoints REST para el frontend.
"""

import os
import json
import asyncio
from datetime import datetime
from typing import Optional, Dict, List
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import uvicorn

# Importar módulos del inspector
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from business_scraper import BusinessScraper
from google_maps_scraper import GoogleMapsScraper
from social_analyzer import SocialAnalyzer
from intelligence_engine import IntelligenceEngine, InsightType
from prospector_generators import ReportGenerator, LoomScriptGenerator, CallQuestionsGenerator


import uvicorn
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Configuración Base de Datos
DATABASE_URL = "sqlite:///./adnexum_os.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Modelos DB
class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    url = Column(String)
    status = Column(String, default="Nuevo") # Nuevo, En Contacto, Propuesta, Negociación, Cerrado
    score = Column(Integer, default=0)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    content = Column(Text)
    sender = Column(String) # 'agent' o 'client'
    platform = Column(String) # 'whatsapp', 'instagram', etc.
    timestamp = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Inicializar FastAPI
app = FastAPI(
    title="Adnexum Inspector API",
    description="API de prospección B2B 360° para Adnexum",
    version="1.0.0"
)

# Configurar CORS para permitir requests desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios exactos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Almacenamiento en memoria para jobs (en producción usar Redis)
jobs_store: Dict[str, Dict] = {}


# Modelos Pydantic
class InvestigationRequest(BaseModel):
    url: HttpUrl
    include_maps: bool = True
    include_social: bool = True


class InvestigationStatus(BaseModel):
    job_id: str
    status: str  # pending, running, completed, failed
    progress: int  # 0-100
    current_step: str
    result: Optional[Dict] = None
    error: Optional[str] = None


class QuickAnalysisRequest(BaseModel):
    url: HttpUrl


# Endpoints de CRM
@app.get("/api/leads")
async def get_leads():
    db = SessionLocal()
    leads = db.query(Lead).all()
    db.close()
    return leads

@app.post("/api/leads")
async def create_lead(name: str, url: str):
    db = SessionLocal()
    new_lead = Lead(name=name, url=url)
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    db.close()
    return new_lead

@app.patch("/api/leads/{lead_id}")
async def update_lead_status(lead_id: int, status: str):
    db = SessionLocal()
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if lead:
        lead.status = status
        db.commit()
    db.close()
    return {"status": "updated"}

@app.get("/api/messages/{lead_id}")
async def get_messages(lead_id: int):
    db = SessionLocal()
    msgs = db.query(Message).filter(Message.lead_id == lead_id).all()
    db.close()
    return msgs

@app.post("/api/messages")
async def send_message(lead_id: int, content: str, platform: str = "whatsapp"):
    db = SessionLocal()
    msg = Message(lead_id=lead_id, content=content, sender="agent", platform=platform)
    db.add(msg)
    db.commit()
    db.close()
    return {"status": "sent"}

# Endpoints de Prospección Existentes
@app.get("/")
async def root():
    """Health check."""
    return {
        "status": "ok",
        "service": "Adnexum Inspector API",
        "version": "1.0.0"
    }


@app.post("/api/investigate", response_model=InvestigationStatus)
async def start_investigation(request: InvestigationRequest, background_tasks: BackgroundTasks):
    """
    Inicia una investigación completa en background.
    Retorna un job_id para consultar el progreso.
    """
    job_id = f"job_{datetime.now().strftime('%Y%m%d%H%M%S')}_{hash(str(request.url)) % 10000}"
    
    jobs_store[job_id] = {
        "status": "pending",
        "progress": 0,
        "current_step": "Iniciando...",
        "result": None,
        "error": None,
        "url": str(request.url)
    }
    
    # Ejecutar en background
    background_tasks.add_task(
        run_investigation,
        job_id,
        str(request.url),
        request.include_maps,
        request.include_social
    )
    
    return InvestigationStatus(
        job_id=job_id,
        status="pending",
        progress=0,
        current_step="Iniciando investigación..."
    )


@app.post("/api/investigate-deep", response_model=InvestigationStatus)
async def start_deep_investigation(request: InvestigationRequest, background_tasks: BackgroundTasks):
    """
    Inicia una investigación profunda (360) que incluye NotebookLM.
    """
    job_id = f"deep_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    jobs_store[job_id] = {
        "status": "pending",
        "progress": 0,
        "current_step": "Iniciando Inteligencia 360...",
        "result": None,
        "error": None,
        "url": str(request.url)
    }
    
    background_tasks.add_task(
        run_deep_investigation_flow,
        job_id,
        str(request.url)
    )
    
    return InvestigationStatus(
        job_id=job_id,
        status="pending",
        progress=0,
        current_step="Iniciando motor de IA..."
    )

async def run_deep_investigation_flow(job_id: str, url: str):
    """Orquesta el flujo completo 360 en segundo plano."""
    try:
        job = jobs_store[job_id]
        inspector = AdnexumInspector(headless=True)
        
        job["status"] = "running"
        job["progress"] = 10
        job["current_step"] = "Scraping web y contacto..."
        
        # Ejecutar investigación (Internamente ya maneja las fases)
        results = inspector.investigate(url, deep=True)
        job["progress"] = 80
        job["current_step"] = "Integrando con NotebookLM (Análisis de IA)..."
        
        # Aquí iría la llamada al integrador_notebooklm si el MCP estuviera activo
        # Por ahora generamos la propuesta con los datos obtenidos
        from proposal_generator import ProposalGenerator
        prop_gen = ProposalGenerator()
        
        # Simular insights de NotebookLM si no hay conexión
        insights = {
            "pain_points": results["diagnosis"]["executive_summary"],
            "suggested_services": [
                {"nombre": s, "descripcion": "Solución recomendada según análisis."} 
                for s in results["diagnosis"]["recommended_solutions"]
            ]
        }
        
        prop_path = prop_gen.generate_tangible_proposal(
            results["diagnosis"]["business_name"],
            insights,
            f"PROPUESTA_{job_id}.md"
        )
        
        results["files"]["propuesta_tangible"] = prop_path
        
        job["status"] = "completed"
        job["progress"] = 100
        job["current_step"] = "Investigación 360 Finalizada"
        job["result"] = results
        
    except Exception as e:
        jobs_store[job_id]["status"] = "failed"
        jobs_store[job_id]["error"] = str(e)


@app.get("/api/investigate/{job_id}", response_model=InvestigationStatus)
async def get_investigation_status(job_id: str):
    """Obtiene el estado de una investigación."""
    if job_id not in jobs_store:
        raise HTTPException(status_code=404, detail="Job no encontrado")
    
    job = jobs_store[job_id]
    return InvestigationStatus(
        job_id=job_id,
        status=job["status"],
        progress=job["progress"],
        current_step=job["current_step"],
        result=job["result"],
        error=job["error"]
    )


@app.post("/api/quick-analysis")
async def quick_analysis(request: QuickAnalysisRequest):
    """
    Análisis rápido solo del sitio web (sin Maps ni social).
    Más rápido pero menos completo.
    """
    try:
        url = str(request.url)
        scraper = BusinessScraper()
        
        # Solo scraping web básico
        result = scraper.scrape_business(url, output_dir="./temp_output")
        
        # Análisis rápido
        engine = IntelligenceEngine()
        diagnosis = engine.analyze(
            web_data=result,
            maps_data=None,
            social_data=None
        )
        
        return {
            "status": "success",
            "url": url,
            "business_name": diagnosis.business_name,
            "score": diagnosis.overall_score,
            "summary": diagnosis.executive_summary,
            "problems_count": len(diagnosis.get_problems()),
            "opportunities_count": len(diagnosis.get_opportunities()),
            "top_problems": [
                {"title": p.title, "description": p.description}
                for p in diagnosis.get_problems()[:3]
            ],
            "top_opportunities": [
                {"title": o.title, "solution": o.adnexum_solution}
                for o in diagnosis.get_opportunities()[:3]
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/jobs")
async def list_jobs():
    """Lista todos los jobs activos."""
    return {
        "jobs": [
            {
                "job_id": job_id,
                "url": job.get("url", ""),
                "status": job["status"],
                "progress": job["progress"]
            }
            for job_id, job in jobs_store.items()
        ]
    }


@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: str):
    """Elimina un job del store."""
    if job_id in jobs_store:
        del jobs_store[job_id]
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Job no encontrado")


# Background task
async def run_investigation(job_id: str, url: str, include_maps: bool, include_social: bool):
    """Ejecuta la investigación completa en background."""
    try:
        job = jobs_store[job_id]
        job["status"] = "running"
        
        result = {
            "url": url,
            "timestamp": datetime.now().isoformat(),
            "web_data": None,
            "maps_data": None,
            "social_data": None,
            "diagnosis": None
        }
        
        # Paso 1: Web scraping
        job["current_step"] = "Analizando sitio web..."
        job["progress"] = 10
        
        try:
            scraper = BusinessScraper()
            web_result = scraper.scrape_business(url, output_dir="./temp_output")
            result["web_data"] = {
                "productos_count": len(web_result.get("productos", [])),
                "nombre_negocio": web_result.get("contexto", {}).get("nombre_negocio", ""),
                "contacto": web_result.get("contexto", {}).get("contacto", {}),
                "redes_sociales": web_result.get("contexto", {}).get("redes_sociales", {})
            }
            job["progress"] = 30
        except Exception as e:
            result["web_data"] = {"error": str(e)}
        
        # Paso 2: Google Maps
        if include_maps:
            job["current_step"] = "Investigando reputación en Google Maps..."
            job["progress"] = 40
            
            try:
                business_name = result["web_data"].get("nombre_negocio", "")
                if not business_name:
                    domain = urlparse(url).netloc
                    business_name = domain.replace("www.", "").split(".")[0]
                
                maps_scraper = GoogleMapsScraper(headless=True)
                maps_result = maps_scraper.search_business(business_name)
                result["maps_data"] = {
                    "status": maps_result.get("status"),
                    "rating": maps_result.get("rating"),
                    "total_reviews": maps_result.get("total_reviews", 0),
                    "pain_signals": maps_result.get("pain_signals", []),
                    "praise_signals": maps_result.get("praise_signals", [])
                }
                job["progress"] = 55
            except Exception as e:
                result["maps_data"] = {"status": "error", "error": str(e)}
        
        # Paso 3: Redes sociales
        if include_social:
            job["current_step"] = "Analizando presencia digital..."
            job["progress"] = 65
            
            try:
                social_links = result["web_data"].get("redes_sociales", {})
                if any(social_links.values()):
                    social_analyzer = SocialAnalyzer(headless=True)
                    social_result = social_analyzer.analyze_social_presence(social_links)
                    result["social_data"] = {
                        "overall_score": social_result.get("overall_score", 0),
                        "issues": social_result.get("issues", []),
                        "strengths": social_result.get("strengths", [])
                    }
                else:
                    result["social_data"] = {
                        "overall_score": 0,
                        "issues": ["Sin redes sociales detectadas"],
                        "strengths": []
                    }
                job["progress"] = 75
            except Exception as e:
                result["social_data"] = {"status": "error", "error": str(e)}
        
        # Paso 4: Diagnóstico
        job["current_step"] = "Generando diagnóstico..."
        job["progress"] = 85
        
        engine = IntelligenceEngine()
        
        # Preparar datos para el motor
        web_data_for_engine = {
            "url": url,
            "contexto": {
                "nombre_negocio": result["web_data"].get("nombre_negocio", ""),
                "contacto": result["web_data"].get("contacto", {}),
                "redes_sociales": result["web_data"].get("redes_sociales", {})
            },
            "productos": []
        }
        
        maps_data_for_engine = result.get("maps_data") if result.get("maps_data", {}).get("status") == "found" else None
        social_data_for_engine = result.get("social_data")
        
        diagnosis = engine.analyze(
            web_data=web_data_for_engine,
            maps_data=maps_data_for_engine,
            social_data=social_data_for_engine
        )
        
        # Generar entregables en formato JSON
        job["current_step"] = "Generando entregables..."
        job["progress"] = 95
        
        result["diagnosis"] = {
            "business_name": diagnosis.business_name,
            "overall_score": diagnosis.overall_score,
            "executive_summary": diagnosis.executive_summary,
            "problems": [
                {
                    "title": p.title,
                    "description": p.description,
                    "evidence": p.evidence,
                    "source": p.source,
                    "severity": p.severity,
                    "solution": p.adnexum_solution
                }
                for p in diagnosis.get_problems()
            ],
            "opportunities": [
                {
                    "title": o.title,
                    "description": o.description,
                    "solution": o.adnexum_solution
                }
                for o in diagnosis.get_opportunities()
            ],
            "strengths": [
                {"title": s.title, "description": s.description}
                for s in diagnosis.get_strengths()
            ],
            "recommended_solutions": diagnosis.recommended_solutions
        }
        
        # Generar guion Loom como texto
        loom_gen = LoomScriptGenerator()
        # Crear un objeto diagnosis temporal para el generador
        result["loom_script"] = generate_loom_text(diagnosis)
        
        # Generar preguntas como lista
        result["call_questions"] = generate_questions_list(diagnosis)
        
        # Completar
        job["status"] = "completed"
        job["progress"] = 100
        job["current_step"] = "Completado"
        job["result"] = result
        
    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        job["current_step"] = f"Error: {str(e)}"


def generate_loom_text(diagnosis) -> str:
    """Genera el texto del guion Loom."""
    problems = diagnosis.get_problems()
    top_problem = problems[0] if problems else None
    
    script = f"""GUION LOOM - {diagnosis.business_name} (60-90 segundos)

🎯 GANCHO (0:00 - 0:10)
"Hola, soy Tomás de Adnexum. Estuve analizando {diagnosis.business_name} y encontré algo que creo que te va a interesar..."

🔴 PROBLEMA (0:10 - 0:30)
"""
    
    if top_problem:
        script += f'"Vi que {top_problem.description.lower()}"\n'
        script += f'"La evidencia: {top_problem.evidence}"\n'
    else:
        script += '"Noté que hay algunas áreas donde podrían estar perdiendo clientes..."\n'
    
    script += """
💸 COSTO (0:30 - 0:45)
"Esto probablemente significa que cada día están perdiendo consultas que nunca se responden. Y cada consulta perdida es una venta que se va a la competencia."

💡 SOLUCIÓN (0:45 - 1:05)
"""
    
    if top_problem and top_problem.adnexum_solution:
        script += f'"Lo bueno es que esto se puede arreglar. En Adnexum implementamos {top_problem.adnexum_solution.lower()}."\n'
    else:
        script += '"Lo bueno es que esto se puede arreglar con automatización inteligente."\n'
    
    script += """
📞 CTA (1:05 - 1:20)
"¿Te gustaría ver cómo funcionaría esto específicamente para tu negocio? Te propongo una llamada corta de 15 minutos."
"""
    
    return script


def generate_questions_list(diagnosis) -> List[str]:
    """Genera lista de preguntas para la llamada."""
    questions = [
        "¿Cuál es tu rol en el negocio?",
        "¿Aproximadamente cuántas consultas/leads reciben por semana?",
        "¿Por qué canales llegan la mayoría de esas consultas?",
    ]
    
    problems = diagnosis.get_problems()
    for problem in problems[:3]:
        if "respuesta" in problem.title.lower():
            questions.append("¿Cuánto tardan actualmente en responder una consulta nueva?")
        elif "whatsapp" in problem.title.lower():
            questions.append("¿Tienen WhatsApp Business o un número dedicado para atención?")
        elif "reputación" in problem.category.value.lower():
            questions.append("¿Tienen algún proceso para pedir reseñas a clientes satisfechos?")
    
    questions.extend([
        "¿Cuántas consultas crees que se pierden por mes sin respuesta o con respuesta tardía?",
        "¿Cuánto vale en promedio una venta para ustedes?",
        "¿Usan algún CRM o sistema para organizar las conversaciones?",
        "¿Tienen algún proceso de seguimiento para clientes que consultan pero no compran?",
        "Si pudiéramos automatizar esto, ¿qué impacto crees que tendría en el negocio?",
        "¿Qué intentaste antes para resolver esto? ¿Por qué no funcionó?"
    ])
    
    return questions[:12]


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
