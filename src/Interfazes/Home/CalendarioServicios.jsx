import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../../Supabase/cliente";
import { obtenerProximoDiaConServicios } from "./serviciosProximos";
import GeneradorInforme from "../Componentes/GeneradorInforme"; 
import Swal from "sweetalert2"; // <-- Importamos SweetAlert2

export default function CalendarioServicios() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [datosFlyer, setDatosFlyer] = useState({ areas: [], asignaciones: {} });

  const navigate = useNavigate();
  const location = useLocation();
  const { fecha } = location.state || {};

  useEffect(() => { cargarDatos(); }, [fecha]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const data = await obtenerProximoDiaConServicios(fecha);
      setServicios(data || []);

      if (data && data.length > 0) {
        const { data: areas } = await supabase.from("Aerea").select("*").order("Nombre", { ascending: true });
        
        const idsServicios = data.map(s => s.Id);
        const { data: asignacionesRaw } = await supabase
          .from("Cronograma")
          .select(`IdServicio, Servidor_Area ( IdAerea, Servidores ( Nombre ) )`)
          .in("IdServicio", idsServicios);

        const mapa = {};
        asignacionesRaw?.forEach(asig => {
          const idArea = asig.Servidor_Area?.IdAerea;
          const idServ = asig.IdServicio;
          const nombre = asig.Servidor_Area?.Servidores?.Nombre;
          if (idArea && idServ) {
            if (!mapa[idArea]) mapa[idArea] = {};
            mapa[idArea][idServ] = nombre;
          }
        });
        setDatosFlyer({ areas: areas || [], asignaciones: mapa });
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setCargando(false); 
    }
  };

  // --- NUEVA FUNCIÓN PARA ELIMINAR ---
  const eliminarServicio = async (idServicio, e) => {
    e.stopPropagation(); // Evita que se abra el detalle al tocar el botón de borrar

    const confirmacion = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Se eliminará este servicio y sus asignaciones. No podrás revertirlo.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, borrar",
      cancelButtonText: "Cancelar"
    });

    if (confirmacion.isConfirmed) {
      setCargando(true);
      try {
        // Asegúrate de que el nombre de la tabla sea exactamente "Servicio" o el que uses
        const { error } = await supabase.from("Servicio").delete().eq("Id", idServicio);

        if (error) throw error;

        Swal.fire("Borrado", "El servicio ha sido eliminado.", "success");
        cargarDatos(); // Recargamos para actualizar la lista y el Flyer
      } catch (error) {
        console.error("Error eliminando:", error);
        Swal.fire("Error", "No se pudo eliminar el servicio.", "error");
        setCargando(false);
      }
    }
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      <div className="bg-dark text-white p-4 pb-5 rounded-bottom-5 shadow-lg">
        <button onClick={() => navigate(-1)} className="btn btn-outline-light rounded-circle border-0 mb-3">
          <i className="bi bi-arrow-left fs-4"></i>
        </button>
        <h2 className="fw-bold text-capitalize mb-0">
          {servicios[0] ? new Date(servicios[0].Fecha + "T00:00:00").toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Cargando...'}
        </h2>
      </div>

      <div className="container mt-n4 px-4" style={{ marginTop: '-25px' }}>
        {cargando ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : (
          <div className="row g-3">
            {servicios.map(s => (
              <div key={s.Id} className="col-12">
                <div 
                  className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden"
                  onClick={() => navigate('/VistaDetalleCronograma', { state: { servicio: s } })}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-stretch">
                    {/* LADO IZQUIERDO: INFORMACIÓN */}
                    <div className="p-3 flex-grow-1">
                      <span className="badge bg-light text-primary border mb-1">{s.Jornada}</span>
                      <h6 className="fw-bold mb-0 text-dark">{s.Tipo}</h6>
                      <small className="text-muted">Toca para ver detalles</small>
                    </div>

                    {/* LADO DERECHO: BOTÓN RECTANGULAR DE ELIMINAR */}
                    <div 
                      onClick={(e) => eliminarServicio(s.Id, e)}
                      className="d-flex align-items-center justify-content-center px-4"
                      style={{ 
                        background: '#fff5f5', 
                        borderLeft: '1px solid #fee2e2',
                        transition: '0.3s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#fff5f5'}
                    >
                      <div className="text-center">
                        <i className="bi bi-trash3-fill text-danger d-block fs-4"></i>
                        <span className="text-danger fw-bold" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Eliminar</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Botón de WhatsApp al final */}
            {servicios.length > 0 && (
              <div className="col-12 mt-4">
                <GeneradorInforme servicios={servicios} datosFlyer={datosFlyer} fecha={fecha} />
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`.rounded-bottom-5 { border-bottom-left-radius: 40px; border-bottom-right-radius: 40px; }`}</style>
    </div>
  );
}