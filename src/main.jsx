import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import TemplatesPanel from "./components/TemplatesPanel.jsx"; // Ajusta la ruta si tu carpeta es diferente

function Main() {
  const [selectedDocId, setSelectedDocId] = useState(null);

  return (
    <StrictMode>
      {selectedDocId === "plantillas" ? (
        <TemplatesPanel onBack={() => setSelectedDocId(null)} />
      ) : (
        <App onSelectDoc={setSelectedDocId} />
      )}
    </StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<Main />);
