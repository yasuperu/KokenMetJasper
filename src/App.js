import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import RecipePage from "./pages/RecipePage";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import site from "./site.json";

// Elk recept een eigen paginastatus (aantal personen, ontgrendeld, ...)
function RecipeRoute() {
  const { id } = useParams();
  return <RecipePage key={id} />;
}

// Oude Engelse adressen (/recipe/...) doorsturen naar /recept/...
function OldRecipeRedirect() {
  const { id } = useParams();
  return <Navigate to={`/recept/${id}/`} replace />;
}

function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recept/:id" element={<RecipeRoute />} />
        <Route path="/recipe/:id" element={<OldRecipeRedirect />} />
        <Route path={site.adminPath} element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
