import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: "", password: "", username: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  if (user) { navigate("/feed", { replace: true }); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      navigate("/feed");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#fafafa", padding: 20
    }}>
      <div style={{ maxWidth: 350, width: "100%" }}>
        <div style={{
          background: "#fff", border: "1px solid #dbdbdb", borderRadius: 1,
          padding: "40px 40px 20px", marginBottom: 10
        }}>
          <h1 style={{
            textAlign: "center", fontSize: 36, fontWeight: 700,
            fontFamily: "'Instagram Sans', cursive", margin: "0 0 30px",
            letterSpacing: "-0.5px"
          }}>Sonix</h1>
          {error && (
            <div style={{
              background: "#fedbdb", color: "#8b3a3a", padding: "8px 12px",
              borderRadius: 4, fontSize: 13, marginBottom: 12, textAlign: "center"
            }}>{error}</div>
          )}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <input name="name" placeholder="Full Name"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle} required />
            )}
            {!isLogin && (
              <input name="username" placeholder="Username"
                value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                style={inputStyle} required />
            )}
            <input name="email" type="email" placeholder="Email"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputStyle} required />
            <input name="password" type="password" placeholder="Password"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={inputStyle} required minLength={6} />
            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "7px 16px", background: loading ? "#b2dffc" : "#0095f6",
              color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14,
              cursor: loading ? "default" : "pointer", marginTop: 8
            }}>
              {loading ? "Loading..." : isLogin ? "Log In" : "Sign Up"}
            </button>
          </form>
        </div>
        <div style={{
          background: "#fff", border: "1px solid #dbdbdb", borderRadius: 1,
          padding: "20px 40px", textAlign: "center", fontSize: 14
        }}>
          <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>{" "}
          <button onClick={() => { setIsLogin(!isLogin); setError(""); }}
            style={{ background: "none", border: "none", color: "#0095f6", fontWeight: 600, cursor: "pointer", fontSize: 14, padding: 0 }}>
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 0 7px 8px", marginBottom: 6,
  border: "1px solid #dbdbdb", borderRadius: 4, fontSize: 12,
  outline: "none", boxSizing: "border-box", background: "#fafafa"
};
