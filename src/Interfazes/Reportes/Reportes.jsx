import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { obtenerDatosDashboard } from './obtenerMetricasOptimizado';

const MetricasDashboard = () => {
  const [cargando, setCargando] = useState(true);
  const [metricas, setMetricas] = useState(null);
  
  const anioTrabajo = "2026";
  
  const getMesActualStr = () => {
    const hoy = new Date();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    return `${anioTrabajo}-${mm}`;
  };

  const [mesSeleccionado, setMesSeleccionado] = useState(getMesActualStr());
  const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  // 🎨 PALETA AMPLIADA CON 12 COLORES ÚNICOS Y ULTRA CONTRASTANTES
  const coloresPaleta = [
    '#1a2a3a', // Azul Oscuro Base
    '#3b82f6', // Azul Eléctrico
    '#10b981', // Verde Esmeralda
    '#f59e0b', // Amarillo Ámbar
    '#ec4899', // Rosado Neón
    '#8b5cf6', // Morado Vibrante
    '#06b6d4', // Cian/Turquesa
    '#f97316', // Naranja Vivo
    '#a855f7', // Púrpura
    '#14b8a6', // Teal/Menta
    '#ef4444', // Rojo Coral
    '#64748b'  // Gris Pizarra
  ];

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        const res = await obtenerDatosDashboard(mesSeleccionado, anioTrabajo);
        setMetricas(res);
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'No se pudieron sincronizar las métricas.', 'error');
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, [mesSeleccionado]);

  if (cargando || !metricas) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="text-center">
          <div className="spinner-border mb-3" role="status" style={{ width: '3rem', height: '3rem', color: '#1a2a3a', borderWidth: '4px' }}></div>
          <h6 className="fw-bold text-muted text-uppercase tracking-wider" style={{ fontSize: '12px' }}>Cargando Analítica Profesional...</h6>
        </div>
      </div>
    );
  }

  const { resumenMes, rankingAreas, flujoAnual, topServidores } = metricas;
  
  const maxServicios = Math.max(...flujoAnual.map(m => m.total_servicios), 1);
  const totalAsignacionesAreas = rankingAreas.reduce((acc, item) => acc + item.total_asignaciones, 0);

  // 🔄 Construir el gradiente cónico inyectando los colores sin repetir
  let acumuladoPorcentaje = 0;
  const stringGradiente = rankingAreas.length > 0 
    ? rankingAreas.map((area, idx) => {
        const porc = totalAsignacionesAreas > 0 ? (area.total_asignaciones / totalAsignacionesAreas) * 100 : 0;
        const color = coloresPaleta[idx % coloresPaleta.length];
        const inicio = acumuladoPorcentaje;
        acumuladoPorcentaje += porc;
        return `${color} ${inicio}% ${acumuladoPorcentaje}%`;
      }).join(', ')
    : '#e2e8f0 0% 100%';

  return (
    <div className="container-fluid px-3 px-md-5 py-4" style={{ backgroundColor: '#f4f6f9', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* 📱 HEADER ESTILO DASHBOARD ENTERPRISE */}
      <div className="card p-4 border-0 shadow-sm rounded-4 mb-4 bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <span className="badge text-uppercase mb-2 px-3 py-2 fw-bold" style={{ backgroundColor: 'rgba(26, 42, 58, 0.1)', color: '#1a2a3a', fontSize: '11px' }}>
              REPORTE GERENCIAL
            </span>
            <h2 className="fw-black m-0 tracking-tight" style={{ color: '#1a2a3a', fontSize: 'calc(1.4rem + 0.6vw)' }}>
              Rendimiento y Cobertura Operativa
            </h2>
            <p className="text-muted small m-0 mt-1">Auditoría visual de asignaciones, cargas de trabajo y asistencia del personal.</p>
          </div>
          
          <div className="w-100 w-md-auto d-flex align-items-center gap-3 bg-light p-2 rounded-3 border">
            <span className="fw-bold text-secondary text-uppercase ps-2" style={{ fontSize: '11px' }}>Filtrar Mes:</span>
            <input 
              type="month" 
              className="form-control border-0 fw-bold text-dark bg-transparent py-1"
              style={{ minWidth: '150px', outline: 'none', boxShadow: 'none' }}
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 🚩 COMPONENTES RESUMEN METRICAS (KPI) */}
      <div className="row g-3 mb-4">
        {[
          { t: "Servicios Ejecutados", v: resumenMes.total_servicios, c: '#1a2a3a', i: "📊", sub: "Eventos completados" },
          { t: "Personal en Acción", v: resumenMes.total_personas, c: '#10b981', i: "🌟", sub: "Colaboradores uniques" },
          { t: "Áreas Cubiertas", v: resumenMes.total_areas, c: '#f59e0b', i: "⚙️", sub: "Especialidades activas" }
        ].map((kpi, index) => (
          <div key={index} className="col-12 col-md-4">
            <div className="card p-4 border-0 shadow-sm rounded-4 bg-white h-100 position-relative overflow-hidden">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <span className="text-muted text-uppercase fw-bold d-block mb-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>{kpi.t}</span>
                  <h2 className="fw-black my-1" style={{ color: '#1a2a3a', fontSize: '32px' }}>{kpi.v}</h2>
                  <span className="text-muted small" style={{ fontSize: '12px' }}>{kpi.sub}</span>
                </div>
                <div className="fs-3 p-2 bg-light rounded-3 shadow-inner">{kpi.i}</div>
              </div>
              <div className="position-absolute bottom-0 start-0 w-100" style={{ height: '4px', backgroundColor: kpi.c }} />
            </div>
          </div>
        ))}
      </div>

      {/* 🎯 SECCIÓN INTERPRETATIVA: GRÁFICOS MULTICOLOR */}
      <div className="card p-4 border-0 shadow-sm rounded-4 mb-4 bg-white">
        <div className="border-bottom pb-3 mb-4">
          <h5 className="fw-bold m-0" style={{ color: '#1a2a3a' }}>🎯 Cuota de Participación por Especialidad</h5>
          <p className="text-muted small m-0">Entiende visualmente qué áreas demandaron mayor soporte operativo este mes (Diferenciadas por color).</p>
        </div>
        
        {rankingAreas.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted m-0">No se registran actividades para este período en el cronograma.</p>
          </div>
        ) : (
          <div className="row align-items-center g-4">
            
            {/* GRÁFICO CIRCULAR CON MÁSCARA INTERNA Y LÍNEAS DE DIVISIÓN */}
            <div className="col-12 col-lg-5 d-flex flex-column align-items-center justify-content-center border-end-lg">
              <div 
                className="position-relative d-flex align-items-center justify-content-center shadow"
                style={{
                  width: '210px',
                  height: '210px',
                  borderRadius: '50%',
                  background: `conic-gradient(${stringGradiente})`,
                  transition: 'background 0.5s ease'
                }}
              >
                {/* El centro blanco genera el efecto dona e independiza los trozos */}
                <div className="bg-white rounded-circle d-flex flex-column align-items-center justify-content-center shadow-sm" style={{ width: '146px', height: '146px' }}>
                  <span className="fw-black text-dark m-0 display-6" style={{ fontSize: '28px', color: '#1a2a3a' }}>{totalAsignacionesAreas}</span>
                  <span className="text-muted text-uppercase fw-bold text-center px-2" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>Asistencias<br/>Totales</span>
                </div>
              </div>

              {/* Etiquetas Rápidas con el Color Exacto */}
              <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
                {rankingAreas.map((area, idx) => (
                  <div key={idx} className="d-flex align-items-center bg-light px-2 py-1 rounded-2 border" style={{ fontSize: '11px' }}>
                    <div className="rounded-circle me-1" style={{ width: '10px', height: '10px', backgroundColor: coloresPaleta[idx % coloresPaleta.length] }} />
                    <span className="fw-bold text-secondary text-uppercase">{area.nombre_area.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BARRAS EXPLICATIVAS CON COLOR DINÁMICO CORRESPONDIENTE */}
            <div className="col-12 col-lg-7">
              <div className="d-flex flex-column gap-3">
                {rankingAreas.map((area, index) => {
                  const porcentaje = totalAsignacionesAreas > 0 ? Math.round((area.total_asignaciones / totalAsignacionesAreas) * 100) : 0;
                  const colorActual = coloresPaleta[index % coloresPaleta.length];

                  return (
                    <div key={index} className="p-2 rounded-3" style={{ backgroundColor: '#fcfdfe' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1.5">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold text-white badge rounded-circle d-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px', backgroundColor: colorActual, fontSize: '10px' }}>
                            {index + 1}
                          </span>
                          <span className="fw-bold text-dark small text-uppercase tracking-wide">{area.nombre_area}</span>
                        </div>
                        <span className="font-monospace small fw-black" style={{ color: colorActual }}>{area.total_asignaciones} asistencias ({porcentaje}%)</span>
                      </div>
                      <div className="progress rounded-pill shadow-sm" style={{ height: '10px', backgroundColor: '#f1f5f9' }}>
                        <div 
                          className="progress-bar rounded-pill" 
                          style={{ 
                            width: `${porcentaje}%`, 
                            backgroundColor: colorActual,
                            transition: 'width 0.8s ease'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 📈 COMPORTAMIENTO HISTÓRICO ANUAL         */}
      {/* ========================================== */}
      <div className="row g-4">
        
        {/* GRÁFICO HISTÓRICO DE BARRAS */}
        <div className="col-12 col-lg-7">
          <div className="card p-4 border-0 shadow-sm rounded-4 bg-white h-100">
            <div className="mb-4">
              <h6 className="fw-bold text-uppercase text-secondary tracking-wider mb-1" style={{ fontSize: '11px' }}>📈 Fluctuación Mensual de Servicios</h6>
              <p className="text-muted small m-0">Haz clic directo en cualquier barra para auditar el mes correspondiente.</p>
            </div>
            
            <div className="overflow-x-auto pb-2">
              <div className="d-flex align-items-end justify-content-between pt-4 px-1" style={{ minWidth: '460px', height: '180px' }}>
                {mesesNombres.map((mes, idx) => {
                  const mesFormato = `${anioTrabajo}-${String(idx + 1).padStart(2, '0')}`;
                  const dataMes = flujoAnual.find(m => m.MesStr === mesFormato);
                  const total = dataMes ? dataMes.total_servicios : 0;
                  
                  const alturaPorcentaje = (total / maxServicios) * 100;
                  const esMesActivo = mesSeleccionado === mesFormato;

                  return (
                    <div key={idx} className="d-flex flex-column align-items-center flex-grow-1 mx-1" style={{ maxWidth: '42px' }}>
                      <span className={`fw-black mb-1.5 ${esMesActivo ? 'text-dark' : 'text-muted'}`} style={{ fontSize: '11px' }}>
                        {total > 0 ? total : ''}
                      </span>
                      
                      <div 
                        style={{ 
                          height: `${Math.max(alturaPorcentaje, 6)}px`, 
                          width: '100%', 
                          background: total > 0 
                            ? (esMesActivo ? 'linear-gradient(to top, #1a2a3a, #3b82f6)' : '#1a2a3a') 
                            : '#e2e8f0', 
                          borderRadius: '8px 8px 0 0',
                          transition: 'all 0.25s ease-in-out',
                          transform: esMesActivo ? 'scale(1.08)' : 'scale(1)',
                          boxShadow: esMesActivo ? '0 6px 16px rgba(26, 42, 58, 0.35)' : 'none',
                          cursor: 'pointer'
                        }}
                        onClick={() => setMesSeleccionado(mesFormato)}
                      />
                      
                      <span className="mt-2 text-uppercase fw-bold" style={{ fontSize: '10px', color: esMesActivo ? '#1a2a3a' : '#94a3b8', letterSpacing: '0.3px' }}>
                        {mes}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* LÍDERES DE ASISTENCIA ANUAL */}
        <div className="col-12 col-lg-5">
          <div className="card p-4 border-0 shadow-sm rounded-4 bg-white h-100">
            <div className="mb-4">
              <h6 className="fw-bold text-uppercase text-secondary tracking-wider mb-1" style={{ fontSize: '11px' }}>🏆 Cuadro de Honor (Asistencia Anual)</h6>
              <p className="text-muted small m-0">Top de servidores con mayor constancia operativa.</p>
            </div>

            {topServidores.length === 0 ? (
              <p className="text-muted text-center small my-3">Sin registros consolidados.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {topServidores.map((serv, index) => (
                  <div key={index}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold text-dark small text-uppercase">
                        <span className="text-muted me-2 font-monospace">0{index + 1}.</span>
                        {serv.nombre_servidor}
                      </span>
                      <span className="badge rounded-pill font-monospace px-3 py-1.5 fw-bold" style={{ backgroundColor: '#1a2a3a', color: '#fff', fontSize: '10px' }}>
                        {serv.total_asistencias} Asistencias
                      </span>
                    </div>
                    <div className="progress" style={{ height: '5px', backgroundColor: '#f1f5f9' }}>
                      <div 
                        className="progress-bar rounded-pill" 
                        style={{ 
                          width: `${(serv.total_asistencias / topServidores[0].total_asistencias) * 100}%`,
                          backgroundColor: '#1a2a3a',
                          transition: 'width 1s ease'
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default MetricasDashboard;