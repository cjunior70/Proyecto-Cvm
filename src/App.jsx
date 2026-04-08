import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react' // Importamos useEffect
import { supabase } from '../Supabase/cliente'
import './App.css'
import Login from './Interfazes/Login/Login'
import Aereas from './Interfazes/Aereas/Aereas'
import Cronograma from './Interfazes/Cronograma/Cronograma'
import DatosPersonales from './Interfazes/DatosPersonales/DatosPersonales'
import Disponibilidad from './Interfazes/Disponibilidad/Disponibilidad'
import Home from './Interfazes/Home/Home'
import Barra from './Interfazes/Componentes/Barra'
import Servicios from './Interfazes/Servicios/Servicios'
import Servidores from './Interfazes/Servidores/Servidores'
import AreasAdmin from './Interfazes/Aereas/AreasAdmin'
import Homeadmin from './Interfazes/Home/Homeadmin'
import VistaDetalleCronograma from './Interfazes/Home/VistaDetalle'

function App() {

  useEffect(() => {
    // 1. Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      
      // Si el evento es un inicio de sesión exitoso
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        
        // Si hay un hash en la URL (#access_token...), lo limpiamos
        if (window.location.hash) {
          // Esto elimina el token de la barra de direcciones sin recargar la página
          window.history.replaceState({}, document.title, window.location.pathname);
          console.log("Token procesado y URL limpiada con éxito.");
        }
      }
    });

    // Limpiar el listener al desmontar el componente
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>
            {/* Login */}
            <Route path='/' element={<Login/>}/>

            {/* Rutas con Barra Lateral/Superior */}
            <Route element={<Barra/>}>
              <Route path='/Aereas' element={<Aereas/>}/>
              <Route path='/AereasAdmins' element={<AreasAdmin/>}/>
              <Route path='/Cronograma' element={<Cronograma/>}/>
              <Route path='/DatosPersonales' element={<DatosPersonales/>}/>
              <Route path='/Disponibilidad' element={<Disponibilidad/>}/>
              <Route path='/Home' element={<Home/>}/>
              <Route path='/VistaDetalleCronograma' element={<VistaDetalleCronograma/>}/>
              <Route path='/Homeadmin' element={<Homeadmin/>}/>
              <Route path='/Servicios' element={<Servicios/>}/>
              <Route path='/Servidores' element={<Servidores/>}/>
            </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App