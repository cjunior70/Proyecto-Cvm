import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import Swal from 'sweetalert2';

const GeneradorInforme = ({ servicios, datosFlyer, fecha }) => {
  const downloadRef = useRef(null);

 // 1. PRIORIDAD DE ÁREAS (EN MAYÚSCULAS)
  const PRIORIDAD = [
    "COORDINADOR GENERAL",
    "VJ",
    "LETRA",
    "LUCES",
    "MOVIL",
    "SWITCHER",
    "VIDEOCAMARA",
    "TRANSMISION",
    "ROADIE ( BACKLINE )",
    "SONIDISTA ( CONSOLA )",
    "FOTOGRAFÍA  - EDICIÓN DE FOTO",
    "HISTORIA",
    "STAFF - AUXILIAR GENERAL  - INVENTARIO",
    "ASEO"
  ];

  const colors = {
    navy: '#1a2a3a',
    sky: '#3498db',
    text: '#0f172a', 
    accent: '#2980b9',
    muted: '#94a3b8' // Color grisáceo para el mensaje de "no requerido"
  };

  const areasOrdenadas = [...datosFlyer.areas].sort((a, b) => {
    const nombreA = (a.Nombre || "").toUpperCase().trim();
    const nombreB = (b.Nombre || "").toUpperCase().trim();
    let indexA = PRIORIDAD.indexOf(nombreA);
    let indexB = PRIORIDAD.indexOf(nombreB);
    if (indexA === -1) indexA = nombreA.includes("ASEO") ? 100 : 90;
    if (indexB === -1) indexB = nombreB.includes("ASEO") ? 100 : 90;
    return indexA - indexB;
  });

  const manejarCompartir = async () => {
    if (!servicios || servicios.length === 0) return;
    Swal.fire({ title: 'Generando Flyer...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const dataUrl = await toPng(downloadRef.current, { 
        cacheBust: true, 
        backgroundColor: '#f8fafc',
        pixelRatio: 3 
      });
      
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `Cronograma_${fecha}.png`, { type: 'image/png' });
      Swal.close();

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Cronograma Producción',
          text: `Equipo de Producción - ${fecha}`
        });
      } else {
        const link = document.createElement('a');
        link.download = `Cronograma_${fecha}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      Swal.fire('Error', 'No se pudo generar la imagen', 'error');
    }
  };

  const getMesAnio = () => {
    if (!servicios[0]) return "";
    return new Date(servicios[0].Fecha + "T00:00:00").toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  return (
    <>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;700;900&display=swap');`}
      </style>

      <button 
        onClick={manejarCompartir}
        className="btn w-100 rounded-4 py-3 shadow-lg fw-bold d-flex align-items-center justify-content-center gap-2 border-0"
        style={{ 
            background: `linear-gradient(135deg, ${colors.navy}, ${colors.accent})`, 
            color: 'white',
            fontFamily: "'Inter', sans-serif"
        }}
      >
        <i className="bi bi-whatsapp fs-5 text-success"></i>
        ENVIAR CRONOGRAMA POR WHATSAPP
      </button>

      {/* --- DISEÑO DE LA IMAGEN --- */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0', zIndex: -1 }}>
        <div ref={downloadRef} style={{ 
            width: '1300px', // Un poco más ancho para que quepa el mensaje largo
            padding: '60px', 
            background: '#f8fafc', 
            fontFamily: "'Inter', sans-serif" 
        }}>
          
          {/* HEADER */}
          <div style={{ 
            background: colors.navy, padding: '50px', borderRadius: '35px', marginBottom: '50px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div>
              <h1 style={{ 
                margin: 0, fontSize: '52px', fontWeight: '900', 
                fontFamily: "'Archivo Black', sans-serif", letterSpacing: '-2px'
              }}>EQUIPO PRODUCCIÓN</h1>
              <p style={{ margin: '10px 0 0 0', fontSize: '24px', opacity: 0.8, fontWeight: '700' }}>{getMesAnio()}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', color: colors.sky }}>DOMINGO</div>
              <div style={{ fontSize: '60px', fontWeight: '900', fontFamily: "'Archivo Black', sans-serif" }}>
                {servicios[0] ? new Date(servicios[0].Fecha + "T00:00:00").getDate() : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* CABECERAS */}
            <div style={{ display: 'flex', marginBottom: '20px' }}>
              <div style={{ width: '380px' }}></div>
              <div style={{ display: 'flex', flex: 1, gap: '15px' }}>
                {servicios.map((s) => (
                  <div key={s.Id} style={{ 
                    flex: 1, background: colors.sky, padding: '25px', 
                    borderRadius: '25px 25px 0 0', color: 'white', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase' }}>{s.Jornada}</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', fontFamily: "'Archivo Black', sans-serif" }}>{s.Tipo}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* FILAS CON LÓGICA DE "NO REQUERIDO" */}
            {areasOrdenadas.map((area, index) => (
              <div key={area.Id} style={{ 
                display: 'flex', flexWrap: 'nowrap', alignItems: 'stretch',
                background: index % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'white',
                borderBottom: '2px solid #e2e8f0',
                marginBottom: '5px',
                borderRadius: '15px'
              }}>
                {/* NOMBRE DEL ÁREA */}
                <div style={{ 
                  width: '380px', minWidth: '380px', minHeight: '90px', display: 'flex', alignItems: 'center',
                  color: colors.text, fontWeight: '900', fontSize: '18px', textTransform: 'uppercase',
                  borderLeft: `12px solid ${colors.sky}`, paddingLeft: '25px',
                }}>
                  {area.Nombre}
                </div>

                {/* COLUMNAS DE SERVIDORES */}
                <div style={{ display: 'flex', flexWrap: 'nowrap', flex: 1, gap: '15px' }}>
                  {servicios.map((s) => {
                    const nombre = datosFlyer.asignaciones[area.Id]?.[s.Id] || '';
                    return (
                      <div key={s.Id} style={{ 
                        flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', padding: '15px', textAlign: 'center'
                      }}>
                        {nombre ? (
                          <span style={{ 
                              fontSize: '26px', fontWeight: '900', color: colors.navy, 
                              textTransform: 'uppercase', fontFamily: "'Archivo Black', sans-serif"
                          }}>
                            {nombre}
                          </span>
                        ) : (
                          <span style={{ 
                              fontSize: '14px', // Más pequeña para que no estorbe
                              fontWeight: '700', 
                              color: colors.muted, 
                              fontStyle: 'italic',
                              textTransform: 'uppercase',
                              lineHeight: '1.2'
                          }}>
                            Área no<br/>requerida
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '30px', textAlign: 'center', color: colors.muted, fontWeight: '700', fontSize: '14px' }}>
            DEPARTAMENTO DE PRODUCCIÓN • FLYER OFICIAL {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </>
  );
};

export default GeneradorInforme;