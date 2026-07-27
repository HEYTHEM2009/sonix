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

  if (user) {
    navigate("/feed", { replace: true });
    return null;
  }

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
    <div className="snx-login">
      <div className="snx-login__card">
        <h1 className="snx-login__title">Sonix</h1>
        {error && <div className="snx-login__error">{error}</div>}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input className="snx-login__input" placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          )}
          {!isLogin && (
            <input className="snx-login__input" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          )}
          <input className="snx-login__input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="snx-login__input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          <button className="snx-login__btn" disabled={loading} type="submit">
            {loading ? "Loading..." : isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>
        <div className="snx-login__toggle">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}<button className="snx-login__toggle-btn" onClick={() => { setIsLogin(!isLogin); setError(""); }}>{isLogin ? "Sign up" : "Log in"}</button>
        </div>
      </div>
    </div>
  );
}
