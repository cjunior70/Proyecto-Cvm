import { supabase } from "../Supabase/cliente";

export const getDatosUsuario = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  return data.user; // 👈 este es el usuario autenticado
};
