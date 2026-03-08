import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/kokenmetjasper" className="logo">Koken met Jasper</Link>
    </nav>
  );
}

export default Navbar;