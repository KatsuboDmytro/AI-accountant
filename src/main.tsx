import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createHashRouter } from "react-router";

import App from "./App";
import { AIChat } from "./modules";
import './index.css';
const router = createHashRouter([
  {
    element: <App />,
    children: [
      {
        path: "/",
        element: <AIChat />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
