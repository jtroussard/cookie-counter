/* eslint-disable react-refresh/only-export-components */
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Ensure toast styles are included
import PublicPage from "./PublicPage";
import PrivatePage from "./PrivatePage";
import Loading from "./Loading";

// eslint-disable-next-line react/prop-types 
const PrivateRoute = ({ element }) => {
  const token = localStorage.getItem("sessionToken");
  return token ? element : <Navigate to="/" />;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicPage />} />
        <Route path="/private" element={<PrivateRoute element={<PrivatePage />} />} />
        <Route path="loading-cookie" element={<Loading />} />
      </Routes>
    </BrowserRouter>
    
    {/* Toast container for global notifications */}
    <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
  </>
);



