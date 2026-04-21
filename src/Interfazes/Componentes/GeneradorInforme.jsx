import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import Swal from 'sweetalert2';

const GeneradorInforme = ({ servicios, datosFlyer, fecha }) => {
  const downloadRef = useRef(null);

  // Paleta Deep Ocean & Glass
  const colors = {
    navy: '#2c3e50',
    sky: '#3498db',
    glass: 'rgba(255, 255, 255, 0.9)',
    text: '#34495e',
    accent: '#2980b9'
  };

  const manejarCompartir = async () => {
    if (servicios.length === 0) return;

    Swal.fire({
      title: 'Generando Cronograma',
      text: 'Preparando diseño para WhatsApp...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      // 1. Convertir HTML a Imagen (DataURL)
      const dataUrl = await toPng(downloadRef.current, { 
        cacheBust: true, 
        backgroundColor: '#f4f7f9',
        pixelRatio: 2 // Mayor calidad
      });
      
      // 2. Convertir DataURL a un archivo real para compartir
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `Cronograma_${fecha}.png`, { type: 'image/png' });

      Swal.close();

      // 3. Intentar compartir nativamente (WhatsApp/Otros)
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Cronograma Producción',
          text: 'Hola! Aquí envío el cronograma de audiovisuales para este domingo.'
        });
      } else {
        // Fallback: Descarga normal si es PC o navegador antiguo
        const link = document.createElement('a');
        link.download = `Cronograma_${fecha}.png`;
        link.href = dataUrl;
        link.click();
        Swal.fire({
          icon: 'info',
          title: 'Imagen Descargada',
          text: 'Tu dispositivo no permite compartir directo, pero la imagen ya está en tus descargas para que la envíes manualmente.',
          confirmButtonColor: colors.navy
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Hubo un problema al crear la imagen.', 'error');
    }
  };

  const getMesAnio = () => {
    if (!servicios[0]) return "";
    return new Date(servicios[0].Fecha + "T00:00:00").toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  return (
    <>
      <button 
        onClick={manejarCompartir}
        className="btn w-100 rounded-4 py-3 shadow-lg fw-bold d-flex align-items-center justify-content-center gap-2 border-0"
        style={{ background: `linear-gradient(135deg, ${colors.navy}, ${colors.accent})`, color: 'white' }}
      >
        <i className="bi bi-whatsapp fs-5 text-success"></i>
        ENVIAR CRONOGRAMA POR WHATSAPP
      </button>

      {/* --- DISEÑO OCULTO PARA LA FOTO (Deep Ocean Style) --- */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
        <div ref={downloadRef} style={{ width: '1150px', padding: '60px', background: '#f4f7f9', fontFamily: 'sans-serif' }}>
          
          <div style={{ 
            background: colors.navy, padding: '40px', borderRadius: '25px', marginBottom: '40px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white',
            boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '38px', fontWeight: '800' }}>EQUIPO PRODUCCIÓN</h1>
              <p style={{ margin: 0, fontSize: '18px', opacity: 0.8 }}>{getMesAnio()}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>DOMINGO</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {servicios[0] ? new Date(servicios[0].Fecha + "T00:00:00").getDate() : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '25px' }}>
            {/* Roles */}
            <div style={{ width: '260px', marginTop: '85px' }}>
              {datosFlyer.areas.map(area => (
                <div key={area.Id} style={{ 
                  height: '65px', display: 'flex', alignItems: 'center', marginBottom: '15px',
                  color: colors.text, fontWeight: '700', fontSize: '14px', textTransform: 'uppercase',
                  borderLeft: `4px solid ${colors.sky}`, paddingLeft: '15px'
                }}>
                  {area.Nombre}
                </div>
              ))}
            </div>

            {/* Tarjetas Glass */}
            <div style={{ display: 'flex', gap: '25px', flex: 1 }}>
              {servicios.map((s) => (
                <div key={s.Id} style={{ 
                  flex: 1, background: colors.glass, borderRadius: '30px', 
                  border: '1px solid white', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ background: colors.sky, padding: '20px', textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{s.Jornada}</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{s.Tipo}</div>
                  </div>
                  <div style={{ padding: '0 10px' }}>
                    {datosFlyer.areas.map(area => {
                      const nombre = datosFlyer.asignaciones[area.Id]?.[s.Id] || '';
                      return (
                        <div key={area.Id} style={{ 
                          height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          borderBottom: '1px solid #eee', textAlign: 'center'
                        }}>
                          <span style={{ fontSize: '15px', fontWeight: nombre ? '600' : '400', color: nombre ? colors.navy : '#ccc' }}>
                            {nombre || '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GeneradorInforme;