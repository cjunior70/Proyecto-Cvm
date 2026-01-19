import { useEffect, useState } from "react";
import AreaCard from "../Componentes/AreaCard.jsx";
import { supabase } from "../../../Supabase/cliente.js";

export default function Areas() {

  const [Aereasgenerales, setAereasgenerales] = useState([]);
  // const [MisAereas, MisAereas] = useState([]);


  useEffect(() => {

    //Funcion para poder mostrar todas las aereas disponibles
    const cargarAereas = async () => {

      try{

        const {Data, error} = await supabase
        .from("Aerea")
        .select("*")

        if(error){
          console.error("❌ Error cargando servicios:", error);
          return;
        }

        // const { misAreas, error: error2 } = await supabase
        // .from("Servidor_Area")
        // .select(`
        //   Id,
        //   Aerea (
        //     Id,
        //     Nombre,
        //     Descripcion,
        //     Foto
        //   )
        // `)
        // .eq("IdServidor", user.id);

        // console.log("Estas son mis aereas",misAreas);

        setAereasgenerales(Data);
        console.log("estas son todas la ereas disponibles del sistema", Data);

      }
      catch(error)
      {
        console.log("Hubo un problema con la peticion de todas las aereas",error);
      }

    };

    cargarAereas();
  }, []);



  // 🔹 DATOS DE PRUEBA
  const misAreas = [
    {
      id: 1,
      nombre: "Sonido",
      descripcion: "Mezcla y control de audio",
      foto: "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
    },
  ];


  const registrarArea = (area) => {
    console.log("Registrándome en área:", area.nombre);
    alert(`Te registraste en ${area.nombre}`);
  };

  return (
    <section className="container py-3">

      {/* ───── MIS ÁREAS ───── */}
      <section className="mb-4">
        <h5 className="fw-bold mb-3">Mis áreas</h5>

        <div className="d-flex gap-3 overflow-auto flex-nowrap pb-2">
          {misAreas.map((area) => (
            <AreaCard key={area.id} area={area} />
          ))}
        </div>
      </section>

      {/* ───── ÁREAS DISPONIBLES ───── */}
      <section>
        <h5 className="fw-bold mb-3">Áreas disponibles</h5>

        <div className="d-flex gap-3 overflow-auto flex-nowrap pb-2">
          {Aereasgenerales.map((area) => (
            <AreaCard
              key={area.Id}
              area={area}
              mostrarBoton={true}
              onRegistrar={registrarArea}
            />
          ))}
        </div>
      </section>

    </section>
  );
}
