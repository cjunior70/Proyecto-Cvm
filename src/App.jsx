
import { BrowserRouter, Route, Routes } from 'react-router-dom'
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

function App() {

  return (
    <>
      <BrowserRouter>
        {/* Contenedor de las rutas */}

        <Routes>
            {/* Login */}
            <Route path='/' element={<Login/>}/>

            {/* Rutas */}
            <Route element={<Barra/>}>
              <Route path='/Aereas' element={<Aereas/>}/>
              <Route path='/AereasAdmins' element={<AreasAdmin/>}/>
              <Route path='/Cronograma' element={<Cronograma/>}/>
              <Route path='/DatosPersonales' element={<DatosPersonales/>}/>
              <Route path='/Disponibilidad' element={<Disponibilidad/>}/>
              <Route path='/Home' element={<Home/>}/>
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
