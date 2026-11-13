import { Link } from "react-router-dom";
import { Leaf } from "./Doodles";

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/kokenmetjasper" className="logo">
        <Leaf className="logo-mark" />
        <span>
          Koken <em>met</em> Jasper
        </span>
      </Link>
    </header>
  );
}

export default Navbar;
