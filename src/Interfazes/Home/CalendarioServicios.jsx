import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
    } catch (e) { console.error(e); } finally { setCargando(false); }
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
              <div key={s.Id} className="col-12" onClick={() => navigate('/VistaDetalleCronograma', { state: { servicio: s } })}>
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="badge bg-light text-primary border mb-1">{s.Jornada}</span>
                      <h6 className="fw-bold mb-0">{s.Tipo}</h6>
                    </div>
                    <i className="bi bi-chevron-right text-muted"></i>
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