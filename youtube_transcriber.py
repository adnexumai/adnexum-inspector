#!/usr/bin/env python3
"""
YouTube Channel Transcriber
Descarga subtítulos/transcripciones de todos los videos de un canal de YouTube.
Usa yt-dlp como librería Python para obtener subtítulos auto-generados.
"""

import yt_dlp
import os
import re
from pathlib import Path
from datetime import datetime

# Configuración
CHANNEL_URL = "https://www.youtube.com/@Agusrondisl"
OUTPUT_DIR = Path("transcripciones_agusrondisl")
SUBTITLE_LANG = "es"


def sanitize_filename(name: str) -> str:
    """Limpia el nombre para usarlo como nombre de archivo."""
    name = re.sub(r'[<>:"/\\|?*]', '', name)
    return name[:80].strip()


def get_channel_videos(channel_url: str, limit: int = None) -> list:
    """Obtiene la lista de videos del canal usando yt-dlp."""
    print(f"📺 Obteniendo lista de videos de {channel_url}...")
    
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
            print(f"❌ Error obteniendo videos: {e}")
            return []
    
    print(f"✅ Encontrados {len(videos)} videos")
    return videos


def download_subtitles(video: dict, output_dir: Path) -> dict:
    """Descarga subtítulos de un video específico."""
    video_id = video['id']
    title = video['title']
    safe_title = sanitize_filename(title)
    
    output_template = str(output_dir / f"{safe_title}_{video_id}")
    
    ydl_opts = {
        'skip_download': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['es', 'en'],
        'subtitlesformat': 'vtt',
        'outtmpl': output_template,
        'quiet': True,
        'no_warnings': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video['url']])
    except Exception as e:
        return {'status': 'error', 'file': None, 'error': str(e)}
    
    # Buscar archivo de subtítulos generado
    for ext in ['.es.vtt', '.en.vtt', '.vtt']:
        sub_file = Path(output_template + ext)
        if sub_file.exists():
            txt_file = output_dir / f"{safe_title}_{video_id}.txt"
            convert_vtt_to_text(sub_file, txt_file, title, video['url'])
            sub_file.unlink()
            return {'status': 'success', 'file': str(txt_file)}
    
    return {'status': 'no_subs', 'file': None}


def convert_vtt_to_text(vtt_path: Path, txt_path: Path, title: str, url: str):
    """Convierte archivo VTT a texto limpio."""
    with open(vtt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = []
    seen = set()
    
    for line in content.split('\n'):
        line = line.strip()
        if not line or line == 'WEBVTT' or 'Kind:' in line or 'Language:' in line:
            continue
        if '-->' in line:
            continue
        # Remover tags
        line = re.sub(r'<[^>]+>', '', line)
        line = re.sub(r'&nbsp;', ' ', line)
        if line and line not in seen:
            lines.append(line)
            seen.add(line)
    
    with open(txt_path, 'w', encoding='utf-8') as f:
        f.write(f"# {title}\n")
        f.write(f"# URL: {url}\n")
        f.write(f"# Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        f.write("# " + "="*50 + "\n\n")
        f.write(' '.join(lines))


def main():
    """Función principal."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Transcriptor de canal YouTube')
    parser.add_argument('--channel', default=CHANNEL_URL, help='URL del canal')
    parser.add_argument('--limit', type=int, help='Limitar número de videos')
    parser.add_argument('--output', default=str(OUTPUT_DIR), help='Carpeta de salida')
    args = parser.parse_args()
    
    output_dir = Path(args.output)
    output_dir.mkdir(exist_ok=True)
    
    print("="*60)
    print("🎬 YouTube Channel Transcriber - @Agusrondisl")
    print("="*60)
    
    videos = get_channel_videos(args.channel, args.limit)
    
    if not videos:
        print("❌ No se encontraron videos")
        return
    
    success = 0
    no_subs = 0
    errors = []
    
    print(f"\n📥 Descargando subtítulos de {len(videos)} videos...")
    print("-"*60)
    
    for i, video in enumerate(videos, 1):
        title_short = video['title'][:45] + "..." if len(video['title']) > 45 else video['title']
        print(f"[{i}/{len(videos)}] {title_short}", end=" ")
        
        try:
            result = download_subtitles(video, output_dir)
            if result['status'] == 'success':
                print("✅")
                success += 1
            elif result['status'] == 'no_subs':
                print("⚠️")
                no_subs += 1
                errors.append({'video': video['title'], 'url': video['url'], 'reason': 'no_subs'})
            else:
                print(f"❌")
                errors.append({'video': video['title'], 'url': video['url'], 'reason': result.get('error', 'unknown')})
        except Exception as e:
            print(f"❌")
            errors.append({'video': video['title'], 'url': video['url'], 'reason': str(e)})
    
    print("\n" + "="*60)
    print("📊 REPORTE FINAL")
    print("="*60)
    print(f"✅ Transcripciones: {success}")
    print(f"⚠️ Sin subtítulos: {no_subs}")
    print(f"📁 Carpeta: {output_dir.absolute()}")
    
    if errors:
        report_file = output_dir / "_videos_sin_subs.txt"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write("Videos sin subtítulos:\n" + "="*50 + "\n\n")
            for err in errors:
                f.write(f"- {err['video']}\n  {err['url']}\n\n")
        print(f"📝 Reporte: {report_file}")


if __name__ == "__main__":
    main()
