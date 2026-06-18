import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { obtenerDetalleInforme } from '../Servicios/obtenerDetalleInforme'; // Ruta normalizada
import { notificarNuevoCronograma } from '../Servicios/emailService'; // 🔥 1. IMPORTAMOS TU SERVICIO DE EMAILJS
import Swal from 'sweetalert2';

export default function GeneradorInforme({ fechaSeleccionada, autoDisparar, alTerminar }) {
  const flyerRef = useRef(null);
  const [datosReporte, setDatosReporte] = useState(null);

  useEffect(() => {
    const cargarInformacion = async () => {
      try {
        Swal.fire({
          title: 'Generando Imagen...',
          text: 'Armando la matriz del cronograma...',
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); }
        });

        const data = await obtenerDetalleInforme(fechaSeleccionada);
        setDatosReporte(data);
      } catch (error) {
        console.error("Error al obtener detalles:", error);
        Swal.fire("Error", "No se pudo cargar la info", "error");
        alTerminar();
      }
    };

    if (fechaSeleccionada) cargarInformacion();
  }, [fechaSeleccionada]);

  useEffect(() => {
    if (datosReporte && autoDisparar && flyerRef.current) {
      // Damos un tiempo prudente para asegurar que el DOM esté completamente pintado con los datos
      const timer = setTimeout(() => procesarYCompartir(), 800);
      return () => clearTimeout(timer);
    }
  }, [datosReporte]);

  // 🔥 2. FUNCIÓN PARA FILTRAR EL STAFF ASIGNADO Y ENVIAR LOS CORREOS
  const procesarNotificacionStaff = async () => {
    if (!datosReporte || !datosReporte.datosFlyer) return;

    const { asignaciones } = datosReporte.datosFlyer;
    const staffUnico = new Map();

    // Recorremos la matriz estructurada del cronograma para buscar correos reales
    Object.values(asignaciones).forEach(area => {
      Object.values(area).forEach(info => {
        // Validamos al encargado Titular de la celda
        if (info && info.titular && info.titular !== "VACANTE") {
          const correoDestino = info.correoTitular; 
          
          if (correoDestino && !staffUnico.has(correoDestino)) {
            staffUnico.set(correoDestino, {
              Nombre: info.titular,
              Correo: correoDestino
            });
          }
        }
        
        // Validamos si esa celda también cuenta con un Apoyo asignado
        if (info && info.apoyo && info.apoyo !== "" && info.apoyo !== "VACANTE") {
          const correoApoyo = info.correoApoyo;
          if (correoApoyo && !staffUnico.has(correoApoyo)) {
            staffUnico.set(correoApoyo, {
              Nombre: info.apoyo,
              Correo: correoApoyo
            });
          }
        }
      });
    });

    const listaParaEnviar = Array.from(staffUnico.values());

    // Si encontramos personas reales con correo electrónico válido, disparamos EmailJS
    if (listaParaEnviar.length > 0) {
      await notificarNuevoCronograma(listaParaEnviar);
    } else {
      console.warn("⚠️ No se encontraron correos válidos asignados en este cronograma.");
    }
  };

  const procesarYCompartir = async () => {
    try {
      if (!flyerRef.current) return;

      const canvas = await html2canvas(flyerRef.current, {
        scale: 2, // Mantiene la súper alta definición
        useCORS: true,
        backgroundColor: '#f8fafc',
        width: 1050,
        height: flyerRef.current.scrollHeight // Evita cortes en el lienzo
      });

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Fallo al crear la imagen.");

        const archivo = new File([blob], `cronograma-${fechaSeleccionada}.png`, { type: blob.type });
        Swal.close();

        // CASO A: Dispositivo Móvil (Compartir por WhatsApp, Telegram, etc.)
        if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
          await navigator.share({
            files: [archivo],
            title: 'Equipo Producción',
            text: `📋 Cronograma organizado del ${fechaSeleccionada}.`
          });
          
          // 🚀 SE DISPARAN LOS CORREOS AUTOMÁTICAMENTE TRAS COMPARTIR EN CELULAR
          await procesarNotificacionStaff();

        // CASO B: Computadora / Navegador de escritorio (Descarga directa del .png)
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `cronograma-${fechaSeleccionada}.png`;
          a.click();
          
          // 🚀 SE DISPARAN LOS CORREOS AUTOMÁTICAMENTE TRAS LA DESCARGA EN PC
          await procesarNotificacionStaff();
        }
        
        // Terminamos el flujo principal del componente padre
        alTerminar();
      }, 'image/png');
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se generó la imagen.", "error");
      alTerminar();
    }
  };

  if (!datosReporte || !datosReporte.datosFlyer) return null;

  const { servicios, datosFlyer } = datosReporte;
  const { areas, asignaciones } = datosFlyer;

  // Hacemos el cálculo de fechas 100% automático y seguro
  const obtenerDiaNumero = (fechaStr) => fechaStr.split("-")[2];
  
  const obtenerMesAno = (fechaStr) => {
    const parts = fechaStr.split("-");
    const fechaObj = new Date(parts[0], parts[1] - 1, parts[2]);
    return fechaObj.toLocaleDateString("es-ES", { month: "long", year: "numeric" }).toUpperCase();
  };

  const obtenerNombreDiaReal = (fechaStr) => {
    const parts = fechaStr.split("-");
    const fechaObj = new Date(parts[0], parts[1] - 1, parts[2]);
    return fechaObj.toLocaleDateString("es-ES", { weekday: "long" }).toUpperCase();
  };

  // Ordenamos las áreas usando el campo "Orden" de tu base de datos
  const areasOrdenadas = [...areas].sort((a, b) => {
    const ordenA = a.Orden !== undefined && a.Orden !== null ? a.Orden : 999;
    const ordenB = b.Orden !== undefined && b.Orden !== null ? b.Orden : 999;
    return ordenA - ordenB;
  });

  const widthAreas = '260px'; 

  return (
    <div 
      ref={flyerRef} 
      style={{ 
        width: '1050px', 
        backgroundColor: '#f8fafc', 
        padding: '40px', 
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        boxSizing: 'border-box'
      }}
    >
      
      {/* 🟦 HEADER ESTILO EJECUTIVO */}
      <div style={{ 
        backgroundColor: '#1a293a', 
        color: 'white', 
        padding: '24px 32px', 
        borderRadius: '16px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '32px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '2px', margin: 0, textTransform: 'uppercase' }}>
            EQUIPO PRODUCCIÓN
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '4px', margin: '4px 0 0 0' }}>
            {obtenerMesAno(fechaSeleccionada)}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '2px', color: '#3b82f6', textTransform: 'uppercase', display: 'block' }}>
            {obtenerNombreDiaReal(fechaSeleccionada)}
          </span>
          <span style={{ fontSize: '56px', fontWeight: '900', display: 'block', lineHeight: '1', marginTop: '4px' }}>
            {obtenerDiaNumero(fechaSeleccionada)}
          </span>
        </div>
      </div>

      {/* 🗓️ ENCABEZADOS DE LAS JORNADAS */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'flex-end' }}>
        <div style={{ width: widthAreas, flexShrink: 0 }}></div> 
        
        {servicios.map((serv) => (
          <div key={serv.Id} style={{ 
            flex: 1, 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            borderRadius: '12px', 
            padding: '16px 12px', 
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <span style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', display: 'block' }}>
              {obtenerNombreDiaReal(fechaSeleccionada)}
            </span>
            <span style={{ fontSize: '14px', fontWeight: '900', marginTop: '4px', display: 'block' }}>
              {serv.Jornada}
            </span>
          </div>
        ))}
      </div>

      {/* 📋 CUERPO DE LA MATRIZ DE ASIGNACIONES */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        backgroundColor: 'white', 
        borderRadius: '16px', 
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        {areasOrdenadas.map((area, index) => {
          const bgColor = index % 2 === 0 ? "#ffffff" : "#f8fafc"; 

          return (
            <div key={area.Id} style={{ 
              display: 'flex', 
              backgroundColor: bgColor, 
              borderBottom: '1px solid #f1f5f9'
            }}>
              {/* Columna Izquierda: Nombre del Área */}
              <div style={{ 
                width: widthAreas, 
                flexShrink: 0, 
                borderLeft: '6px solid #3b82f6', 
                padding: '20px 16px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', margin: 0 }}>
                  {area.Nombre}
                </h3>
              </div>

              {/* Columnas de Asignaciones por Servicio */}
              {servicios.map((servicio) => {
                const asignacion = asignaciones[area.Id]?.[servicio.Id];
                const esInexistente = !asignacion;
                const esVacante = asignacion && asignacion.titular === "VACANTE";

                return (
                  <div key={servicio.Id} style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '16px 8px',
                    textAlign: 'center'
                  }}>
                    {esInexistente ? (
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase', fontStyle: 'italic' }}>
                        Área no requerida
                      </span>
                    ) : esVacante ? (
                      <span style={{ fontSize: '12px', fontWeight: '900', color: '#ef4444', backgroundColor: '#fef2f2', padding: '4px 8px', borderRadius: '4px', border: '1px solid #fee2e2' }}>
                        ⚠️ VACANTE
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>
                          {asignacion.titular}
                        </span>
                        {asignacion.apoyo && (
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1d4ed8', backgroundColor: '#dbeafe', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                            {asignacion.apoyo}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* 📝 RECORDATORIO FINAL */}
      <div style={{ width: '100%', textAlign: 'center', marginTop: '32px', paddingTop: '16px' }}>
        <p style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '2px', color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>
          POR FAVOR LLEGAR 30 MINUTOS ANTES PARA SETUP Y ORACIÓN
        </p>
      </div>

    </div>
  );
}