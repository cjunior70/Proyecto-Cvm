import { supabase } from "../../../Supabase/cliente";

export const obtenerDetalleInforme = async (fechaSeleccionada) => {
  try {
    console.log(`📡 [RPC] Consultando 'generar_informe_del_serivicio' para la fecha: ${fechaSeleccionada}`);

    // 🚀 Clave: El nombre de la función va completamente en minúsculas
    const { data, error } = await supabase.rpc('generar_informe_del_serivicio', {
      p_fecha: fechaSeleccionada
    });

    console.log(data);

    if (error) {
      console.error("🔴 Error crítico al ejecutar la RPC en Supabase:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn("⚠️ No se encontraron registros para la fecha seleccionada.");
      return { servicios: [], datosFlyer: { areas: [], asignaciones: {} } };
    }

    // --- 1. EXTRAER Y FILTRAR SERVICIOS ÚNICOS DEL DÍA ---
    const serviciosMapa = {};
    data.forEach(reg => {
      if (reg.IdServicio && !serviciosMapa[reg.IdServicio]) {
        serviciosMapa[reg.IdServicio] = {
          Id: reg.IdServicio,
          Fecha: reg.Fecha,
          Tipo: reg.TipoServicio,
          Jornada: reg.JornadaServicio
        };
      }
    });
    const listaServicios = Object.values(serviciosMapa);

    // --- 2. EXTRAER Y FILTRAR ÁREAS ÚNICAS ---
    const areasMapa = {};
    data.forEach(reg => {
      if (reg.IdArea && !areasMapa[reg.IdArea]) {
        areasMapa[reg.IdArea] = {
          Id: reg.IdArea,
          Nombre: reg.NombreArea,
          // 🔥 NUEVO: Rescatamos el orden que viene desde la consulta de la base de datos
          // Mapeamos tanto si viene como Orden o orden
          Orden: reg.Orden !== undefined ? reg.Orden : (reg.orden !== undefined ? reg.orden : null)
        };
      }
    });
    const listaAreas = Object.values(areasMapa);

    // --- 3. CONSTRUIR LA MATRIZ DINÁMICA DE ASIGNACIONES ---
    const asignaciones = {};

    data.forEach(reg => {
      const idArea = reg.IdArea;
      const idServicio = reg.IdServicio;

      if (!asignaciones[idArea]) {
        asignaciones[idArea] = {};
      }

      // Si la celda aún no tiene datos o está vacía, inicializamos la estructura
      if (!asignaciones[idArea][idServicio]) {
        asignaciones[idArea][idServicio] = null; 
      }

      // Si el registro indica que el área está requerida en ese servicio
      // (aunque no tenga un servidor asignado), creamos la celda.
      if (reg.EstaAsignado !== undefined) {
        // Si no hay un titular asignado aún pero la fila existe en ServicioArea, 
        // pasamos "VACANTE" para que el flyer pinte la alerta roja.
        const titular = reg.NombreServidor ? reg.NombreServidor.trim() : "VACANTE";

        // NOTA: Si en el futuro agregas lógica de apoyos en la misma fila, lo mapeas aquí.
        // Por ahora dejamos el apoyo vacío o manejamos duplicados si la consulta trae más filas.
        if (!asignaciones[idArea][idServicio] || asignaciones[idArea][idServicio].titular === "VACANTE") {
          asignaciones[idArea][idServicio] = {
            titular: titular,
            apoyo: "" 
          };
        } else if (reg.NombreServidor) {
          // Si ya había un titular y entra otra fila con un nombre distinto para el mismo servicio/área,
          // lo asignamos de forma automática como Apoyo (➕).
          asignaciones[idArea][idServicio].apoyo = reg.NombreServidor;
        }
      }
    });

    console.log("✅ [Service] Datos formateados con éxito para el Generador de Flyer.");

    return {
      servicios: listaServicios,
      datosFlyer: {
        areas: listaAreas,
        asignaciones: asignaciones
      }
    };

  } catch (error) {
    console.error("❌ Error en el adaptador obtenerDetalleInforme:", error.message || error);
    throw error;
  }
};