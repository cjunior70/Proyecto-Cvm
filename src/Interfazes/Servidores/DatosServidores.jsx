import { useEffect, useState } from "react";
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
    const { data: areas } = await supabase.from("Aerea").select("*").order("Nombre");
    const { data: rel } = await supabase.from("Servidor_Area").select("IdAerea").eq("IdServidor", servidor.Id);
    setTodasAreas(areas || []);
    setAsignadas(rel?.map(r => r.IdAerea) || []);
    setCargando(false);
  };

  const toggleArea = async (idArea) => {
    const yaExiste = asignadas.includes(idArea);
    if (yaExiste) {
      await supabase.from("Servidor_Area").delete().eq("IdServidor", servidor.Id).eq("IdAerea", idArea);
      setAsignadas(asignadas.filter(id => id !== idArea));
    } else {
      await supabase.from("Servidor_Area").insert([{ IdServidor: servidor.Id, IdAerea: idArea }]);
      setAsignadas([...asignadas, idArea]);
    }
  };

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 bg-white d-flex flex-column animate-slide-right"
      style={{ 
        height: 'calc(100% - 65px)', 
        zIndex: 1500, 
        boxShadow: '-5px 0 25px rgba(0,0,0,0.15)',
        borderTopLeftRadius: '30px',
        borderTopRightRadius: '30px',
        overflow: 'hidden'
      }}
    >
      {/* HEADER CON GRADIENTE Y GLASSMORPHISM */}
      <div className="position-relative p-4 pt-5 text-center shadow-sm" 
           style={{ 
             background: 'linear-gradient(135deg, #212529 0%, #343a40 100%)',
             borderBottom: '4px solid #0d6efd' 
           }}>
        
        {/* Botón Volver Minimalista */}
        <button 
          className="btn position-absolute top-0 start-0 m-3 d-flex align-items-center justify-content-center shadow-sm" 
          style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '12px', 
            background: 'rgba(255,255,255,0.1)', 
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white'
          }}
          onClick={onClose}
        >
          <i className="bi bi-arrow-left fs-5"></i>
        </button>

        <div className="mt-2 animate-pop">
          <div className="position-relative d-inline-block">
            <img 
              src={servidor.Foto || `https://ui-avatars.com/api/?name=${servidor.Nombre}&background=0D6EFD&color=fff`} 
              className="rounded-circle border border-4 border-white shadow-lg mb-3" 
              style={{ width: "95px", height: "95px", objectFit: "cover" }} 
            />
            <span className="position-absolute bottom-0 end-0 bg-success border border-3 border-dark rounded-circle" 
                  style={{ width: '22px', height: '22px', marginBottom: '15px' }}></span>
          </div>
          <h4 className="fw-bolder text-white mb-0 mt-1" style={{ letterSpacing: '-0.5px' }}>{servidor.Nombre}</h4>
          <span className="badge bg-primary mt-2 px-3 py-2 rounded-pill shadow-sm" style={{ fontSize: '10px', fontWeight: '800' }}>
            <i className="bi bi-shield-check me-1"></i> PERSONAL AUTORIZADO
          </span>
        </div>
      </div>

      {/* CUERPO DE LA FICHA */}
      <div className="p-4 flex-grow-1 overflow-auto" style={{ background: '#f8f9fa' }}>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>
            ÁREAS DE SERVICIO
          </h6>
          <span className="text-muted small fw-bold">{asignadas.length} seleccionadas</span>
        </div>
        
        {cargando ? (
          <div className="text-center py-5">
            <div className="spinner-grow text-primary" role="status"></div>
          </div>
        ) : (
          <div className="row g-3">
            {todasAreas.map(area => {
              const estaAsignada = asignadas.includes(area.Id);
              return (
                <div key={area.Id} className="col-12">
                  <div 
                    onClick={() => toggleArea(area.Id)}
                    className={`p-3 rounded-4 d-flex align-items-center justify-content-between transition-all shadow-sm border-2 ${
                      estaAsignada 
                      ? 'bg-white border-primary border-start-0' 
                      : 'bg-white border-transparent opacity-75'
                    }`}
                    style={{ 
                      cursor: 'pointer',
                      borderLeft: estaAsignada ? '6px solid #0d6efd' : '6px solid transparent'
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <div className={`p-2 rounded-3 me-3 ${estaAsignada ? 'bg-primary-subtle text-primary' : 'bg-light text-secondary'}`}>
                         <i className={`bi ${estaAsignada ? 'bi-star-fill' : 'bi-geo'}`}></i>
                      </div>
                      <span className={`fw-bold ${estaAsignada ? 'text-dark' : 'text-secondary'}`} style={{fontSize: '15px'}}>
                        {area.Nombre}
                      </span>
                    </div>
                    
                    <div className="form-check form-switch m-0">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={estaAsignada} 
                        readOnly 
                        style={{ width: '2.5em', height: '1.2em', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .animate-slide-right { animation: slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pop { animation: popIn 0.5s cubic-bezier(0.26, 0.53, 0.74, 1.48); }
        
        @keyframes slideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        
        .transition-all { 
          transition: all 0.3s ease; 
        }
        .transition-all:active {
          transform: scale(0.96);
        }
        .border-transparent { border: 2px solid transparent; }
      `}</style>
    </div>
  );
}