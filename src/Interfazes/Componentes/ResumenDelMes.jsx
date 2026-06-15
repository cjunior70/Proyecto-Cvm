import React from 'react';

export default function ResumenD({ imagen, valor, texto, loading }) {
  // SI ESTÁ CARGANDO: Muestra la silueta fantasma (Placeholder)
  if (loading) {
    return (
      <section className="flex-fill shadow-sm  p-2 m-1 bg-white rounded shadow-sm border placeholder-glow" aria-hidden="true">
        {/* Círculo o cuadro gris simulando la imagen */}
        <div className="placeholder rounded-circle mx-auto" style={{ height: "7vw", width: "7vw", minWidth: "40px", minHeight: "40px", backgroundColor: "#e9ecef" }} />
        {/* Línea simulando el número grande */}
        <h3 className="mt-2 mb-0">
          <span className="placeholder col-4 rounded"></span>
        </h3>
        {/* Línea simulando el texto de abajo */}
        <p className="mb-0">
          <span className="placeholder col-9 rounded"></span>
        </p>
      </section>
    );
  }

  // SI YA CARGÓ: Muestra el componente real con los datos
  return (
    <section className="flex-fill shadow-sm  p-1 m-1 bg-white rounded shadow-sm border">
      <img 
        src={imagen} 
        style={{ height: "7vw", width: "7vw", minWidth: "30px", minHeight: "30px" }} 
        alt={texto} 
      />
      <h4 className="fw-bold mt-2 mb-0">{valor}</h4>
      <p className="text-muted small mb-0">{texto}</p>
    </section>
  );
}