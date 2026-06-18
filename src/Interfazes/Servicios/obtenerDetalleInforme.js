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
      if (reg.EstaAsignado !== undefined) {
        const titular = reg.NombreServidor ? reg.NombreServidor.trim() : "VACANTE";
        
        // 🔑 Rescatamos el correo que viene de tu consulta SQL modificada
        const correoActual = reg.CorreoServidor || reg.correoServidor || null;

        if (!asignaciones[idArea][idServicio] || asignaciones[idArea][idServicio].titular === "VACANTE") {
          asignaciones[idArea][idServicio] = {
            titular: titular,
            correoTitular: correoActual, // 🔥 Agregamos el correo del titular
            apoyo: "",
            correoApoyo: null // Inicializa vacío
          };
        } else if (reg.NombreServidor) {
          // Si ya había un titular, la fila actual entra como Apoyo
          asignaciones[idArea][idServicio].apoyo = reg.NombreServidor;
          asignaciones[idArea][idServicio].correoApoyo = correoActual; // 🔥 Agregamos el correo del apoyo
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