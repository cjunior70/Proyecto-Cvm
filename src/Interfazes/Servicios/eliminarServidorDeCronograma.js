import { supabase } from "../../../Supabase/cliente"; // Ajusta la ruta a tu cliente

export const eliminarServidorDeCronograma = async (idCronograma) => {
  try {
    console.log(`🗑️ [Service] Intentando eliminar registro de Cronograma con ID:`, idCronograma);

    const { error } = await supabase
      .from("Cronograma")
      .delete()
      .eq("Id", idCronograma); // Borramos por el ID único de la fila

    if (error) {
      console.error("❌ [Service] Error al eliminar en Supabase:", error.message);
      return false;
    }

    console.log("✅ [Service] Registro eliminado con éxito de la base de datos.");
    return true;

  } catch (err) {
    console.error("❌ [Service] Error crítico en la petición de eliminación:", err);
    return false;
  }
};