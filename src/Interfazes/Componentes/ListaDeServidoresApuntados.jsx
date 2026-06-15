import React from "react";

export default function ListaDeServidoresApuntados({ DatosDelPersonal}) {
  // 🛡️ Si por alguna razón el objeto principal viene vacío, frenamos el render sin romper la app
  if (!DatosDelPersonal) return null;

  return (
    <section className="d-flex align-items-center my-2 p-2 border-bottom">
      {/* Un círculo avatar limpio en vez de la etiqueta <img> vacía */}
      <div 
        className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center me-3 fw-bold" 
        style={{ width: "40px", height: "40px" }}
      >
        {DatosDelPersonal.Servidor_Area?.Servidores?.Nombre?.charAt(0) || "S"}
      </div>

      {/* 🚀 EL BLINDAJE: Con los signos "?" si algo no existe, devuelve vacío en vez de romper la pantalla */}
      <h6 className="mb-0 fw-medium">
        {DatosDelPersonal.Servidor_Area?.Servidores?.Nombre || "Servidor sin nombre asignado"}
      </h6>
    </section>
  );
}