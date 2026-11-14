import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import RecipePage from "./pages/RecipePage";
import NotFound from "./pages/NotFound";
import site from "./site.json";

// Beheer apart laden: bezoekers downloaden die code niet
const Admin = lazy(() => import("./pages/Admin"));

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

/** De hele site zonder router; scripts/prerender.js rendert dit vooraf. */
export function AppShell() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recept/:id" element={<RecipeRoute />} />
        <Route path="/recipe/:id" element={<OldRecipeRedirect />} />
        <Route
          path={site.adminPath}
          element={
            <Suspense fallback={<main className="admin"><p className="hint">Beheer laden…</p></main>}>
              <Admin />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
