---
description: "Úsala cuando el usuario quiera crear una presentación de Google Slides a partir de una entrada de blog, artículo o texto largo. Genera un script de Google Apps Script."
---

# Generador de Slides desde Blog

Esta habilidad convierte contenido de texto (entradas de blog) en una presentación visual de Google Slides automáticamente mediante Google Apps Script.

## Instrucciones

1.  **Analizar Contenido**:
    *   Lee el contenido proporcionado por el usuario (o navega a la URL si es necesario).
    *   Extrae los puntos clave y estructura la información en 5-10 diapositivas lógicas.
    *   Para cada diapositiva, define: `title` (título), `points` (lista de puntos clave), y `image_query` (descripción para buscar una imagen).

2.  **Generar Datos JSON**:
    *   Crea una estructura JSON con el contenido extraído.
    *   Formato:
        ```json
        [
          {
            "title": "Título de la Slide",
            "body": "Texto principal o bullets...",
            "imageSearch": "término de búsqueda para imagen"
          },
          ...
        ]
        ```

3.  **Crear el Script**:
    *   Lee el archivo de plantilla: `.agent/skills/blog-to-slides/templates/slides_generator.js`.
    *   Reemplaza el placeholder `{{SLIDES_JSON}}` con el JSON generado en el paso anterior.
    *   Reemplaza `{{TITLE}}` con el título del blog.

4.  **Entrega**:
    *   Presenta el código final completo en un bloque de código `javascript`.
    *   Instruye al usuario para que:
        1.  Vaya a [script.google.com](https://script.google.com).
        2.  Cree un nuevo proyecto.
        3.  Pegue el código generado.
        4.  Ejecute la función `createNewPresentation()`.
