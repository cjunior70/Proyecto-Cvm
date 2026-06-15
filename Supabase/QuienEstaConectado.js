import { supabase } from "./cliente";

/**
 * Obtiene la información del usuario actualmente autenticado.
 * @returns {Promise<object|null>} El objeto del usuario si está conectado, o null si no.
 */
export const QuienEstaConectado = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Error al obtener el usuario de Supabase:", error.message);
      return null;
    }

    return user; // Devuelve toda la info del usuario (id, email, metadatos, etc.)
  } catch (err) {
    console.error("Error inesperado en authService:", err);
    return null;
  }
};