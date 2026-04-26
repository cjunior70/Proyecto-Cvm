import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import Swal from 'sweetalert2';

const GeneradorInforme = ({ servicios = [], datosFlyer = { areas: [], asignaciones: {} }, fecha }) => {
  const downloadRef = useRef(null);

  // --- 1. CONFIGURACIÓN DE COLORES (Ahora interna para que no falle) ---
  const colors = {
    navy: '#1a2a3a',
    sky: '#3498db',
    text: '#0f172a',
    accent: '#2980b9',
    muted: '#94a3b8'
  };

  const PRIORIDAD_AREAS = [
    "COORDINADOR GENERAL",
    "VJ",
    "LETRA",
    "LUCES",
    "MOVIL",
    "SWITCHER",
    "VIDEOCAMARA",
    "FOTOGRAFÍA  - EDICIÓN DE FOTO",
    "HISTORIA",
    "ASEO"
  ];

  // --- 2. LÓGICA DE ORDENAMIENTO DE SERVICIOS ---
  // Usamos ?. y || [] para evitar errores si servicios llega nulo
  const serviciosOrdenados = [...(servicios || [])].sort((a, b) => {
    const obtenerPeso = (jornada) => {
      const j = (jornada || "").toUpperCase();
      if (j.includes('7:00 AM')) return 1;
      if (j.includes('9:00 AM')) return 2;
      if (j.includes('11:00 AM')) return 3;
      if (j.includes('6:00 PM')) return 4;
      if (j.includes('7:30 PM')) return 5;
      return 10; 
    };
    return obtenerPeso(a.Jornada) - obtenerPeso(b.Jornada);
  });

  // --- 3. LÓGICA DE ORDENAMIENTO DE ÁREAS ---
  const areasOrdenadas = [...(datosFlyer?.areas || [])].sort((a, b) => {
    const nombreA = (a.Nombre || "").toUpperCase().trim();
    const nombreB = (b.Nombre || "").toUpperCase().trim();
    let indexA = PRIORIDAD_AREAS.indexOf(nombreA);
    let indexB = PRIORIDAD_AREAS.indexOf(nombreB);
    if (indexA === -1) indexA = nombreA.includes("ASEO") ? 100 : 90;
    if (indexB === -1) indexB = nombreB.includes("ASEO") ? 100 : 90;
    return indexA - indexB;
  });

  const getMesAnio = () => {
    if (!serviciosOrdenados[0]?.Fecha) return "";
    try {
      return new Date(serviciosOrdenados[0].Fecha + "T00:00:00").toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
    } catch (e) { return ""; }
  };

  const manejarCompartir = async () => {
    if (!serviciosOrdenados.length) {
        Swal.fire('Atención', 'No hay servicios para generar el informe', 'warning');
        return;
    }

    Swal.fire({ 
      title: 'Generando Informe...', 
      allowOutsideClick: false, 
      didOpen: () => Swal.showLoading() 
    });

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

      const mensajeBacano = 
        `🚀 *EQUIPO DE PRODUCCIÓN* 🚀\n\n` +
        `¡Hola equipo! 👋 Bienvenido a nuestro cronograma para el próximo servicio del día *${fecha}*.\n\n` +
        `⚠️ *RECORDATORIO:* Por favor, recuerden llegar *media hora antes* del evento para el setup inicial y oración.\n\n` +
        `¡Vamos con toda la actitud! 🙌🔥`;

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Cronograma', text: mensajeBacano });
      } else {
        const link = document.createElement('a');
        link.download = `Cronograma_${fecha}.png`;
        link.href = dataUrl;
        link.click();
        Swal.fire('Imagen Descargada', 'Súbela manualmente a WhatsApp.', 'info');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo generar la imagen', 'error');
    }
  };

  // Si no hay datos, mostramos un aviso pequeño en lugar de romper la app
  if (!servicios || servicios.length === 0) {
      return <div className="alert alert-info">Esperando datos del cronograma...</div>;
  }

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

      {/* FLYER OCULTO */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0', zIndex: -1 }}>
        <div ref={downloadRef} style={{ width: '1300px', padding: '60px', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
          
          <div style={{ 
            background: colors.navy, padding: '50px', borderRadius: '35px', marginBottom: '50px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white'
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '52px', fontWeight: '900', fontFamily: "'Archivo Black', sans-serif" }}>EQUIPO PRODUCCIÓN</h1>
              <p style={{ margin: '20px 0 0 0', fontSize: '24px', opacity: 0.8 }}>{getMesAnio()}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '40px', fontWeight: '900', color: '#3498db', letterSpacing: '5px' }}>
                {serviciosOrdenados[0] ? new Date(serviciosOrdenados[0].Fecha + "T00:00:00").toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase() : ''}
              </div>
              <div style={{ fontSize: '60px', fontWeight: '900', fontFamily: "'Archivo Black', sans-serif" }}>
                {serviciosOrdenados[0] ? new Date(serviciosOrdenados[0].Fecha + "T00:00:00").getDate() : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', marginBottom: '20px' }}>
              <div style={{ width: '380px' }}></div>
              <div style={{ display: 'flex', flex: 1, gap: '15px' }}>
                {serviciosOrdenados.map((s) => (
                  <div key={s.Id} style={{ flex: 1, background: colors.sky, padding: '25px', borderRadius: '25px 25px 0 0', color: 'white', textAlign: 'center' }}>
                    <div style={{ fontSize: '30px', fontWeight: '900', fontFamily: "'Archivo Black', sans-serif" }}>{s.Tipo}</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', }}>{s.Jornada}</div>
                  </div>
                ))}
              </div>
            </div>

            {areasOrdenadas.map((area, index) => (
              <div key={area.Id} style={{ 
                display: 'flex', alignItems: 'stretch', background: index % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'white',
                borderBottom: '2px solid #e2e8f0', marginBottom: '5px', borderRadius: '15px'
              }}>
                <div style={{ 
                  width: '380px', minHeight: '90px', display: 'flex', alignItems: 'center',
                  color: colors.text, fontWeight: '900', fontSize: '26px', borderLeft: `12px solid ${colors.sky}`, paddingLeft: '25px'
                }}>
                  {area.Nombre}
                </div>
                <div style={{ display: 'flex', flex: 1, gap: '15px' }}>
                  {serviciosOrdenados.map((s) => {
                    const nombre = datosFlyer.asignaciones?.[area.Id]?.[s.Id] || '';
                    return (
                     <div key={s.Id} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
                      <span style={{ 
                        // Si NO hay nombre, aplicamos color gris e inclinación (italiano/italic)
                        // Si SÍ hay nombre, usamos el color navy y normal
                        color: nombre ? colors.navy : '#cbd5e1', 
                        fontStyle: nombre ? 'normal' : 'italic',
                        fontSize: nombre ? '26px' : '12px', // Un poco más pequeño si no es requerido
                        fontWeight: '900', 
                        textAlign: 'center', 
                        fontFamily: "'Archivo Black', sans-serif",
                        textTransform: 'uppercase'
                      }}>
                        {nombre || 'ÁREA NO REQUERIDA'}
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
    </>
  );
};

export default GeneradorInforme;