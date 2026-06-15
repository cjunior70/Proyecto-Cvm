import { supabase } from "../../../Supabase/cliente";


export const ObtenerServidoresDelServicio = async (idServicio) => {
  const { data, error } = await supabase
    .from("Cronograma")
    .select(`
      Id,
      IdServidorAerea,
      Servidor_Area (
        IdServidor,
        Servidores (
            Nombre,
            Correo
        )
      )
    `) // 🚀 ¡Este es el JOIN mágico de Supabase! Trae el Nombre desde la tabla Aerea
    .eq("IdServicio", idServicio);

  if (error) {
    console.error("Error al traer áreas con nombres:", error);
    return [];
  }

  return data;
};