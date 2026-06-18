import { supabase } from "../../../Supabase/cliente";

export const obtenerServiciosAgrupados = async () => {
  try {
    console.log("📡 [Service] Cargando servicios desde la vista...");
    
    // Suponiendo que tu vista se llama "Vista_Servicios_Completos" (ajústalo a tu nombre real)
    const { data, error } = await supabase
      .from("Vista_Servicios_Completos") 
      .select("*")
      .order("Fecha", { ascending: true }); // Ordenados cronológicamente

    if (error) throw error;

    // 🔥 El truco: Agrupar por la propiedad "Fecha"
    const serviciosAgrupados = data.reduce((grupos, servicio) => {
      const fecha = servicio.Fecha || "Fecha No Definida";
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(servicio);
      return grupos;
    }, {});
    return serviciosAgrupados;

  } catch (error) {
    console.error("❌ [Service] Error al obtener servicios de la vista:", error.message);
    return {};
  }
};