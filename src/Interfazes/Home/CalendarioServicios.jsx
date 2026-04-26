import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../../Supabase/cliente";
import { obtenerProximoDiaConServicios } from "./serviciosProximos";
import GeneradorInforme from "../Componentes/GeneradorInforme"; 
import Swal from "sweetalert2";

export default function CalendarioServicios() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [datosFlyer, setDatosFlyer] = useState({ areas: [], asignaciones: {} });

  const navigate = useNavigate();
  const location = useLocation();
  const { fecha } = location.state || {};

  // Estados nuevos para el rango sin tocar los anteriores
  const [mostrarModal, setMostrarModal] = useState(false);
  const [rango, setRango] = useState({ apertura: '', cierre: '' });
  const [enviando, setEnviando] = useState(false);

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

  const guardarRangoEspecífico = async () => {
    if (!rango.apertura || !rango.cierre) return Swal.fire("Hey", "Llena los campos", "info");
    setEnviando(true);
    try {
      const fechaServicio = servicios[0].Fecha;
      const fechaObj = new Date(fechaServicio + "T00:00:00");
      const { error } = await supabase.from('Control_Disponibilidad').insert([{
          Mes: fechaObj.getMonth() + 1,
          Año: fechaObj.getFullYear(),
          Fecha_especifica: fechaServicio,
          Fecha_apertura: rango.apertura,
          Fecha_cierre: rango.cierre,
          Descripcion: `Rango especial para ${fechaServicio}`
      }]);
      if (error) throw error;
      Swal.fire("Éxito", "Rango configurado", "success");
      setMostrarModal(false);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se guardó", "error");
    } finally { setEnviando(false); }
  };

  const eliminarServicio = async (idServicio, e) => {
    e.stopPropagation();
    const confirmacion = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Se eliminará el servicio.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, borrar"
    });
    if (confirmacion.isConfirmed) {
      setCargando(true);
      try {
        const { error } = await supabase.from("Servicio").delete().eq("Id", idServicio);
        if (error) throw error;
        cargarDatos();
      } catch (error) {
        console.error(error);
        setCargando(false);
      }
    }
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      <div className="bg-dark text-white p-4 pb-5 rounded-bottom-5 shadow-lg">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button onClick={() => navigate(-1)} className="btn btn-outline-light rounded-circle border-0">
            <i className="bi bi-arrow-left fs-4"></i>
          </button>
          {/* Botón de Rango añadido sin romper el estilo */}
          <button onClick={() => setMostrarModal(true)} className="btn btn-primary rounded-pill px-3 btn-sm fw-bold border-0 shadow">
             Rango
          </button>
        </div>
        <h2 className="fw-bold text-capitalize mb-0">
          {servicios[0] ? new Date(servicios[0].Fecha + "T00:00:00").toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Cargando...'}
        </h2>
      </div>

      <div className="container mt-n4 px-4" style={{ marginTop: '-25px' }}>
        {cargando ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : (
          <div className="row g-3">
            {/* AQUÍ ESTÁ TU LÓGICA DE SERVICIOS INTACTA */}
            {servicios.map(s => (
              <div key={s.Id} className="col-12">
                <div 
                  className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden"
                  onClick={() => navigate('/VistaDetalleCronograma', { state: { servicio: s } })}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-stretch">
                    <div className="p-3 flex-grow-1">
                      <span className="badge bg-light text-primary border mb-1">{s.Jornada}</span>
                      <h6 className="fw-bold mb-0 text-dark">{s.Tipo}</h6>
                      <small className="text-muted">Toca para ver detalles</small>
                    </div>

                    <div 
                      onClick={(e) => eliminarServicio(s.Id, e)}
                      className="d-flex align-items-center justify-content-center px-4"
                      style={{ background: '#fff5f5', borderLeft: '1px solid #fee2e2' }}
                    >
                      <div className="text-center text-danger">
                        <i className="bi bi-trash3-fill d-block fs-4"></i>
                        <span className="fw-bold" style={{ fontSize: '10px' }}>ELIMINAR</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {servicios.length > 0 && (
              <div className="col-12 mt-4">
                <GeneradorInforme servicios={servicios} datosFlyer={datosFlyer} fecha={fecha} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal del rango al final para que no estorbe */}
      {mostrarModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered px-3">
            <div className="modal-content rounded-4 border-0">
              <div className="modal-body p-4 text-dark">
                <h5 className="fw-bold">Rango de Inscripción</h5>
                <input type="date" className="form-control mb-2" onChange={(e) => setRango({...rango, apertura: e.target.value})} />
                <input type="date" className="form-control mb-3" onChange={(e) => setRango({...rango, cierre: e.target.value})} />
                <div className="d-flex gap-2">
                  <button className="btn btn-light w-100" onClick={() => setMostrarModal(false)}>Cerrar</button>
                  <button className="btn btn-primary w-100" onClick={guardarRangoEspecífico} disabled={enviando}>Guardar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`.rounded-bottom-5 { border-bottom-left-radius: 40px; border-bottom-right-radius: 40px; }`}</style>
    </div>
  );
}