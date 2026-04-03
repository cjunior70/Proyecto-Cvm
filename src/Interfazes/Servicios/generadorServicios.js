import { supabase } from "../../../Supabase/cliente";

export const generarServiciosDelMes = async () => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = hoy.getMonth();

  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);

  // 1. Traer datos base en paralelo
  const [{ data: areas }, { data: serviciosExistentes }] = await Promise.all([
    supabase.from("Aerea").select("*"),
    supabase.from("Servicio").select("Fecha, Jornada, Id").gte("Fecha", primerDia.toISOString().split("T")[0])
  ]);

  const serviciosParaInsertar = [];
  
  // Generar lógica de fechas en memoria (sin tocar la red aún)
  for (let dia = new Date(primerDia); dia <= ultimoDia; dia.setDate(dia.getDate() + 1)) {
    const fechaFormateada = dia.toISOString().split("T")[0];
    const diaSemana = dia.getDay();

    if (diaSemana === 3) { // Miércoles
        serviciosParaInsertar.push({
            Fecha: fechaFormateada, Jornada: "7:00 PM", Tipo: "Noche de Milagros",
            Estado: "Pendiente", Comentario: "Una noche especial de fe."
        });
    }

    if (diaSemana === 0) { // Domingos
      ["7:00 AM", "9:00 AM y 11:00 AM", "6:00 PM"].forEach(jornada => {
        serviciosParaInsertar.push({
            Fecha: fechaFormateada, Jornada: jornada, Tipo: "Domingo",
            Estado: "Pendiente", Comentario: "Servicio dominical."
        });
      });
    }
  }

  // 2. Filtrar solo los que NO existen para evitar duplicados
  const nuevos = serviciosParaInsertar.filter(s => 
    !serviciosExistentes?.some(e => e.Fecha === s.Fecha && e.Jornada === s.Jornada)
  );

  if (nuevos.length === 0) return serviciosExistentes;

  // 3. INSERTAR TODOS DE GOLPE (Mucho más rápido)
  const { data: insertados, error } = await supabase
    .from("Servicio")
    .insert(nuevos)
    .select();

  if (error) return null;

  // 4. Preparar relaciones de áreas (ServicioArea)
  const relacionesAreas = [];
  insertados.forEach(s => {
    let areasFiltradas = [];
    if (s.Jornada === "9:00 AM y 11:00 AM" || s.Jornada === "7:00 PM") {
        areasFiltradas = areas;
    } else if (s.Jornada === "7:00 AM") {
        const excluidas = ["Transmision", "Movil", "Fotografía - Edición de Foto", "Historia", "Aseo"];
        areasFiltradas = areas.filter(a => !excluidas.includes(a.Nombre.trim()));
    } else if (s.Jornada === "6:00 PM") {
        const excluidas = ["Transmision", "Movil", "Fotografía - Edición de Foto", "Switcher", "VideoCamara"];
        areasFiltradas = areas.filter(a => !excluidas.includes(a.Nombre.trim()));
    }

    areasFiltradas.forEach(a => {
        relacionesAreas.push({ IdServicio: s.Id, IdArea: a.Id });
    });
  });

  // Insertar todas las relaciones de una vez
  if (relacionesAreas.length > 0) {
    await supabase.from("ServicioArea").insert(relacionesAreas);
  }

  return [...serviciosExistentes, ...insertados];
};