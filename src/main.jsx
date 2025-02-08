import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PublicPage from "./PublicPage";
import PrivatePage from "./PrivatePage";

// eslint-disable-next-line react/prop-types
const PrivateRoute = ({ element }) => {
  const token = localStorage.getItem("sessionToken");
  return token ? element : <Navigate to="/" />;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<PublicPage />} />
      <Route path="/private" element={<PrivateRoute element={<PrivatePage />} />} />
    </Routes>
  </BrowserRouter>
);
