import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/inter/wght.css";
import "./App.css";

const container = document.getElementById("root");

// Vooraf gebouwde pagina's (scripts/prerender.js) overnemen; anders gewoon renderen
if (container.hasChildNodes()) {
  ReactDOM.hydrateRoot(container, <App />);
} else {
  ReactDOM.createRoot(container).render(<App />);
}
