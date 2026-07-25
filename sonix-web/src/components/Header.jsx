import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid #dbdbdb"
    }}>
      <div style={{
        maxWidth: 975, margin: "0 auto", padding: "0 20px",
        height: 60, display: "flex", alignItems: "center",
        justifyContent: "space-between"
      }}>
        <Link to="/feed" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Instagram Sans', cursive", color: "#000" }}>Sonix</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to="/feed" style={{ color: "#262626", textDecoration: "none" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </Link>
          <Link to="/explore" style={{ color: "#262626", textDecoration: "none" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </Link>
          {user && (
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => navigate(`/profile/${user.id}`)}>
              <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=6366f1&color=fff`}
                style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} alt="" />
            </div>
          )}
          <button onClick={handleLogout} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#0095f6", fontWeight: 600, fontSize: 14, padding: 0
          }}>Log out</button>
        </div>
      </div>
    </header>
  );
}
