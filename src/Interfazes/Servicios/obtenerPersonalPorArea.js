import { supabase } from "../../../Supabase/cliente";


export const obtenerPersonalPorServicioYArea = async (idServicio, idArea) => {
  // 1. Validación de seguridad para que no falle la petición
  if (!idServicio || !idArea) {
    console.error("❌ [Service] Faltan parámetros. idServicio o idArea vienen vacíos.");
    return [];
  }

  try {
    console.log(`📡 [Service] Buscando en Cronograma: Servicio [${idServicio}] | Área [${idArea}]`);

    const { data, error } = await supabase
      .from("Cronograma")
      .select(`
        Id,
        IdServicio,
        IdServidorAerea,
        Servidor_Area!inner (
          IdAerea,
          IdServidor,
          Servidores (
            Nombre,
            Foto
          )
        )
      `)
      .eq("IdServicio", idServicio)           // Condición 1: Que pertenezca a este servicio
      .eq("Servidor_Area.IdAerea", idArea);    // Condición 2: Que el servidor sea de esta área

    if (error) {
      console.error("❌ [Service] Error de Supabase:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.log("📂 [Service] No se encontraron servidores asignados para este filtro.");
      return [];
    }

    console.log(`✅ [Service] Registros encontrados: ${data.length}`);

    // 🧼 Mapeo limpio de los datos para la interfaz
    return data.map((item) => ({
      Id: item.Id,
      Nombre: item.Servidor_Area?.Servidores?.Nombre || "Servidor sin nombre",
      Foto: item.Servidor_Area?.Servidores?.Foto || null,
    }));

  } catch (err) {
    console.error("❌ [Service] Error crítico en la petición:", err);
    return [];
  }
};