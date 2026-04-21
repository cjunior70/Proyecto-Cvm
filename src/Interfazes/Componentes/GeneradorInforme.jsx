import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import Swal from 'sweetalert2';

const GeneradorInforme = ({ servicios, datosFlyer, fecha }) => {
  const downloadRef = useRef(null);

  // Configuración de la Paleta Deep Ocean
  const colors = {
    navy: '#2c3e50',
    sky: '#3498db',
    glass: 'rgba(255, 255, 255, 0.9)',
    text: '#34495e',
    accent: '#2980b9'
  };

  const generarImagen = () => {
    if (servicios.length === 0) return;

    Swal.fire({
      title: 'Diseñando Cronograma',
      text: 'Aplicando estilo Deep Ocean...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    setTimeout(() => {
      toPng(downloadRef.current, { cacheBust: true, backgroundColor: '#f0f2f5' })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `Cronograma_Ocean_${fecha}.png`;
          link.href = dataUrl;
          link.click();
          Swal.close();
        })
        .catch(() => Swal.fire('Error', 'No se pudo generar la imagen', 'error'));
    }, 1000);
  };

  const getMesAnio = () => {
    if (!servicios[0]) return "";
    return new Date(servicios[0].Fecha + "T00:00:00").toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  return (
    <>
      <button 
        onClick={generarImagen}
        className="btn w-100 rounded-4 py-3 shadow-lg fw-bold d-flex align-items-center justify-content-center gap-2 border-0"
        style={{ background: `linear-gradient(135deg, ${colors.navy}, ${colors.accent})`, color: 'white' }}
      >
        <i className="bi bi-cloud-arrow-down-fill fs-5"></i>
        Descargar Cronograma Del Servcio De Hoy
      </button>

      {/* --- DISEÑO DE LA IMAGEN --- */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
        <div ref={downloadRef} style={{ 
          width: '1150px', 
          padding: '60px', 
          background: '#f4f7f9', 
          fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif' 
        }}>
          
          {/* Header con estilo Glass */}
          <div style={{ 
            background: colors.navy, 
            padding: '40px', 
            borderRadius: '25px', 
            marginBottom: '40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'white',
            boxShadow: '0 15px 35px rgba(44, 62, 80, 0.2)'
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '38px', fontWeight: '800', letterSpacing: '-1px' }}>EQUIPO PRODUCCIÓN</h1>
              <p style={{ margin: 0, fontSize: '18px', opacity: 0.8, textTransform: 'uppercase' }}>{getMesAnio()}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>DOMINGO</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {servicios[0] ? new Date(servicios[0].Fecha + "T00:00:00").getDate() : '--'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '25px' }}>
            {/* Columna de Roles (Etiquetas) */}
            <div style={{ width: '260px', marginTop: '85px' }}>
              {datosFlyer.areas.map(area => (
                <div key={area.Id} style={{ 
                  height: '65px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '15px',
                  color: colors.text,
                  fontWeight: '700',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  paddingLeft: '10px',
                  borderLeft: `4px solid ${colors.sky}`
                }}>
                  {area.Nombre}
                </div>
              ))}
            </div>

            {/* Columnas de Servicios (Glass Cards) */}
            <div style={{ display: 'flex', gap: '25px', flex: 1 }}>
              {servicios.map((s) => (
                <div key={s.Id} style={{ 
                  flex: 1, 
                  background: colors.glass, 
                  borderRadius: '30px', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                  border: '1px solid white',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    background: `linear-gradient(to bottom, ${colors.sky}, ${colors.accent})`, 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: 'white' 
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.9 }}>{s.Jornada}</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{s.Tipo}</div>
                  </div>

                  <div style={{ padding: '0 15px' }}>
                    {datosFlyer.areas.map(area => {
                      const nombre = datosFlyer.asignaciones[area.Id]?.[s.Id] || '';
                      return (
                        <div key={area.Id} style={{ 
                          height: '65px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          borderBottom: '1px solid #f0f3f5',
                          textAlign: 'center'
                        }}>
                          <span style={{ 
                            fontSize: '15px', 
                            fontWeight: nombre ? '600' : '400', 
                            color: nombre ? colors.navy : '#cbd5e0',
                            textTransform: 'uppercase'
                          }}>
                            {nombre || 'VACANTE'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '40px', textAlign: 'center', color: '#a0aec0', fontSize: '13px', fontWeight: '500' }}>
            ORGANIZACIÓN ESTRATÉGICA DE SERVIDORES • {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </>
  );
};

export default GeneradorInforme;