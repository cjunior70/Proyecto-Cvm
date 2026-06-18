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

  const esLibre = servidor.Estado === "Libre";

  return (
    <div
      className="position-fixed bottom-0 start-50 bg-white d-flex flex-column animate-slide-up"
      style={{
        width: "100%",
        maxWidth: "600px", // 💡 IGUALA EL ANCHO DEL CONTENEDOR PADRE
        height: "calc(100% - 60px)",
        zIndex: 1500,
        boxShadow: "0px -10px 35px rgba(15, 23, 42, 0.22)",
        borderTopLeftRadius: "28px",
        borderTopRightRadius: "28px",
        overflow: "hidden",
        transform: "translateX(-50%)", // 💡 CENTRA LA FICHA AUTOMÁTICAMENTE EN ESCRITORIO
      }}
    >
      {/* 🔝 HEADER: GRADIENTE PREMIUM CORPORATIVO */}
      <div
        className="position-relative p-4 pt-5 text-center text-white"
        style={{
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          borderBottom: "4px solid #6E4BDB", // Cambiado de azul genérico al morado de la app
        }}
      >
        {/* ✕ Botón de Cerrar Universal */}
        <button
          className="btn position-absolute top-0 start-0 m-3 d-flex align-items-center justify-content-center transition-btn"
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#ffffff",
            fontSize: "1rem",
            fontWeight: "900",
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
              style={{ width: "84px", height: "84px" }}
              alt={servidor.Nombre}
            />
            <span
              className={`position-absolute bottom-0 end-0 border border-3 border-dark rounded-circle ${esLibre ? "bg-success pulse-green" : "bg-warning pulse-orange"}`}
              style={{
                width: "20px",
                height: "20px",
                transform: "translate(-3px, -3px)",
              }}
            ></span>
          </div>

          <h5
            className="fw-bold text-white mb-0 mt-2"
            style={{ letterSpacing: "-0.5px", fontSize: "1.25rem" }}
          >
            {servidor.Nombre}
          </h5>

          <span
            className="badge mt-1.5 px-3 py-1.5 rounded-pill font-monospace fw-bold tracking-wider shadow-sm"
            style={{ 
              fontSize: "9px",
              color: esLibre ? "#22C55E" : "#EAB308",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: `1px solid ${esLibre ? "rgba(34, 197, 94, 0.2)" : "rgba(234, 179, 8, 0.2)"}`
            }}
          >
            ● {servidor.Estado?.toUpperCase() || "LIBRE"}
          </span>
        </div>
      </div>

      {/* 📂 CUERPO DE LA FICHA TÁCTIL */}
      <div
        className="p-4 flex-grow-1 overflow-auto"
        style={{
          background: "#F8FAFC",
          paddingBottom: "120px", 
        }}
      >
        {/* Cabecera de Sección */}
        <div className="d-flex align-items-center justify-content-between mb-3 px-1">
          <h6
            className="fw-bold text-secondary m-0 font-monospace"
            style={{ fontSize: "10.5px", letterSpacing: "0.8px" }}
          >
            PERMISOS & ÁREAS HABILITADAS
          </h6>
          <span
            className="badge bg-white text-dark rounded-pill shadow-xs border px-2.5 py-1 fw-bold"
            style={{ fontSize: "10.5px" }}
          >
            {asignadas.length} Áreas
          </span>
        </div>

        {/* Renderizado de Áreas */}
        {cargando ? (
          <div className="text-center py-5 my-5">
            <div
              className="spinner-border"
              role="status"
              style={{ width: "2.2rem", height: "2.2rem", color: "#6E4BDB" }}
            ></div>
            <p className="text-muted mt-2 small font-monospace" style={{ fontSize: '11px' }}>
              Sincronizando con Supabase...
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {todasAreas.map((area) => {
              const estaAsignada = asignadas.includes(area.Id);

              return (
                <div key={area.Id} className="w-100">
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
                        ? "5px solid #6E4BDB" // Sintonizado con tu color morado
                        : "5px solid #CBD5E1",
                      borderColor: estaAsignada ? "#6E4BDB" : "#E2E8F0"
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <div
                        className={`p-2 rounded-3 me-3 d-flex align-items-center justify-content-center transition-all ${
                          estaAsignada
                            ? "text-white shadow-sm"
                            : "bg-light text-muted border"
                        }`}
                        style={{
                          width: "32px",
                          height: "32px",
                          fontSize: "0.85rem",
                          backgroundColor: estaAsignada ? "#6E4BDB" : "#F1F5F9"
                        }}
                      >
                        {estaAsignada ? "✓" : "○"}
                      </div>
                      <span
                        className={`fw-bold ${estaAsignada ? "text-dark" : "text-secondary"}`}
                        style={{ fontSize: "13.5px" }}
                      >
                        {area.Nombre}
                      </span>
                    </div>

                    <div className="form-check form-switch m-0" style={{ pointerEvents: "none" }}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={estaAsignada}
                        readOnly
                        style={{ width: "2.1em", height: "1.05em", cursor: "pointer" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 💎 ESTILOS CSS REFINADOS FIX RESPONSIVE */}
      <style>{`
        .animate-slide-up { 
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
        .animate-pop { 
          animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); 
        }
        
        @keyframes slideUp { 
          from { transform: translate(-50%, 100%); } 
          to { transform: translate(-50%, 0); } 
        }
        @keyframes popIn { 
          from { transform: scale(0.9); opacity: 0; } 
          to { transform: scale(1); opacity: 1; } 
        }
        
        .card-tactil {
          transition: all 0.15s ease-in-out;
        }
        .card-tactil:active {
          transform: scale(0.98);
          background-color: #F8FAFC !important;
        }
        .transition-btn:active {
          transform: scale(0.92);
        }
        
        .pulse-green {
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          animation: pulseG 2s infinite;
        }
        .pulse-orange {
          box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.7);
          animation: pulseO 2s infinite;
        }
        
        @keyframes pulseG {
          70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        @keyframes pulseO {
          70% { box-shadow: 0 0 0 6px rgba(234, 179, 8, 0); }
          100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
        }
      `}</style>
    </div>
  );
}