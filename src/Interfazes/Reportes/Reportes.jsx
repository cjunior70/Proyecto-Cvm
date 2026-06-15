import React from "react";

export default function Reportes() {
  // 🎨 Tu color corporativo intacto, mi rey
  const brandColor = "#6E4BDB";

  return (
    <div style={{ backgroundColor: "#F4F7FE", minHeight: "100vh", padding: "20px", paddingTop: "60px" }}>
      <div className="container-lg text-center" style={{ maxWidth: "600px" }}>
        
        {/* CARD PRINCIPAL CON REFUERZO DE MARCA */}
        <div className="card border-0 shadow-sm p-5 rounded-4 bg-white mt-4" style={{ borderTop: `5px solid ${brandColor}` }}>
          
          {/* Iconos con animación flotante */}
          <div className="mb-4 position-relative d-inline-block mx-auto">
            <span style={{ fontSize: "4rem", display: "inline-block", animation: "floating 2.5s infinite ease-in-out" }}>📊</span>
            <span className="position-absolute bottom-0 end-0" style={{ fontSize: "2rem" }}>🛠️</span>
          </div>

          {/* Títulos */}
          <h3 className="fw-bold mb-2">Módulo de Reportes</h3>
          <h6 className="fw-bold mb-3" style={{ color: brandColor, letterSpacing: "1px" }}>¡Cocinando nuevas métricas!</h6>
          
          <p className="text-muted small px-3">
            Estamos diseñando los mejores paneles estadísticos y gráficas mensuales para que puedas evaluar la asistencia y horas de tus servidores con un solo clic.
          </p>

          {/* BARRA DE PROGRESO DE TRABAJO */}
          <div className="my-4 px-3">
            <div className="d-flex justify-content-between small fw-bold mb-1" style={{ color: brandColor }}>
              <span>Progreso del desarrollo</span>
              <span>75%</span>
            </div>
            <div className="progress rounded-pill" style={{ height: "12px", backgroundColor: "#E9ECEF" }}>
              <div 
                className="progress-bar progress-bar-striped progress-bar-animated rounded-pill" 
                role="progressbar" 
                style={{ width: "75%", backgroundColor: brandColor }}
              ></div>
            </div>
          </div>

          {/* SKELETONS: Un adelanto visual de lo que tendrá la interfaz */}
          <div className="text-start mt-4 border-top pt-4">
            <small className="fw-bold d-block text-uppercase text-muted mb-3" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>
              Próximamente verás aquí:
            </small>
            
            {/* Ítem 1 */}
            <div className="d-flex align-items-center gap-3 mb-3 opacity-50">
              <div className="rounded-circle p-2 bg-light">📈</div>
              <div className="w-100">
                <div className="fw-bold small text-dark">Gráficos de Asistencia Mensual</div>
                <div className="bg-secondary rounded-pill opacity-20" style={{ height: "6px", width: "60%", marginTop: "4px" }}></div>
              </div>
            </div>

            {/* Ítem 2 */}
            <div className="d-flex align-items-center gap-3 mb-3 opacity-50">
              <div className="rounded-circle p-2 bg-light">📄</div>
              <div className="w-100">
                <div className="fw-bold small text-dark">Exportación a PDF / Excel de Cronogramas</div>
                <div className="bg-secondary rounded-pill opacity-20" style={{ height: "6px", width: "45%", marginTop: "4px" }}></div>
              </div>
            </div>

            {/* Ítem 3 */}
            <div className="d-flex align-items-center gap-3 opacity-50">
              <div className="rounded-circle p-2 bg-light">🏅</div>
              <div className="w-100">
                <div className="fw-bold small text-dark">Métricas de Servidores más Activos</div>
                <div className="bg-secondary rounded-pill opacity-20" style={{ height: "6px", width: "70%", marginTop: "4px" }}></div>
              </div>
            </div>
          </div>

        </div>

        {/* INYECCIÓN DE ANIMACIÓN CSS SIMPLE */}
        <style>{`
          @keyframes floating {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
        `}</style>

      </div>
    </div>
  );
}