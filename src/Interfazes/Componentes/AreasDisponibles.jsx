import React, { useState } from "react";
import { obtenerPersonalPorServicioYArea } from "../Servicios/obtenerPersonalPorArea"; 
import ModalPersonalArea from "./ModalPersonalArea"; 

import Persona from "../../Imagenes/Persona.svg";
// Mantén tus imports de imágenes originales por si los usas en otra parte

export default function AereasDisponibles({ DatosAreas , DatosServicio }) {
  // 🚀 1. ESTADOS LOCALES PARA EL MODAL
  const [personalArea, setPersonalArea] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // 🚀 2. EXTRACCIÓN DE IDENTIFICADORES Y BLINDAJE
  const idServicioReal = DatosServicio?.Id;
  const nombreArea = DatosAreas?.Aerea?.Nombre || "Área";
  const idArea = DatosAreas?.IdArea || DatosAreas?.IdAerea || DatosAreas?.Id; 
  const idServicio = DatosAreas?.IdServicio; 

  // Icono de respaldo si llega a venir null en la BD
  const iconoRespaldo = "https://unpkg.com/lucide-static@latest/icons/help-circle.svg";
  const urlIconoFinal = DatosAreas?.UrlIcono || iconoRespaldo;

  // 🚀 3. LÓGICA DEL SEMÁFORO (NUEVO)
  const inscritos = DatosAreas.Inscritos || 0;
  const cupos = DatosAreas.Cupos || 0;
  
  let colorEstado = "#dc3545"; // Rojo (Vacío)
  let animacionEstado = "pulso-rojo";
  let textoEstado = "Vacío";

  if (inscritos >= cupos && cupos > 0) {
    colorEstado = "#198754"; // Verde (Lleno al tope)
    animacionEstado = "pulso-verde";
    textoEstado = "Completo";
  } else if (inscritos > 0 && inscritos < cupos) {
    colorEstado = "#ffc107"; // Amarillo (Incompleto)
    animacionEstado = "pulso-amarillo";
    textoEstado = "Incompleto";
  }

  // 🚀 4. FUNCIÓN PARA TRAER LA DATA
  const consultarPersonal = async () => {
    setLoadingModal(true);
    const dataLimpia = await obtenerPersonalPorServicioYArea(idServicio, idArea);
    setPersonalArea(dataLimpia);
    setLoadingModal(false);
  };

  return (
    <>
      {/* 🎨 ESTILOS DE ANIMACIÓN INYECTADOS DIRECTAMENTE */}
      <style>
        {`
          @keyframes pulso-verde {
            0% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(25, 135, 84, 0); }
            100% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0); }
          }
          @keyframes pulso-amarillo {
            0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(255, 193, 7, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
          }
          @keyframes pulso-rojo {
            0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(220, 53, 69, 0); }
            100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
          }
        `}
      </style>

      {/* 🛑 TU DISEÑO MÓVIL ORIGINAL EXACTO, INTACTO Y RESPONSIVO */}
      <section className="w-100 d-flex p-1 border-bottom" >

        <section className="w-50 d-flex justify-content-start align-items-center">

          {/* 🖼️ CONTENEDOR DEL ICONO: Mantiene exactamente tu tamaño original de 7.5vw */}
          <section className="w-25 m-1 d-flex align-items-center justify-content-center">
            <img 
              src={urlIconoFinal} 
              style={{ width: "7.5vw", height: "7.5vw", objectFit: "contain" }} 
              alt={nombreArea} 
            />
          </section>

          <section className="w-75 d-flex flex-column "> 
              <p className="m-0 fw-bold">{nombreArea}</p>
              <p className="m-0 text-muted" style={{ fontSize: "3.2vw" }}>{DatosAreas.Cupos} Cupos Totales</p>
          </section>

        </section>

        <section className="w-50 justify-content-between d-flex justify-content-end align-items-center">

          <section className="me-3 w-75 d-flex align-items-center flex-column ">
            {/* 🔴🟡🟢 AQUÍ APLICAMOS EL COLOR Y ANIMACIÓN AL NÚMERO SIN DAÑAR EL ESPACIO */}
            <section 
              className="fw-bold text-white d-flex justify-content-center align-items-center"
              style={{ 
                backgroundColor: colorEstado,
                animation: `${animacionEstado} 2s infinite`,
                borderRadius: "50%",
                width: "5.5vw", 
                height: "5.5vw",
                fontSize: "3.5vw" // Un toque más grande para que resalte dentro de su bolita
              }}
            >
              {inscritos}
            </section>
            <section>
              {/* EL TEXTO SE ADAPTA AL ESTADO EN LUGAR DE DECIR SIEMPRE 'Disponibles' */}
              <p className="m-0 mt-1 fw-semibold" style={{ fontSize: "3vw", color: colorEstado }}>
                {textoEstado}
              </p>
            </section>
          </section>
          
          {/* 👥 BOTÓN DE PERSONA: Mantiene exactamente tu tamaño original de 8vw */}
          <section className="d-flex w-25 align-items-center ">
            <button 
              type="button"
              data-bs-toggle="modal" 
              data-bs-target={`#backdrop-${idArea}`}
              onClick={consultarPersonal}
              className="w-50 h-50 border-0 bg-transparent p-0 d-flex align-items-center justify-content-center" 
            >
              <img src={Persona} style={{ width: "8vw", height: "8vw", objectFit: "contain" }} alt="Ver" />
            </button>
          </section>
        </section>

      </section>

      {/* 🏛️ EL MODAL SE INSTANCIA ABAJO SIN INTERFERIR CON TU FILA */}
      <ModalPersonalArea 
        idArea={idArea} 
        idServicio={idServicioReal} 
        nombreArea={nombreArea} 
        personalArea={personalArea} 
        cuposMaximos={DatosAreas.Cupos} 
      />
    </>
  );
}