export default function Home() {
  return (
    <section>
        <section className=" d-flex flex-column m-3" style={{border:"1px solid green"}}>

        <h5>Listado de Áreas</h5>

        <section className="flex-grow-1 overflow-auto">
            <ul className="list-group">
            <li className="list-group-item">Área 1</li>
            <li className="list-group-item">Área 2</li>
            <li className="list-group-item">Área 3</li>
            </ul>
        </section>
        

        <button className="btn btn-primary mt-2">
            Nuevo
        </button>

        </section>

        
    </section>
  );
}
