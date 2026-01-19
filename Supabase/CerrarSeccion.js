import { supabase } from "../Supabase/cliente";

export const CerrarSeccion = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error al cerrar sesión:", error);
    alert("No se pudo cerrar sesión");
    return false;
  }

  return true;
};
