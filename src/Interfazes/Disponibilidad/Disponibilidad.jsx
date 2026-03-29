import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../Supabase/cliente";

export default function Disponibilidad() {
  const [diasDisponibles, setDiasDisponibles] = useState([]);
  const [disponibilidadesUser, setDisponibilidadesUser] = useState([]);
  const [carga, setCarga] = useState(false);
  const navigate = useNavigate();

  // 1. Inicialización y Carga de Datos
  const inicializar = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const userId = userData.user.id;

      // VALIDACIÓN: ¿Tiene áreas asignadas?
      const { data: areas } = await supabase
        .from("Servidor_Area")
        .select("IdAerea")
        .eq("IdServidor", userId);

      if (!areas || areas.length === 0) {
        alert("Primero debes configurar tus áreas de servicio.");
        navigate("/Aereas"); // Ajusta a tu ruta de configuración
        return;
      }

      // CARGAR SERVICIOS: Agrupar por fecha única
      const hoy = new Date().toISOString().split("T")[0];
      const { data: servData, error: errServ } = await supabase
        .from("Servicio")
        .select("Fecha")
        .gte("Fecha", hoy)
        .order("Fecha", { ascending: true });

      if (errServ) throw errServ;

      // Set de fechas únicas para evitar duplicados en la lista
      const fechasUnicas = [...new Set(servData.map(s => s.Fecha))];
      setDiasDisponibles(fechasUnicas);

      // CARGAR MIS REGISTROS: Ver en qué días ya estoy anotado
      const { data: miDispo } = await supabase
        .from("Disponbilidad")
        .select("Fecha")
        .eq("IdServidor", userId);

      setDisponibilidadesUser(miDispo.map(d => d.Fecha));

    } catch (e) {
      console.error("Error en inicialización:", e);
    } finally {
      setCarga(true);
    }
  };

  // 2. Lógica de Toggle (Anotarse / Quitarse)
  const handleToggle = async (fecha) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;
      const yaRegistrado = disponibilidadesUser.includes(fecha);

      if (yaRegistrado) {
        // ACCIÓN: Eliminar registro
        const { error } = await supabase
          .from("Disponbilidad")
          .delete()
          .eq("IdServidor", userId)
          .eq("Fecha", fecha);

        if (error) throw error;
        setDisponibilidadesUser(disponibilidadesUser.filter(f => f !== fecha));
      } else {
        // ACCIÓN: Insertar registro (Comodín)
        const { error } = await supabase
          .from("Disponbilidad")
          .insert([{ IdServidor: userId, Fecha: fecha }]);

        if (error) throw error;
        setDisponibilidadesUser([...disponibilidadesUser, fecha]);
      }
    } catch (e) {
      alert("Error al actualizar disponibilidad: " + e.message);
    }
  };

  useEffect(() => {
    inicializar();
  }, []);

  // 3. Interfaz de Carga (Spinner animado)
  if (!carga) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <h6 className="fw-bold text-muted">Sincronizando servicios...</h6>
      </div>
    );
  }

  // 4. Interfaz Principal
  return (
    <section className="container py-4" style={{ maxWidth: "480px" }}>
      <header className="mb-4 text-center">
        <h4 className="fw-bold">📅 Mi Disponibilidad</h4>
        <p className="text-muted small">Selecciona los días que puedes apoyar en el servicio.</p>
      </header>

      {/* LISTA DE DÍAS ÚNICOS */}
      <div className="list-group shadow-sm rounded-4 overflow-hidden border-0">
        {diasDisponibles.length === 0 ? (
          <div className="alert alert-light text-center border">No hay servicios programados próximamente.</div>
        ) : (
          diasDisponibles.map((fecha) => {
            const yaRegistrado = disponibilidadesUser.includes(fecha);
            const dateObj = new Date(fecha + "T00:00:00");
            
            // Formateo de fecha: "domingo 29"
            const diaNombre = dateObj.toLocaleDateString("es-ES", { weekday: 'long' });
            const diaNum = dateObj.getDate();

            return (
              <button
                key={fecha}
                onClick={() => handleToggle(fecha)}
                className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-start-0 border-end-0 ${yaRegistrado ? 'bg-success-subtle' : ''}`}
                style={{ transition: 'all 0.2s ease' }}
              >
                <div className="d-flex align-items-center gap-3">
                  {/* Círculo indicador */}
                  <div 
                    className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${yaRegistrado ? 'bg-success text-white' : 'border border-primary text-primary'}`} 
                    style={{ width: '45px', height: '45px', fontSize: '1.1rem' }}
                  >
                    {yaRegistrado ? "✓" : diaNum}
                  </div>

                  <div className="text-start">
                    <div className="fw-bold text-capitalize" style={{ fontSize: '1.05rem' }}>
                      {diaNombre} {diaNum}
                    </div>
                    <small className={yaRegistrado ? "text-success fw-bold" : "text-muted"}>
                      {yaRegistrado ? "¡Estás anotado!" : "Toca para anotarte"}
                    </small>
                  </div>
                </div>

                {/* Switch visual */}
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    checked={yaRegistrado} 
                    readOnly 
                    style={{ cursor: 'pointer', width: '2.5em', height: '1.25em' }}
                  />
                </div>
              </button>
            );
          })
        )}
      </div>

      <footer className="mt-4 text-center">
        <div className="p-3 bg-light rounded-4">
          <p className="small text-muted mb-0 italic">
            <strong>Nota:</strong> Al marcar un día, el backend te asignará a los horarios disponibles según tu área configurada.
          </p>
        </div>
      </footer>
    </section>
  );
}