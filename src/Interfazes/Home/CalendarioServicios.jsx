import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../../../Supabase/cliente";
import { obtenerProximoDiaConServicios } from "./serviciosProximos";
import GeneradorInforme from "../Componentes/GeneradorInforme"; 

export default function CalendarioServicios() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [datosFlyer, setDatosFlyer] = useState({ areas: [], asignaciones: {} });

  const navigate = useNavigate();
  const location = useLocation();
  const { fecha } = location.state || {};

  useEffect(() => {
    cargarDatos();
  }, [fecha]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // 1. Obtener los servicios del día (Columnas)
      const data = await obtenerProximoDiaConServicios(fecha);
      setServicios(data || []);

      if (data && data.length > 0) {
        // 2. Obtener las áreas de trabajo (Filas)
        const { data: areas } = await supabase
          .from("Aerea")
          .select("*")
          .order("Nombre", { ascending: true });

        // 3. Obtener asignaciones reales (Triple Join)
        const idsServicios = data.map((s) => s.Id);
        const { data: asignacionesRaw } = await supabase
          .from("Cronograma")
          .select(`
            IdServicio,
            Servidor_Area (
              IdAerea,
              Servidores ( Nombre )
            )
          `)
          .in("IdServicio", idsServicios);

        // 4. Estructurar mapa de datos para el informe
        const mapa = {};
        asignacionesRaw?.forEach((asig) => {
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
    } catch (error) {
      console.error("Error cargando calendario:", error);
      Swal.fire("Error", "No se pudo sincronizar con la base de datos", "error");
    } finally {
      setCargando(false);
    }
  };

  const fechaFormateada = servicios[0]
    ? new Date(servicios[0].Fecha + "T00:00:00").toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "Agenda";

  return (
    <div className="bg-light min-vh-100 pb-5">
      {/* HEADER DINÁMICO */}
      <div className="bg-dark text-white p-4 pb-5 rounded-bottom-5 shadow-lg">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <button onClick={() => navigate(-1)} className="btn btn-outline-light rounded-circle border-0">
            <i className="bi bi-arrow-left fs-4"></i>
          </button>
          <span className="badge rounded-pill bg-primary px-3 py-2 fw-bold">MODO GESTIÓN</span>
        </div>
        <h2 className="fw-bold text-capitalize mb-1">{fechaFormateada}</h2>
        <p className="small opacity-50 mb-0">Selecciona un servicio para editar servidores</p>
      </div>

      <div className="container" style={{ maxWidth: "600px", marginTop: "-25px" }}>
        <div className="row g-3 px-3">
          {cargando ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : (
            <>
              {/* LISTA DE TARJETAS DE SERVICIO */}
              {servicios.map((s) => (
                <div
                  key={s.Id}
                  className="col-12"
                  onClick={() => navigate("/VistaDetalleCronograma", { state: { servicio: s } })}
                >
                  <div className="card border-0 shadow-sm rounded-4 p-3 bg-white btn-card">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="badge bg-light text-dark border mb-1">{s.Jornada}</span>
                        <h6 className="fw-bold mb-0">{s.Tipo}</h6>
                      </div>
                      <i className="bi bi-chevron-right text-primary"></i>
                    </div>
                  </div>
                </div>
              ))}

              {/* COMPONENTE MODULAR DE INFORME (BOTÓN ABAJO) */}
              {servicios.length > 0 && (
                <div className="col-12 mt-4">
                  <GeneradorInforme 
                    servicios={servicios} 
                    datosFlyer={datosFlyer} 
                    fecha={servicios[0].Fecha} 
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .rounded-bottom-5 { border-bottom-left-radius: 40px; border-bottom-right-radius: 40px; }
        .btn-card { transition: all 0.2s; cursor: pointer; border: 1px solid transparent !important; }
        .btn-card:active { transform: scale(0.96); background-color: #f8f9fa !important; }
      `}</style>
    </div>
  );
}