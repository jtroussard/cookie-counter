import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";

const API_URL = import.meta.env.VITE_API_URL;

const PublicPage = () => {
  const [password, setPassword] = useState(""); 
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        navigate("/private");
      } else {
        setError("Invalid password");
      }
    } catch (err) {
      setError(`Server error, try again later: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />; // can update to accept message to render during loading

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-sm" style={{ maxWidth: "400px", width: "100%" }}>
        <h2 className="text-center mb-3">Enter Access Password</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="form-control mb-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Verifying..." : "Submit"}
          </button>
        </form>
        {error && <p className="text-danger text-center mt-2">{error}</p>}
      </div>
    </div>
  );
};

export default PublicPage;
