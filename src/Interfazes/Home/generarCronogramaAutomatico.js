import { supabase } from "../../../Supabase/cliente";
import Swal from "sweetalert2";

export const generarCronogramaAutomatico = async (servicios, alTerminar) => {
  if (!servicios || servicios.length === 0) return;

  try {
    // Recorremos los servicios para ejecutar las funciones en la base de datos
    for (const servicio of servicios) {
      
      // 1. Ejecutar Fijos
      await supabase.rpc("asignar_servidores_fijos", { 
        p_fecha: servicio.Fecha 
      });

      // 2. Ejecutar Disponibles (Llenar huecos)
      await supabase.rpc("asignar_comodines_disponibles", { 
        p_fecha: servicio.Fecha 
      });
    }

    // Mensaje de éxito minimalista
    Swal.fire({
      title: "¡Cronograma Listo!",
      text: "Se han completado las asignaciones para los próximos servicios.",
      icon: "success",
      confirmButtonColor: "#0d6efd",
      timer: 2500,
      showConfirmButton: false // Se cierra solo para mayor fluidez
    });

    // Refrescar la vista
    if (alTerminar) alTerminar();

  } catch (error) {
    console.error("Error en la generación:", error);
    Swal.fire({
      title: "Nota",
      text: "Hubo un inconveniente al procesar algunos turnos.",
      icon: "error",
      confirmButtonColor: "#dc3545"
    });
  }
};