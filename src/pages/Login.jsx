import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import authService from "../services/authService";
import LoginCard from "../components/login/LoginCard";
import ForgotPasswordModal from "../components/login/ForgotPasswordModal";
import "../styles/Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { showNotification, setUser } = useAppContext();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setErrors({});

      const response = await authService.login(identifier.trim(), password);

      if (response.success) {
        if (response.data?.employee) {
          setUser(response.data.employee);
        }

        showNotification(response.message || "Login successful!", "success");

        setTimeout(() => {
          navigate("/dashboard");
        }, 800);
      }
    } catch (error) {
      const errorMessage = error.message || "Login failed";
      showNotification(errorMessage, "error");
      setErrors({ general: errorMessage });
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* LAYER 1: BACKGROUND IMAGE */}
      <div className="login-bg-layer">
        <img src="/loginbg.png" alt="Background" className="login-bg-image" />
      </div>

      {/* LAYER 2: LOGIN CARD */}
      <div className="login-content-layer">
        <div className="login-content">
          {/* Logo positioned at middle/center outside box */}
          <div className="login-logo-outside">
            <img src="/finallogo.png" alt="Xtracto" />
          </div>

          <LoginCard
            identifier={identifier}
            setIdentifier={setIdentifier}
            password={password}
            setPassword={setPassword}
            onSubmit={handleLogin}
            loading={loading}
            errors={errors}
            onForgotPassword={() => setShowForgotPassword(true)}
          />
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default Login;
