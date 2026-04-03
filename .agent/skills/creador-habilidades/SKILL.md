---
description: "Úsala cuando el usuario quiera crear una nueva habilidad o 'skill'. Esta habilidad te guía para crear la estructura de carpetas y el archivo de configuración base necesarios."
---

# Creador de Habilidades

Sigue estos pasos cuidadosamente para ayudar al usuario a crear una nueva habilidad de manera estandarizada.

## 1. Recopilar Información

Si el usuario no ha proporcionado esta información, pregúntale:
1.  **Nombre de la habilidad**: Debe ser breve y descriptivo. Convierte este nombre a `kebab-case` para el nombre de la carpeta (ej: "Code Reviewer" -> `code-reviewer`).
2.  **Propósito**: Una frase corta que describa qué hace la habilidad y *cuándo* debe usarse. Esto irá en el campo `description` del archivo `SKILL.md`.

## 2. Determinar Ubicación

Pregunta al usuario si desea crear la habilidad en el **espacio de trabajo actual** o como una **habilidad global**.

*   **Espacio de trabajo actual**: La ruta será `<root>/.agent/skills/<nombre-kebab-case>/`.
*   **Global**: La ruta será `~/.gemini/antigravity/global_skills/<nombre-kebab-case>/`.

*Por defecto, asume el espacio de trabajo actual si el usuario no especifica.*

## 3. Crear Estructura

Utiliza la herramienta `write_to_file` para crear el archivo `SKILL.md` en la ruta determinada. La herramienta creará automáticamente la carpeta padre.

**Plantilla para `SKILL.md`:**

```markdown
---
description: "[Propósito de la habilidad - Cuándo debe usarla el agente]"
---

# [Nombre de la Habilidad]

[Instrucciones detalladas de cómo debe comportarse el agente al usar esta habilidad.
Incluye pasos, reglas, o lógica a seguir.]

## Instrucciones

1.  ...
2.  ...
```

## 4. Confirmación

Una vez creado el archivo:
1.  Informa al usuario que la habilidad ha sido creada exitosamente en la ruta especificada.
2.  Recuérdale que puede editar el archivo `SKILL.md` para refinar las instrucciones.
