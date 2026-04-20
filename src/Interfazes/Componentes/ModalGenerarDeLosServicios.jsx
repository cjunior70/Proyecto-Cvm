import React, { useState } from 'react';
import { supabase } from '../../../Supabase/cliente'; 

export default function ModalGenerarDeLosServicios({ visible, onClose, onConfirm }) {
  const [fechaApertura, setFechaApertura] = useState('');
  const [fechaCierre, setFechaCierre] = useState('');
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const ejecutarInyeccion = async () => {
    setLoading(true);
    try {
      // 1. Calculamos el mes y año objetivo (el próximo mes)
      const fechaReferencia = new Date();
      fechaReferencia.setMonth(fechaReferencia.getMonth() + 1);
      const mesObjetivo = fechaReferencia.getMonth() ;
      const anioObjetivo = fechaReferencia.getFullYear();

      // 2. Inyectamos la regla en Control_Acceso
      const { error: errorControl } = await supabase
        .from('Control_Disponibilidad')
        .insert([
          {
            Mes: mesObjetivo,
            Año: anioObjetivo,
            Fecha_apertura: fechaApertura,
            Fecha_cierre: fechaCierre,
            Descripcion: `Apertura automática para ${mesObjetivo}/${anioObjetivo}`
          }
        ]);

      if (errorControl) throw errorControl;

      // 3. Ejecutamos la función que genera los servicios 
      // (Pasamos los datos hacia arriba por si el padre necesita refrescar algo)
      await onConfirm({ mesObjetivo, anioObjetivo });

      alert("¡Éxito! Servicios generados y fechas de acceso configuradas.");
      onClose();
    } catch (error) {
      console.error("Error en la inyección:", error);
      alert("Hubo un error al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '25px', background: '#121212', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
          
          <div className="modal-header border-0 pb-0 justify-content-center pt-4">
            <div className={`rounded-circle d-flex align-items-center justify-content-center mb-2 ${loading ? 'spinner-border text-primary' : 'bg-primary bg-opacity-10'}`} 
                 style={{ width: '70px', height: '70px', border: loading ? 'none' : '1px solid rgba(0, 123, 255, 0.2)' }}>
              {!loading && <i className="bi bi-magic text-primary fs-2"></i>}
            </div>
          </div>

          <div className="modal-body text-center px-4 pt-3">
            <h5 className="fw-bold mb-2">Automatización de Mes</h5>
            <p className="text-secondary small mb-4">Configura cuándo los servidores podrán empezar a marcar disponibilidad, apuntar antes de comienzo del proximo mes:</p>

            <div className="p-3 rounded-4 mb-3 text-start" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="row g-2">
                <div className="col-6">
                  <label className="text-secondary mb-1" style={{ fontSize: '0.65rem' }}>ABRE EL:</label>
                  <input type="date" className="form-control form-control-sm dark-input" value={fechaApertura} onChange={(e) => setFechaApertura(e.target.value)} disabled={loading} />
                </div>
                <div className="col-6">
                  <label className="text-secondary mb-1" style={{ fontSize: '0.65rem' }}>CIERRA EL:</label>
                  <input type="date" className="form-control form-control-sm dark-input" value={fechaCierre} onChange={(e) => setFechaCierre(e.target.value)} disabled={loading} />
                </div>
              </div>
            </div>

            <div className="p-2 rounded-3 mt-2" style={{ background: 'rgba(13, 202, 240, 0.05)', fontSize: '0.7rem', color: '#86d3ff' }}>
              <i className="bi bi-info-circle me-1"></i> Esto creará todos los eventos y bloqueará el acceso fuera de este rango.
            </div>
          </div>

          <div className="modal-footer border-0 d-flex gap-2 px-4 pb-4 pt-3">
            <button className="btn btn-link text-decoration-none text-muted flex-grow-1 shadow-none" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button
              className="btn btn-primary rounded-pill flex-grow-2 fw-bold py-2 px-4 shadow-lg"
              disabled={!fechaApertura || !fechaCierre || loading}
              onClick={ejecutarInyeccion}
              style={{ background: 'linear-gradient(45deg, #007bff, #00d4ff)', border: 'none' }}
            >
              {loading ? 'Procesando...' : '¡Generar Ahora!'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .dark-input { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: white !important; font-size: 0.75rem !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; }
      `}</style>
    </div>
  );
}