import { useEffect, useState } from "react";
import { supabase } from "../../../Supabase/cliente";

export default function Areas() {
  const [areas, setAreas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEditar, setModoEditar] = useState(false);
  const [areaActual, setAreaActual] = useState(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenFile, setImagenFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // =====================
  // CARGAR AREAS
  // =====================
  const cargarAreas = async () => {
    const { data, error } = await supabase
      .from("Aerea")
      .select("*")
      .order("Nombre", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setAreas(data);
  };

  useEffect(() => {
    cargarAreas();
  }, []);

  // =====================
  // ABRIR CREAR
  // =====================
  const abrirCrear = () => {
    setModoEditar(false);
    setNombre("");
    setDescripcion("");
    setImagenFile(null);
    setPreview(null);
    setMostrarModal(true);
  };

  // =====================
  // ABRIR EDITAR
  // =====================
  const abrirEditar = (area) => {
    setModoEditar(true);
    setAreaActual(area);
    setNombre(area.Nombre);
    setDescripcion(area.Descripcion);
    setPreview(area.Imagen);
    setMostrarModal(true);
  };

  // =====================
  // SUBIR IMAGEN
  // =====================
  const subirImagen = async () => {
    if (!imagenFile) return null;

    const nombreArchivo = `area_${Date.now()}`;

    const { error } = await supabase.storage
      .from("Aereas")
      .upload(nombreArchivo, imagenFile);

    if (error) {
      console.error(error);
      return null;
    }

    const { data } = supabase.storage
      .from("Aereas")
      .getPublicUrl(nombreArchivo);

    return data.publicUrl;
  };

  // =====================
  // GUARDAR
  // =====================
  const guardarArea = async () => {
    if (!nombre || !descripcion) {
      alert("Completa todos los campos");
      return;
    }

    let imagenUrl = preview;

    if (imagenFile) {
      imagenUrl = await subirImagen();
    }

    if (modoEditar) {
      const { error } = await supabase
        .from("Aerea")
        .update({
          Nombre: nombre,
          Descripcion: descripcion,
          Imagen: imagenUrl,
        })
        .eq("Id", areaActual.Id);

      if (error) {
        console.error(error);
        return;
      }
    } else {
      const { error } = await supabase
        .from("Aerea")
        .insert([
          {
            Nombre: nombre,
            Descripcion: descripcion,
            Imagen: imagenUrl,
          },
        ]);

      if (error) {
        console.error(error);
        return;
      }
    }

    setMostrarModal(false);
    cargarAreas();
  };

  // =====================
  // ELIMINAR
  // =====================
  const eliminarArea = async (id) => {
    const confirmar = window.confirm("¿Seguro que deseas eliminar esta área?");
    if (!confirmar) return;

    const { error } = await supabase
      .from("Aerea")
      .delete()
      .eq("Id", id);

    if (error) {
      console.error(error);
      return;
    }

    cargarAreas();
  };

  return (
    <div className="container py-3">
      <h5 className="fw-bold text-center mb-4">
        🏢 Áreas Disponibles
      </h5>

      {areas.map((a) => (
        <div
          key={a.Id}
          className="mb-4 p-3 bg-white rounded-4 shadow-sm"
        >
          <img
            src={a.Foto || "https://via.placeholder.com/400x200"}
            alt="area"
            className="w-100 rounded-3 mb-3"
            style={{
              height: "160px",
              objectFit: "cover"
            }}
          />

          <h6 className="fw-bold">{a.Nombre}</h6>

          <p className="text-muted small mb-3">
            {a.Descripcion}
          </p>

          <div className="d-flex justify-content-between">
            <button
              className="btn btn-outline-primary btn-sm w-50 me-2"
              onClick={() => abrirEditar(a)}
            >
              ✏ Editar
            </button>

            <button
              className="btn btn-outline-danger btn-sm w-50"
              onClick={() => eliminarArea(a.Id)}
            >
              🗑 Eliminar
            </button>
          </div>
        </div>
      ))}

      {/* BOTON FLOTANTE */}
      <button
        className="btn btn-primary rounded-circle shadow"
        style={{
          position: "fixed",
          bottom: "80px",
          right: "20px",
          width: "55px",
          height: "55px",
          fontSize: "22px"
        }}
        onClick={abrirCrear}
      >
        +
      </button>

      {/* MODAL */}
      {mostrarModal && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,.4)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4">

              <div className="modal-header border-0">
                <h6 className="fw-bold m-0">
                  {modoEditar ? "Editar Área" : "Crear Área"}
                </h6>
                <button
                  className="btn-close"
                  onClick={() => setMostrarModal(false)}
                />
              </div>

              <div className="modal-body">

                <div className="mb-3">
                  <label className="form-label small">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small">Descripción</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small">Subir Imagen</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setImagenFile(file);
                      setPreview(URL.createObjectURL(file));
                    }}
                  />
                </div>

                {preview && (
                  <img
                    src={preview}
                    alt="preview"
                    className="w-100 rounded-3"
                    style={{
                      height: "150px",
                      objectFit: "cover"
                    }}
                  />
                )}

              </div>

              <div className="modal-footer border-0">
                <button
                  className="btn btn-outline-secondary w-50"
                  onClick={() => setMostrarModal(false)}
                >
                  Cancelar
                </button>

                <button
                  className="btn btn-primary w-50"
                  onClick={guardarArea}
                >
                  Guardar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
