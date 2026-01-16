import { useNavigate } from "react-router-dom";

export default function Aereas() {
  const navigate = useNavigate();

  const areasMock = [
    {
      id: 1,
      nombre: "Sonido",
      imagen: "https://tse2.mm.bing.net/th/id/OIP.UVVmDWFw0Hu8vi4a774mewHaE7?rs=1&pid=ImgDetMain&o=7&rm=3",
    },
    {
      id: 2,
      nombre: "Iluminación",
      imagen: "https://tse2.mm.bing.net/th/id/OIP.xKEFIll7yCtSgO6BW030oAHaFE?rs=1&pid=ImgDetMain&o=7&rm=3",
    },
    {
      id: 3,
      nombre: "Cámaras",
      imagen: "https://tse2.mm.bing.net/th/id/OIP.L8iJHqugZ7cDamKa3AWtLgHaE7?rs=1&pid=ImgDetMain&o=7&rm=3",
    },
  ];

  return (
    <div className="container py-3">

      <h4 className="fw-bold text-center mb-4">
        Áreas disponibles
      </h4>

      <div className="row g-3">
        {areasMock.map((area) => (
          <div key={area.id} className="col-6 col-md-4">
            <div
              className="card h-100 shadow-sm"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/areas/${area.id}`)}
            >
              <img
                src={area.imagen}
                className="card-img-top"
                alt={area.nombre}
                style={{ height: "140px", objectFit: "cover" }}
              />
              <div className="card-body text-center">
                <h6 className="fw-semibold mb-0">
                  {area.nombre}
                </h6>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BOTÓN AGREGAR */}
      <div className="d-grid mt-4">
        <button className="btn btn-dark">
          + Agregar nueva área
        </button>
      </div>

    </div>
  );
}
