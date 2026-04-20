import { supabase } from "../../../Supabase/cliente";
import Swal from "sweetalert2";

export const generarCronogramaAutomatico = async (alTerminar) => {
  try {
    // 1. Ejecutar el motor para servidores con fecha fija
    const { data: dataFijos, error: errorFijos } = await supabase.rpc(
      "automatizar_cronograma_proximo_mes"
    );
    if (errorFijos) throw errorFijos;

    // 2. Ejecutar el motor de comodines (el que acabamos de crear)
    const { data: dataComodines, error: errorComodines } = await supabase.rpc(
      "asignar_comodines_proximo_mes"
    );
    if (errorComodines) throw errorComodines;

    // 3. Extraer los conteos (asumiendo que tus funciones retornan un entero o un objeto con total_asignados)
    // Nota: Como definimos la función con RETURNS TABLE, data suele ser un array de objetos
    const conteoFijos = dataFijos?.[0]?.total_asignados || 0;
    const conteoComodines = dataComodines?.[0]?.total_asignados || 0;
    const totalGeneral = conteoFijos + conteoComodines;

    // Mensaje de éxito inteligente
    Swal.fire({
      title: "¡Cronograma Generado!",
      text: `Se han realizado ${totalGeneral} asignaciones en total para el próximo mes.`,
      icon: "success",
      confirmButtonColor: "#0d6efd",
      timer: 3500,
      showConfirmButton: false
    });

    if (alTerminar) alTerminar();
    return totalGeneral;

  } catch (error) {
    console.error("Error en la generación:", error);
    Swal.fire({
      title: "Error de Procesamiento",
      text: "Hubo un problema: " + (error.message || "Error desconocido"),
      icon: "error",
      confirmButtonColor: "#dc3545"
    });
    return null;
  }
};