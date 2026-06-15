import { supabase } from "../../../Supabase/cliente";

export async function actualizarInformacionBase(idServicio, nuevasAnotaciones) {
  try {
    const { data, error } = await supabase
      .from("Servicio") 
      .update({
        Fecha: nuevasAnotaciones.Fecha,
        Jornada: nuevasAnotaciones.Jornada,
        Comentario: nuevasAnotaciones.Comentario,
        Tipo: nuevasAnotaciones.Tipo,
        Estado:"Pendiente"
      })
      .eq("Id", idServicio);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error al actualizar la info base del servicio:", error);
    return false;
  }
}