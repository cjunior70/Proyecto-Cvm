import { supabase } from "../../../Supabase/cliente"; // 🚀 Ajusta esta ruta según dónde tengas tu cliente de Supabase

/**
 * Obtiene las métricas mensuales y anuales pre-calculadas desde las vistas de Supabase.
 * @param {string} mesSeleccionado - Formato "YYYY-MM" (Ej: "2026-06")
 * @param {string} anioSeleccionado - Formato "YYYY" (Ej: "2026")
 */
export const obtenerDatosDashboard = async (mesSeleccionado = "2026-06", anioSeleccionado = "2026") => {
  try {
    // 1. Traer los KPI generales del mes (Servicios, personas únicas y áreas usadas)
    const { data: kpis, error: errKpis } = await supabase
      .from('vista_metricas_mensuales')
      .select('*')
      .eq('MesStr', mesSeleccionado)
      .maybeSingle(); // Usamos maybeSingle por si el mes está nuevo y viene vacío

    if (errKpis) throw errKpis;

    // 2. Traer el ranking de las áreas más utilizadas en ese mes específico
    const { data: areas, error: errAreas } = await supabase
      .from('vista_ranking_areas_mensual')
      .select('*')
      .eq('MesStr', mesSeleccionado)
      .order('total_asignaciones', { ascending: false });

    if (errAreas) throw errAreas;

    // 3. Traer el flujo anual completo (los 12 meses) para armar las barras del gráfico
    const { data: flujoAnual, error: errFlujo } = await supabase
      .from('vista_metricas_mensuales')
      .select('MesStr, total_servicios')
      .like('MesStr', `${anioSeleccionado}-%`)
      .order('MesStr', { ascending: true });

    if (errFlujo) throw errFlujo;

    // 4. Traer el Top 5 de los servidores con más asistencias en todo el año
    const { data: topServidores, error: errTop } = await supabase
      .from('vista_ranking_servidores_anual')
      .select('*')
      .eq('AnioStr', anioSeleccionado)
      .order('total_asistencias', { ascending: false })
      .limit(5);

    if (errTop) throw errTop;

    // Retornamos un objeto unificado con la data lista para el frontend
    return {
      resumenMes: kpis || { total_servicios: 0, total_personas: 0, total_areas: 0 },
      rankingAreas: areas || [],
      flujoAnual: flujoAnual || [],
      topServidores: topServidores || []
    };

  } catch (error) {
    console.error("❌ Error en el servicio obtenerDatosDashboard:", error.message);
    throw error;
  }
};