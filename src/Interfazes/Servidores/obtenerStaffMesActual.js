import { supabase } from "../../../Supabase/cliente";

// 🔄 1. Traer todos los servidores con el conteo del mes desde la Vista
export const obtenerStaffMesActual = async () => {
  try {
    const { data, error } = await supabase
      .from("vista_staff_mes_actual")
      .select("*")
      .order("Nombre", { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error en obtenerStaffMesActual:", error.message);
    return [];
  }
};

// ✏️ 2. Actualizar el nombre de un servidor directamente
export const actualizarNombreServidor = async (id, nuevoNombre) => {
  try {
    const { data, error } = await supabase
      .from("Servidores")
      .update({ Nombre: nuevoNombre })
      .eq("Id", id)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error al actualizar nombre:", error.message);
    return { success: false, error: error.message };
  }
};