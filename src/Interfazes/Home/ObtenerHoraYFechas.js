import Year from "react-calendar/dist/DecadeView/Year.js";

/**
 * Obtiene únicamente el nombre del mes actual con la primera letra en mayúscula.
 * @returns {string} Ejemplo: "Mayo"
 */
export const obtenerMesActual = () => {
  const opciones = { month: 'long'};
  const mes = new Date().toLocaleDateString('es-ES', opciones);
  
  // Pone la primera letra en mayúscula (ej: "mayo" -> "Mayo")
  return mes.charAt(0).toUpperCase() + mes.slice(1);
};

/**
 * Obtiene la hora actual en formato legible de 12 horas (AM/PM).
 * @returns {string} Ejemplo: "4:12 PM"
 */
export const obtenerHoraActual = () => {
  const opciones = { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  };
  
  return new Date().toLocaleTimeString('es-ES', opciones);
};

/**
 * Obtiene la fecha actual formateada en español elegante.
 * @returns {string} Ejemplo: "Miércoles, 20 de Mayo de 2026"
 */
export const obtenerFechaActualElegante = () => {
  const opciones = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  
  const fechaTexto = new Date().toLocaleDateString('es-ES', opciones);
  
  // Este truco rompe el texto por palabras y pone la primera letra de cada una en Mayúscula
  return fechaTexto
    .split(" ")
    .map(palabra => palabra.length > 2 ? palabra.charAt(0).toUpperCase() + palabra.slice(1) : palabra)
    .join(" ");
};