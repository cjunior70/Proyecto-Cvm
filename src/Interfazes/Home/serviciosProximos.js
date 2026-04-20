import { supabase } from "../../../Supabase/cliente";

/**
 * Obtiene los servicios de un día específico o del próximo día disponible.
 * @param {string} fechaForzada - Opcional. Fecha en formato "YYYY-MM-DD".
 */
export const obtenerProximoDiaConServicios = async (fechaForzada = null) => {
  try {
    const hoy = new Date().toISOString().split("T")[0];
    
    // Si recibimos una fecha, buscamos esa. Si no, buscamos desde hoy en adelante.
    const fechaABuscar = fechaForzada || hoy;

    let query = supabase
      .from("Servicio")
      .select("*")
      .order("Fecha", { ascending: true })
      .order("Jornada", { ascending: true });

    // Si es una fecha específica, usamos el igual (=). 
    // Si es "el próximo", usamos mayor o igual (>=).
    if (fechaForzada) {
      query = query.eq("Fecha", fechaForzada);
    } else {
      query = query.gte("Fecha", hoy);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error obteniendo servicios:", error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Si buscamos el "próximo disponible" (sin fechaForzada), 
    // filtramos para quedarnos solo con el primer día que aparezca en la lista.
    if (!fechaForzada) {
      const primeraFechaEncontrada = data[0].Fecha;
      return data.filter(servicio => servicio.Fecha === primeraFechaEncontrada);
    }

    // Si buscamos una fecha específica, devolvemos todo lo que encontró para ese día.
    return data;

  } catch (err) {
    console.error("Error general en serviciosProximos:", err);
    return [];
  }
};