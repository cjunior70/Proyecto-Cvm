import { supabase } from "../../../Supabase/cliente";

export const generarServiciosDelMes = async () => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = hoy.getMonth();

  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);

  // 🔥 1️⃣ Traer todas las áreas una sola vez
  const { data: areas, error: errorAreas } = await supabase
    .from("Aerea")
    .select("*");

  if (errorAreas) {
    console.error("Error cargando áreas:", errorAreas);
    return;
  }

  for (
    let dia = new Date(primerDia);
    dia <= ultimoDia;
    dia.setDate(dia.getDate() + 1)
  ) {
    const fechaFormateada = dia.toISOString().split("T")[0];
    const diaSemana = dia.getDay();

    const serviciosDelDia = [];

    // ===============================
    // MIERCOLES
    // ===============================
    if (diaSemana === 3) {
      serviciosDelDia.push({
        Fecha: fechaFormateada,
        Jornada: "7:00 PM",
        Tipo: "Noche de Milagros",
        Estado: "Pendiente",
        Comentario: "Una noche especial de fe y esperanza.",
      });
    }

    // ===============================
    // DOMINGOS (Jornada Unificada)
    // ===============================
    if (diaSemana === 0) {
      ["7:00 AM", "9:00 AM y 11:00 AM", "6:00 PM"].forEach((jornada) => {
        serviciosDelDia.push({
          Fecha: fechaFormateada,
          Jornada: jornada,
          Tipo: "Domingo",
          Estado: "Pendiente",
          Comentario: "Servicio dominical de adoración.",
        });
      });
    }

    // 🔥 2️⃣ Procesar cada servicio
    for (let servicio of serviciosDelDia) {
      const { data: servicioExistente } = await supabase
        .from("Servicio")
        .select("Id")
        .eq("Fecha", servicio.Fecha)
        .eq("Jornada", servicio.Jornada)
        .maybeSingle();

      let servicioId;

      if (!servicioExistente) {
        const { data: nuevoServicio, error } = await supabase
          .from("Servicio")
          .insert(servicio)
          .select()
          .single();

        if (error) {
          console.error("Error creando servicio:", error);
          continue;
        }
        servicioId = nuevoServicio.Id;
      } else {
        servicioId = servicioExistente.Id;
      }

      // 🔥 3️⃣ Determinar qué áreas van según la NUEVA jornada
      let areasFiltradas = [];

      // Validamos con el nuevo string unificado
      if (servicio.Jornada === "9:00 AM y 11:00 AM" || servicio.Jornada === "7:00 PM") {
        areasFiltradas = areas; // TODAS las áreas para el bloque central y miércoles
      }

      else if (servicio.Jornada === "7:00 AM") {
        const excluidas = ["Transmision", "Movil", "Fotografía  - Edición de Foto", "Historia", "Aseo"];
        areasFiltradas = areas.filter(area => !excluidas.includes(area.Nombre.trim()));
      }

      else if (servicio.Jornada === "6:00 PM") {
        const excluidas = ["Transmision", "Movil", "Fotografía  - Edición de Foto", "Switcher", "VideoCamara"];
        areasFiltradas = areas.filter(area => !excluidas.includes(area.Nombre.trim()));
      }

      // 🔥 4️⃣ Insertar áreas solo si el servicio es NUEVO
      // Esto evita que si recargas la página, se dupliquen las áreas en el mismo servicio
      if (!servicioExistente && areasFiltradas.length > 0) {
        const relaciones = areasFiltradas.map((area) => ({
          IdServicio: servicioId,
          IdArea: area.Id,
        }));

        const { error: errorRelacion } = await supabase
          .from("ServicioArea")
          .insert(relaciones);

        if (errorRelacion) {
          console.error("Error insertando áreas para " + servicio.Jornada, errorRelacion);
        }
      }
    }
  }

  return true;
};