import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./app.jsx";
import Editor from "./editor.jsx";

// Parse the query string from the URL
const params = new URLSearchParams(window.location.search);
const isEditorMode = params.get("editor") === "true";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {isEditorMode ? <Editor /> : <App />}
  </React.StrictMode>
);