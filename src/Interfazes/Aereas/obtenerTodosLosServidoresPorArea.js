import { supabase } from "../../../Supabase/cliente";

export const obtenerTodosLosServidoresPorArea = async (idArea) => {
  if (!idArea) {
    console.error("❌ [Service] Falta el idArea para buscar los servidores del área.");
    return [];
  }

  try {
    console.log(`📡 [Service] Buscando todos los servidores calificados para el área: [${idArea}]`);

    const { data, error } = await supabase
      .from("Servidor_Area")
      .select(`
        Id,
        IdServidor,
        Servidores (
          Nombre,
          Foto
        )
      `)
      .eq("IdAerea", idArea); // Filtramos por el ID del área en la intermedia

    if (error) {
      console.error("❌ [Service] Error en Servidor_Area:", error.message);
      return [];
    }

    // Mapeamos para devolver la data plana y limpia
    return data.map((item) => ({
      IdServidorArea: item.Id, // El ID de la relación (clave para actualizar el Cronograma luego)
      Nombre: item.Servidores?.Nombre || "Servidor sin nombre",
      Foto: item.Servidores?.Foto || null,
    }));

  } catch (err) {
    console.error("❌ [Service] Error crítico al traer servidores del área:", err);
    return [];
  }
};