import { supabase } from "../../../Supabase/cliente";

export const generarServiciosDelMes = async () => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = hoy.getMonth();

  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);

  // 1. Traer datos base
  const [{ data: areas }, { data: serviciosExistentes }] = await Promise.all([
    supabase.from("Aerea").select("*"),
    supabase.from("Servicio").select("Fecha, Jornada, Id, Tipo").gte("Fecha", primerDia.toISOString().split("T")[0])
  ]);

  const serviciosParaInsertar = [];
  
  for (let dia = new Date(primerDia); dia <= ultimoDia; dia.setDate(dia.getDate() + 1)) {
    const fechaFormateada = dia.toISOString().split("T")[0];
    const diaSemana = dia.getDay();

    // MIÉRCOLES: Configuración Noche de Milagros
    if (diaSemana === 3) { 
      ["6:00 PM", "7:30 PM"].forEach(jornada => {
        serviciosParaInsertar.push({
          Fecha: fechaFormateada, 
          Jornada: jornada, 
          Tipo: "Noche de Milagros",
          Estado: "Pendiente", 
          Comentario: "Servicio de entre semana."
        });
      });
    }

    // DOMINGOS: Configuración tradicional
    if (diaSemana === 0) { 
      ["7:00 AM", "9:00 AM y 11:00 AM", "6:00 PM"].forEach(jornada => {
        serviciosParaInsertar.push({
          Fecha: fechaFormateada, Jornada: jornada, Tipo: "Domingo",
          Estado: "Pendiente", Comentario: "Servicio dominical."
        });
      });
    }
  }

  // 2. Filtrar duplicados
  const nuevos = serviciosParaInsertar.filter(s => 
    !serviciosExistentes?.some(e => e.Fecha === s.Fecha && e.Jornada === s.Jornada)
  );

  if (nuevos.length === 0) return serviciosExistentes;

  // 3. Insertar servicios
  const { data: insertados, error } = await supabase.from("Servicio").insert(nuevos).select();
  if (error) return null;

  // 4. Lógica de Relación de Áreas
  const relacionesAreas = [];
  
  insertados.forEach(s => {
    let areasFiltradas = [];

    // --- LÓGICA MIÉRCOLES (Noche de Milagros) ---
    if (s.Tipo === "Noche de Milagros") {
      if (s.Jornada === "6:00 PM") {
        // Todas MENOS: transmision, switcher, movil, videocamara, aseo
        const excluidasM6 = ["Transmision", "Switcher", "Movil", "VideoCamara", "Aseo"];
        areasFiltradas = areas.filter(a => 
          !excluidasM6.some(ex => ex.toLowerCase() === a.Nombre.trim().toLowerCase())
        );
      } 
      else if (s.Jornada === "7:30 PM") {
        // Todas MENOS: fotografía
        areasFiltradas = areas.filter(a => 
          !a.Nombre.trim().toLowerCase().includes("fotografía") && 
          !a.Nombre.trim().toLowerCase().includes("fotografia")
        );
      }
    }

    // --- LÓGICA DOMINGOS ---
    else if (s.Tipo === "Domingo") {
      if (s.Jornada === "9:00 AM y 11:00 AM") {
        areasFiltradas = areas; // Equipo completo
      } 
      else if (s.Jornada === "7:00 AM") {
        const excluidasD7 = ["Transmision", "Movil", "Fotografía - Edición de Foto", "Historia", "Aseo"];
        areasFiltradas = areas.filter(a => 
          !excluidasD7.some(ex => ex.toLowerCase() === a.Nombre.trim().toLowerCase())
        );
      } 
      else if (s.Jornada === "6:00 PM") {
        const excluidasD6 = ["Transmision", "Movil", "Fotografía - Edición de Foto", "Switcher", "VideoCamara"];
        areasFiltradas = areas.filter(a => 
          !excluidasD6.some(ex => ex.toLowerCase() === a.Nombre.trim().toLowerCase())
        );
      }
    }

    // Llenar el array de relaciones
    areasFiltradas.forEach(a => {
        relacionesAreas.push({ IdServicio: s.Id, IdArea: a.Id });
    });
  });

  // 5. Inserción masiva de relaciones
  if (relacionesAreas.length > 0) {
    await supabase.from("ServicioArea").insert(relacionesAreas);
  }

  return [...serviciosExistentes, ...insertados];
};