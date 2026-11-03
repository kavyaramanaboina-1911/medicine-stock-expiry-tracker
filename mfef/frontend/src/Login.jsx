
import { useState } from "react";
import axios from "axios";
import "./Auth.css";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email: email.trim().toLowerCase(),
          password: password
        }
      );

      const { token, admin } = response.data;

      if (!token || !admin) {
        throw new Error("Invalid server response");
      }

      localStorage.setItem("adminToken", token);
      localStorage.setItem("admin", JSON.stringify(admin));

      onLogin(admin);

    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to login. Please check your server."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div className="auth-icon">💊</div>

        <h1 className="login-title">
          Medicine
          <span>Stock & Expiry Tracker</span>
        </h1>

        <p className="auth-subtitle">
          Admin Login
        </p>

        <form onSubmit={handleLogin}>

          <label>Email Address</label>

          <input
            className="login-input"
            type="email"
            placeholder="Enter admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />

          <label>Password</label>

          <div className="password-box">

            <input
              className="login-input"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="show-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>

          </div>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="auth-footer">
          Authorized administrators only
        </p>

      </div>
    </div>
  );
}

export default Login;
