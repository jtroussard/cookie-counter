import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
      const response = await fetch("http://localhost:5174/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("sessionToken", data.token);
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

  return (
    <div>
      <h1>Enter Access Password</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Verifing..." : "Submit"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default PublicPage;
