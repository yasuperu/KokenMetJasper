import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <p>
        Koken met Jasper · recepten om te delen, te bewaren en af te drukken
        <span className="footer-sep"> · </span>
        <Link to="/admin" className="footer-admin">Beheer</Link>
      </p>
    </footer>
  );
}

export default Footer;
