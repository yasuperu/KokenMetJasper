import { Link } from "react-router-dom";
import useSeo from "../hooks/useSeo";
import { Tomato } from "../components/Doodles";

function NotFound() {
  useSeo({ title: "Pagina niet gevonden | Koken met Jasper", noindex: true });

  return (
    <main className="container not-found">
      <Tomato className="not-found-icon" />
      <h1>Deze pagina bestaat niet</h1>
      <p>Misschien is het recept verplaatst of is de link niet helemaal goed.</p>
      <Link to="/" className="btn-primary">Naar alle recepten</Link>
    </main>
  );
}

export default NotFound;
