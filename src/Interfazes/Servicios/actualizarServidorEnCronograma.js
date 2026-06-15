import { supabase } from "../../../Supabase/cliente";

export const actualizarServidorEnCronograma = async (idCronograma, nuevoIdServidorArea) => {
  if (!idCronograma || !nuevoIdServidorArea) {
    console.error("❌ [Service] Faltan parámetros obligatorios para la actualización.");
    return false;
  }

  try {
    console.log(`📡 [Service] Actualizando Cronograma [${idCronograma}] con nuevo ServidorArea [${nuevoIdServidorArea}]`);

    const { error } = await supabase
      .from("Cronograma")
      .update({ IdServidorAerea: nuevoIdServidorArea }) // Mandamos el nuevo ID
      .eq("Id", idCronograma); // Filtramos por el ID del registro actual

    if (error) {
      console.error("❌ [Service] Error al actualizar en Supabase:", error.message);
      return false;
    }

    console.log("Copas, ¡servidor actualizado con éxito en la base de datos! 🎉");
    return true;

  } catch (err) {
    console.error("❌ [Service] Error crítico en el proceso de actualización:", err);
    return false;
  }
};