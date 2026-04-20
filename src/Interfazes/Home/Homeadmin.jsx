import React, { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";
import CardDiaCalendario from "../Componentes/CardDiaCalendario"; 
import { generarCronogramaAutomatico } from "./generarCronogramaAutomatico"; 
import Swal from "sweetalert2"; // Librería para mensajes elegantes

export default function Homeadmin() {
  const [agenda, setAgenda] = useState({});
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [adminName, setAdminName] = useState("Rey");

  const cargar = async () => {
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setAdminName(user?.user_metadata?.full_name?.split(" ")[0] || "Rey");

      const hoy = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from("Servicio")
        .select("*")
        .gte("Fecha", hoy)
        .order("Fecha", { ascending: true });

      const agrupados = (data || []).reduce((acc, s) => {
        acc[s.Fecha] = acc[s.Fecha] || [];
        acc[s.Fecha].push(s);
        return acc;
      }, {});

      setAgenda(agrupados);
    } catch (error) {
      console.error("Error cargando agenda:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const manejarGeneracion = async () => {
    const confirmacion = await Swal.fire({
      title: '¿Automatizar Cronograma?',
      text: "Se asignarán servidores fijos a todos los servicios del próximo mes.",
      icon: 'magic', // Icono de magia si la librería lo soporta o 'question'
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, automatizar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!confirmacion.isConfirmed) return;

    setGenerando(true);
    try {
      const resultado = await generarCronogramaAutomatico();
      
      if (resultado > 0) {
        await Swal.fire({
          title: '¡Proceso Completado!',
          text: `Se han realizado ${resultado} asignaciones automáticas con éxito.`,
          icon: 'success',
          timer: 2500,
          showConfirmButton: false
        });
        await cargar();
      } else {
        Swal.fire('Sin novedades', 'No se encontraron servidores fijos pendientes por asignar.', 'info');
      }
    } catch (err) {
      Swal.fire('Error', 'Hubo un fallo en la base de datos: ' + err.message, 'error');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 pb-5 position-relative">
      
      {/* HEADER TOP */}
      <div className="bg-dark text-white p-4 pb-5 rounded-bottom-5 shadow-lg">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold mb-0">¡Bienvenido, {adminName}!</h2>
            <p className="opacity-75 small mb-0">Gestión de Agenda CVM</p>
          </div>
          <div className="bg-primary p-2 rounded-circle shadow-sm">
             <i className="bi bi-person-badge fs-4"></i>
          </div>
        </div>
      </div>

      {/* CONTENIDO DE LA AGENDA */}
      <div className="container" style={{ marginTop: '-25px' }}>
        {cargando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Sincronizando...</p>
          </div>
        ) : Object.keys(agenda).length === 0 ? (
          <div className="text-center py-5 bg-white rounded-4 shadow-sm">
            <i className="bi bi-calendar-x fs-1 text-muted"></i>
            <p className="mt-2">No hay servicios próximos.</p>
          </div>
        ) : (
          Object.entries(agenda).map(([fecha, servicios]) => (
            <CardDiaCalendario key={fecha} fecha={fecha} servicios={servicios} />
          ))
        )}
      </div>

      {/* BOTÓN FLOTANTE (FAB) */}
      <button 
        onClick={manejarGeneracion}
        disabled={generando}
        className="btn btn-primary d-flex flex-column align-items-center justify-content-center shadow-lg border-0"
        style={{ 
          position: 'fixed',
          bottom: '20vw', 
          right: '25px', 
          width: '75px', 
          height: '75px', 
          borderRadius: '40px', // Estilo moderno tipo iOS/Squircle
          zIndex: '9999', 
          background: 'linear-gradient(135deg, #0d6efd 0%, #00d4ff 100%)',
          border: '4px solid white !important',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        {generando ? (
          <span className="spinner-border spinner-border-sm"></span>
        ) : (
          <>
            <i className="bi bi-magic fs-3"></i>
            <span style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', marginTop: '2px' }}>Auto</span>
          </>
        )}
      </button>

      {/* ESTILOS DINÁMICOS */}
      <style>{`
        .rounded-bottom-5 { 
            border-bottom-left-radius: 40px; 
            border-bottom-right-radius: 40px; 
        }
        button:hover {
            transform: translateY(-8px) scale(1.05);
            box-shadow: 0 15px 30px rgba(13, 110, 253, 0.4) !important;
        }
        button:active {
            transform: scale(0.9);
        }
      `}</style>

    </div>
  );
}