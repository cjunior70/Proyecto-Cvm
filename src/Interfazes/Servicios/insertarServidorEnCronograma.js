import { supabase } from "../../../Supabase/cliente";

export async function insertarServidorEnCronograma(idServicio, idServidorArea) {
  try {

    console.log("data 2", idServicio, " a ", idServidorArea);

    const { data, error } = await supabase
      .from("Cronograma") 
      .insert([
        {
          IdServicio: idServicio,       // 👈 Respetando la "I" y "S" mayúsculas de tu BD
          IdServidorAerea: idServidorArea // 👈 Campo clave que conecta con "Servidor_Area"
        },
      ])
      .select();

    if (error) {
      console.error("Error en Supabase al insertar en Cronograma:", error.message);
      return false;
    }

    console.log("¡Registro inyectado exitosamente en Cronograma!", data);
    return true; 
  } catch (err) {
    console.error("Error en la petición de inserción:", err);
    return false;
  }
}