import { supabase } from "../../../Supabase/cliente";

export const ObtenerAreasConNombres = async (idServicio) => {
  const { data, error } = await supabase
    .from("ServicioArea")
    .select(`
      Id,
      IdServicio,
      IdArea,
      Cupos,
      Inscritos,
      Aerea (
        Nombre,
        Foto,
        Orden,
        "Id_Icono", 
        "IconosDisponibles" ( 
          "UrlIcono"        
        )
      )
    `)
    .eq("IdServicio", idServicio);

      console.log("data del servido : ", data);

  if (error) {
    console.error("Error al traer áreas con nombres:", error);
    return [];
  }

  // console.log("📡 Data CRUDA de Supabase:", data); // 👈 Activa este log si algo sigue fallando

  // 🔥 MAPEADO BLINDADO CONTRA NULOS
  const dataFormateada = data?.map(item => {
    // Definimos la URL de respaldo (help-circle)
    const urlPorDefecto = "https://unpkg.com/lucide-static@latest/icons/help-circle.svg";
    
    // ✅ Extraemos UrlIcono con los nuevos nombres de primer nivel
    // Notarás que el objeto crudo de Supabase respetará los nombres de tabla y columna
    const urlDesdeBD = item.Aerea?.["IconosDisponibles"]?.["UrlIcono"];

    return {
      ...item,
      // Usamos el 'Orden' blindado que ya teníamos
      Orden: item.Aerea?.Orden ?? item.Aerea?.orden ?? 999,
      
      // ✅ Si urlDesdeBD es null o undefined, le clavamos la urlPorDefecto
      UrlIcono: urlDesdeBD || urlPorDefecto 
    };
  }) || [];

  return dataFormateada;
};