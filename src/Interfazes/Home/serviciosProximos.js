// serviciosProximos.js

import { supabase } from "../../../Supabase/cliente";

export const obtenerProximoDiaConServicios = async () => {
  try {
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split("T")[0];

    // 1️⃣ Traer servicios desde hoy en adelante ordenados por fecha y jornada
    const { data, error } = await supabase
      .from("Servicio")
      .select("*")
      .gte("Fecha", fechaHoy)
      .order("Fecha", { ascending: true })
      .order("Jornada", { ascending: true });

    if (error) {
      console.error("Error obteniendo servicios:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // 2️⃣ Encontrar la primera fecha disponible
    const primeraFecha = data[0].Fecha;

    // 3️⃣ Filtrar todos los servicios que tengan esa fecha
    const serviciosDelDia = data.filter(
      (servicio) => servicio.Fecha === primeraFecha
    );

    return serviciosDelDia;

  } catch (err) {
    console.error("Error general:", err);
    return [];
  }
};
