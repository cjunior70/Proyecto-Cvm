import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from '../Supabase/cliente'
import './App.css'

// Importaciones existentes
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
import CalendarioServicios from './Interfazes/Home/CalendarioServicios' 

function App() {

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (window.location.hash) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>
            {/* Login - Fuera de la Barra */}
            <Route path='/' element={<Login/>}/>

            {/* Rutas Protegidas con Barra Lateral/Superior */}
            <Route element={<Barra/>}>
              <Route path='/Home' element={<Home/>}/>
              <Route path='/Homeadmin' element={<Homeadmin/>}/>
              
              {/* Calendario y Detalle */}
              <Route path='/CalendarioServicios' element={<CalendarioServicios/>}/>
              <Route path='/VistaDetalleCronograma' element={<VistaDetalleCronograma/>}/>
              
              {/* Configuración y Gestión */}
              <Route path='/Aereas' element={<Aereas/>}/>
              <Route path='/AereasAdmins' element={<AreasAdmin/>}/>
              <Route path='/Cronograma' element={<Cronograma/>}/>
              <Route path='/DatosPersonales' element={<DatosPersonales/>}/>
              <Route path='/Disponibilidad' element={<Disponibilidad/>}/>
              <Route path='/Servicios' element={<Servicios/>}/>
              <Route path='/Servidores' element={<Servidores/>}/>
            </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App