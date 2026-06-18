import emailjs from '@emailjs/browser';
import Swal from 'sweetalert2';
 
export const notificarNuevoCronograma = async (listaDeServidores) => {
  // 1. FILTRO ULTRA-SEGURO: Detecta la columna se llame como se llame en la base de datos
  const staffConCorreo = listaDeServidores.filter(servidor => {
    return servidor.CorreoServidor || servidor.correoservidor || servidor.Correo;
  });

  if (staffConCorreo.length === 0) {
    // Imprimimos en consola qué es lo que realmente está llegando para poder auditarlo si falla
    console.log("🔍 Datos recibidos en el servicio:", listaDeServidores);
    Swal.fire("Aviso", "No hay servidores con correos registrados para notificar. 🤷‍♂️", "info");
    return false;
  }

  // 2. Alerta visual de que el proceso inició
  Swal.fire({
    title: '¡Despachando notificaciones! 🚀',
    text: 'Enviando correos a la familia CVM, por favor espera...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_wn2ptjd';
    const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_a3ei2dd';
    const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'XfEFx1T1vIosolwFX';

    // 3. Recorrer el staff y disparar los correos secuencialmente
    for (const servidor of staffConCorreo) {
      // Mapeo híbrido: toma el valor que encuentre disponible
      const correoDestino = servidor.CorreoServidor || servidor.correoservidor || servidor.Correo;
      const nombreDestino = servidor.NombreServidor || servidor.nombreservidor || servidor.Nombre;

      const parametrosPlantilla = {
        to_email: correoDestino,
        nombre_servidor: nombreDestino
      };

      await emailjs.send(SERVICE_ID, TEMPLATE_ID, parametrosPlantilla, PUBLIC_KEY);
    }

    // 4. Éxito total
    Swal.fire({
      icon: 'success',
      title: '¡Todo el mundo avisado! 🔥',
      text: 'Los correos se enviaron exitosamente al staff.',
      confirmButtonColor: '#6E4BDB'
    });

    return true;

  } catch (error) {
    console.error("Error en emailService:", error);
    Swal.fire("Error 😥", "Hubo un fallo al intentar enviar los correos.", "error");
    return false;
  }
};