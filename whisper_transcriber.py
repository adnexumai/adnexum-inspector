#!/usr/bin/env python3
"""
YouTube Whisper Transcriber
Descarga audio de videos de YouTube y los transcribe con Whisper.
"""

import yt_dlp
import whisper
import os
import re
from pathlib import Path
from datetime import datetime
import sys

# Configuración
CHANNEL_URL = "https://www.youtube.com/@Agusrondisl"
OUTPUT_DIR = Path("transcripciones_agusrondisl")
TEMP_DIR = Path("temp_audio")
WHISPER_MODEL = "base"  # tiny, base, small, medium, large

# Agregar FFmpeg al PATH
FFMPEG_PATH = r"C:\Users\Tomas\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin"
if os.path.exists(FFMPEG_PATH):
    os.environ["PATH"] += os.pathsep + FFMPEG_PATH


def sanitize_filename(name: str) -> str:
    """Limpia el nombre para archivo."""
    name = re.sub(r'[<>:"/\\|?*]', '', name)
    return name[:70].strip()


def get_channel_videos(channel_url: str, limit: int = None) -> list:
    """Obtiene lista de videos del canal."""
    print(f"📺 Obteniendo lista de videos...")
    
    ydl_opts = {
        'extract_flat': True,
        'quiet': True,
        'no_warnings': True,
    }
    
    if limit:
        ydl_opts['playlistend'] = limit
    
    videos = []
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            result = ydl.extract_info(f"{channel_url}/videos", download=False)
            if result and 'entries' in result:
                for entry in result['entries']:
                    if entry:
                        videos.append({
                            'id': entry.get('id'),
                            'title': entry.get('title', 'Sin titulo'),
                            'url': f"https://www.youtube.com/watch?v={entry.get('id')}"
                        })
        except Exception as e:
            print(f"❌ Error: {e}")
            return []
    
    print(f"✅ Encontrados {len(videos)} videos")
    return videos


def download_audio(video: dict, temp_dir: Path) -> str:
    """Descarga audio de un video."""
    video_id = video['id']
    audio_file = temp_dir / f"{video_id}.mp3"
    
    if audio_file.exists():
        return str(audio_file)
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '128',
        }],
        'outtmpl': str(temp_dir / f"{video_id}.%(ext)s"),
        'quiet': True,
        'no_warnings': True,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([video['url']])
    
    return str(audio_file)


def transcribe_audio(audio_path: str, model) -> str:
    """Transcribe audio usando Whisper."""
    result = model.transcribe(audio_path, language="es", fp16=False)
    return result['text']


# Configuración de Logging
class LoggerWriter:
    def __init__(self, filepath):
        self.terminal = sys.stdout
        self.log = open(filepath, 'a', encoding='utf-8')

    def write(self, message):
        self.terminal.write(message)
        self.log.write(message)
        self.log.flush()

    def flush(self):
        self.terminal.flush()
        self.log.flush()

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Transcriptor YouTube con Whisper')
    parser.add_argument('--channel', default=CHANNEL_URL, help='URL del canal')
    parser.add_argument('--limit', type=int, help='Limitar número de videos')
    parser.add_argument('--output', default=str(OUTPUT_DIR), help='Carpeta de salida')
    parser.add_argument('--model', default=WHISPER_MODEL, help='Modelo Whisper (tiny/base/small/medium/large)')
    parser.add_argument('--start', type=int, default=0, help='Empezar desde video #')
    args = parser.parse_args()
    
    output_dir = Path(args.output)
    output_dir.mkdir(exist_ok=True)
    temp_dir = TEMP_DIR
    temp_dir.mkdir(exist_ok=True)

    # Configurar logging (redirigir stdout al archivo)
    log_file = output_dir / "progress.log"
    sys.stdout = LoggerWriter(log_file)
    
    print("="*60)
    print(f"🎬 YouTube Whisper Transcriber - Inicio: {datetime.now().strftime('%H:%M:%S')}")
    print(f"📦 Modelo: {args.model}")
    print(f"📄 Log: {log_file}")
    print("="*60)
    
    # Cargar modelo Whisper
    print(f"\n⏳ Cargando modelo Whisper '{args.model}'...")
    try:
        model = whisper.load_model(args.model)
        print("✅ Modelo cargado")
    except Exception as e:
        print(f"❌ Error cargando modelo: {e}")
        return
    
    # Obtener videos
    videos = get_channel_videos(args.channel, args.limit)
    
    if not videos:
        print("❌ No se encontraron videos")
        return
    
    # Saltar videos ya procesados
    videos = videos[args.start:]
    
    success = 0
    errors = []
    
    print(f"\n📥 Procesando {len(videos)} videos...")
    print("-"*60)
    
    for i, video in enumerate(videos, 1):
        title = video['title']
        safe_title = sanitize_filename(title)
        txt_file = output_dir / f"{safe_title}_{video['id']}.txt"
        
        # Si ya existe, saltar
        if txt_file.exists():
            print(f"[{i}/{len(videos)}] {title[:40]}... ⏭️ (ya existe)")
            success += 1
            continue
        
        print(f"[{i}/{len(videos)}] {title[:40]}...", end=" ", flush=True)
        
        try:
            # Descargar audio
            print("🔽", end=" ", flush=True)
            audio_path = download_audio(video, temp_dir)
            
            # Transcribir
            print("🎤", end=" ", flush=True)
            transcript = transcribe_audio(audio_path, model)
            
            # Guardar
            with open(txt_file, 'w', encoding='utf-8') as f:
                f.write(f"# {title}\n")
                f.write(f"# URL: {video['url']}\n")
                f.write(f"# Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
                f.write("# " + "="*50 + "\n\n")
                f.write(transcript)
            
            print("✅")
            success += 1
            
            # Eliminar audio temporal
            if Path(audio_path).exists():
                os.remove(audio_path)
                
        except Exception as e:
            print(f"❌ Error: {str(e)[:50]}")
            errors.append({'video': title, 'url': video['url'], 'error': str(e)})
    
    # Reporte
    print("\n" + "="*60)
    print("📊 REPORTE FINAL")
    print("="*60)
    print(f"✅ Transcripciones: {success}")
    print(f"❌ Errores: {len(errors)}")
    print(f"📁 Carpeta: {output_dir.absolute()}")
    
    if errors:
        report_file = output_dir / "_errores.txt"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write("Videos con error:\n" + "="*50 + "\n\n")
            for err in errors:
                f.write(f"- {err['video']}\n  {err['url']}\n  Error: {err['error']}\n\n")
        print(f"📝 Reporte errores: {report_file}")


if __name__ == "__main__":
    main()
