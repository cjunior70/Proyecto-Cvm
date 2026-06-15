import React, { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";

export default function DatosServidores({ servidor, onClose }) {
  const [todasAreas, setTodasAreas] = useState([]);
  const [asignadas, setAsignadas] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [servidor]);

  const cargarDatos = async () => {
    setCargando(true);
    const { data: areas } = await supabase
      .from("Aerea")
      .select("*")
      .order("Nombre");
    const { data: rel } = await supabase
      .from("Servidor_Area")
      .select("IdAerea")
      .eq("IdServidor", servidor.Id);
    setTodasAreas(areas || []);
    setAsignadas(rel?.map((r) => r.IdAerea) || []);
    setCargando(false);
  };

  const toggleArea = async (idArea) => {
    const yaExiste = asignadas.includes(idArea);
    if (yaExiste) {
      await supabase
        .from("Servidor_Area")
        .delete()
        .eq("IdServidor", servidor.Id)
        .eq("IdAerea", idArea);
      setAsignadas(asignadas.filter((id) => id !== idArea));
    } else {
      await supabase
        .from("Servidor_Area")
        .insert([{ IdServidor: servidor.Id, IdAerea: idArea }]);
      setAsignadas([...asignadas, idArea]);
    }
  };

  // Determinar color de badge de disponibilidad según estado real
  const esLibre = servidor.Estado === "Libre";

  return (
    <div
      className="position-fixed bottom-0 start-0 w-100 bg-white d-flex flex-column animate-slide-up"
      style={{
        height: "calc(100% - 60px)",
        zIndex: 1500,
        boxShadow: "0px -10px 30px rgba(0,0,0,0.18)",
        borderTopLeftRadius: "32px",
        borderTopRightRadius: "32px",
        overflow: "hidden",
      }}
    >
      {/* 🔝 HEADER: ESTILO OSCURO NEÓN PREMIUM */}
      <div
        className="position-relative p-4 pt-5 text-center text-white"
        style={{
          background: "linear-gradient(145deg, #1f2327 0%, #111315 100%)",
          borderBottom: "4px solid #0d6efd",
        }}
      >
        {/* Botón Volver Rediseñado */}
        {/* ✕ Botón de Cerrar Universal (Sin dependencias) */}
        <button
          className="btn position-absolute top-0 start-0 m-3 d-flex align-items-center justify-content-center transition-btn"
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.15)", // Un poco más claro para que resalte más
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "#ffffff",
            fontSize: "1.2rem",
            fontWeight: "900", // Súper negrita para la X
            lineHeight: 1,
            padding: 0,
          }}
          onClick={onClose}
        >
          ✕
        </button>

        {/* Bloque de Perfil Centralizado */}
        <div className="mt-1 animate-pop">
          <div className="position-relative d-inline-block">
            <img
              src={
                servidor.Foto ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${servidor.Nombre}`
              }
              className="rounded-circle border border-4 border-white shadow-lg object-fit-cover"
              style={{ width: "90px", height: "90px" }}
            />
            {/* Indicador de disponibilidad inteligente con efecto pulso */}
            <span
              className={`position-absolute bottom-0 end-0 border border-3 border-dark rounded-circle ${esLibre ? "bg-success pulse-green" : "bg-warning pulse-orange"}`}
              style={{
                width: "22px",
                height: "22px",
                transform: "translate(-5px, -5px)",
              }}
            ></span>
          </div>

          <h4
            className="fw-black text-white mb-1 mt-2.5"
            style={{ letterSpacing: "-0.5px", fontSize: "1.4rem" }}
          >
            {servidor.Nombre}
          </h4>

          <span
            className={`badge mt-1.5 px-3 py-1.5 rounded-pill font-monospace fw-bold tracking-wider shadow-sm ${
              esLibre ? "text-bg-success" : "text-bg-warning"
            }`}
            style={{ fontSize: "10px" }}
          >
            ● {servidor.Estado?.toUpperCase() || "LIBRE"}
          </span>
        </div>
      </div>

      {/* 📂 CUERPO DE LA FICHA TÁCTIL */}
      <div
        className="p-4 flex-grow-1 overflow-auto"
        style={{
          background: "#f1f3f6",
          paddingBottom: "120px", // 💡 ¡ESTA ES LA MAGIA! Deja un colchón de espacio para que tu menú de abajo no tape nada
        }}
      >
        {/* Cabecera de Sección */}
        <div className="d-flex align-items-center justify-content-between mb-3.5 px-1">
          <h6
            className="fw-extrabold text-secondary m-0 font-monospace"
            style={{ fontSize: "11px", letterSpacing: "1px" }}
          >
            PERMISOS & ÁREAS HABILITADAS
          </h6>
          <span
            className="badge bg-white text-dark rounded-pill shadow-xs border px-2.5 py-1 fw-bold"
            style={{ fontSize: "11px" }}
          >
            {asignadas.length} Áreas
          </span>
        </div>

        {/* Renderizado de Áreas */}
        {cargando ? (
          <div className="text-center py-5 my-5">
            <div
              className="spinner-border text-primary"
              role="status"
              style={{ width: "2.5rem", height: "2.5rem" }}
            ></div>
            <p className="text-muted mt-2 small font-monospace">
              Sincronizando con Supabase...
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2.5">
            {todasAreas.map((area) => {
              const estaAsignada = asignadas.includes(area.Id);

              return (
                <div key={area.Id} className="w-100">
                  {/* ... todo tu código de la tarjeta del área se mantiene exactamente igual ... */}
                  <div
                    onClick={() => toggleArea(area.Id)}
                    className={`card-tactil p-3 rounded-4 d-flex align-items-center justify-content-between border transition-all ${
                      estaAsignada
                        ? "bg-white border-primary shadow-sm"
                        : "bg-white border-light-subtle opacity-90"
                    }`}
                    style={{
                      cursor: "pointer",
                      borderLeft: estaAsignada
                        ? "6px solid #0d6efd"
                        : "6px solid #b0b8c1",
                    }}
                  >
                    {/* Contenido de la tarjeta */}
                    <div className="d-flex align-items-center">
                      <div
                        className={`p-2 rounded-3 me-3 d-flex align-items-center justify-content-center transition-all ${
                          estaAsignada
                            ? "bg-primary text-white shadow-sm"
                            : "bg-light text-muted border"
                        }`}
                        style={{
                          width: "34px",
                          height: "34px",
                          fontSize: "0.9rem",
                        }}
                      >
                        {estaAsignada ? "✓" : "○"}
                      </div>
                      <span
                        className={`fw-bold ${estaAsignada ? "text-dark" : "text-secondary"}`}
                        style={{ fontSize: "14.5px" }}
                      >
                        {area.Nombre}
                      </span>
                    </div>

                    <div className="form-check form-switch m-0 pointer-events-none">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={estaAsignada}
                        readOnly
                        style={{ width: "2.2em", height: "1.1em" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 💎 ESTILOS CSS REFINADOS */}
      <style>{`
        .fw-black { font-weight: 900; }
        .fw-extrabold { font-weight: 800; }
        
        /* Animación suave de apertura hacia arriba tipo hoja nativa */
        .animate-slide-up { 
          animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
        .animate-pop { 
          animation: popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); 
        }
        
        @keyframes slideUp { 
          from { transform: translateY(100%); } 
          to { transform: translateY(0); } 
        }
        @keyframes popIn { 
          from { transform: scale(0.85); opacity: 0; } 
          to { transform: scale(1); opacity: 1; } 
        }
        
        /* Efectos Táctiles */
        .card-tactil {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-tactil:active {
          transform: scale(0.97);
          background-color: #f8fafc !important;
        }
        .transition-btn:active {
          transform: scale(0.9);
          background: rgba(255,255,255,0.2) !important;
        }
        
        /* Efectos de pulso neón para estados */
        .pulse-green {
          box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.7);
          animation: pulseG 2s infinite;
        }
        .pulse-orange {
          box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7);
          animation: pulseO 2s infinite;
        }
        
        @keyframes pulseG {
          70% { box-shadow: 0 0 0 8px rgba(25, 135, 84, 0); }
          100% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0); }
        }
        @keyframes pulseO {
          70% { box-shadow: 0 0 0 8px rgba(25, 193, 7, 0); }
          100% { box-shadow: 0 0 0 0 rgba(25, 193, 7, 0); }
        }
      `}</style>
    </div>
  );
}
