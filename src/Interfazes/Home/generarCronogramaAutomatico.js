import { supabase } from "../../../Supabase/cliente";

export const generarCronogramaAutomatico = async (servicios, alTerminar) => {
  if (!servicios || servicios.length === 0) return;

  const confirmacion = window.confirm("¿Deseas asignar servidores automáticamente a estos servicios?");
  if (!confirmacion) return;

  for (const servicio of servicios) {
    const { data, error } = await supabase.rpc('generar_match_automatico', {
      p_servicio_id: servicio.Id
    });

    if (error) {
      console.error(`Error en servicio ${servicio.Tipo}:`, error.message);
    } else {
      console.log(`Resultado para ${servicio.Tipo}:`, data);
    }
  }

  alert("Proceso de cronograma terminado.");
  alTerminar(); // Para que el componente recargue los datos
};