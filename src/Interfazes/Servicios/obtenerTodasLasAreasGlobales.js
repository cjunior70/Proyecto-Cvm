import { supabase } from "../../../Supabase/cliente";

/**
 * 1. Trae todas las áreas globales que existen en la base de datos
 */
export const obtenerTodasLasAreasGlobales = async () => {
  const { data, error } = await supabase.from("Aerea").select("Id, Nombre");
  if (error) {
    console.error("❌ Error al traer áreas globales:", error.message);
    return [];
  }
  return data;
};

/**
 * 2. Elimina un área específica de un servicio (Tabla Servicio_Aerea)
 */
export const eliminarAreaDeServicio = async (idServicioAerea) => {
  const { error } = await supabase
    .from("ServicioArea")
    .delete()
    .eq("Id", idServicioAerea);

  if (error) {
    console.error("❌ Error al eliminar área del servicio:", error.message);
    return false;
  }
  return true;
};

/**
 * 3. Añade una nueva área a un servicio con sus cupos asignados
 */
export const insertarAreaEnServicio = async (idServicio, idArea, cupos) => {
  const { error } = await supabase
    .from("ServicioArea")
    .insert([
      { 
        IdServicio: idServicio, 
        IdArea: idArea, 
        Cupos: parseInt(cupos, 10),
        Inscritos: 0 // Inicia en cero servidores apuntados
      }
    ]);

  if (error) {
    console.error("❌ Error al insertar área en el servicio:", error.message);
    return false;
  }
  return true;
};