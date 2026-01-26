/**
 * Genera una presentación de Google Slides basada en el contenido proporcionado.
 */
function createNewPresentation() {
  // CONFIGURACIÓN
  var TITLE = "{{TITLE}}";
  var SLIDES_DATA = {{SLIDES_JSON}};

  // Crear la presentación
  var presentation = SlidesApp.create(TITLE);
  var slides = presentation.getSlides();

  // Eliminar la slide por defecto si se desea, o usarla como título
  var titleSlide = slides[0];
  var titleShape = titleSlide.getShapes()[0];
  var subtitleShape = titleSlide.getShapes()[1];
  titleShape.getText().setText(TITLE);
  subtitleShape.getText().setText("Generado con Antigravity Skill");

  // Iterar sobre los datos y crear slides
  SLIDES_DATA.forEach(function(slideData) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
    
    // Título
    try {
      slide.getShapes()[0].getText().setText(slideData.title);
    } catch (e) {
      Logger.log("Error seteando título: " + e);
    }

    // Cuerpo / Puntos
    try {
      var bodyShape = slide.getShapes()[1];
      bodyShape.getText().setText(slideData.body);
    } catch (e) {
      Logger.log("Error seteando cuerpo: " + e);
    }

    // Imagen (Placeholder logic - requires URL or Drive ID generally, 
    // but here we simply verify layout. Implementing image search requires advanced API enablement)
    // Para simplificar, añadimos una nota al orador con la sugerencia de imagen.
    slide.getNotesPage().getSpeakerNotesShape().getText().setText("Sugerencia de imagen: " + slideData.imageSearch);
  });

  Logger.log('Presentación creada: ' + presentation.getUrl());
  console.log('URL de la presentación: ' + presentation.getUrl());
}
