import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path) => {
    if (path === "/profile") return location.pathname.startsWith("/profile");
    return location.pathname === path;
  };

  return (
    <header className="snx-header">
      <Link to="/feed" className="snx-header__logo">
        Sonix
      </Link>

      <nav className="snx-header__nav">
        {user && (
          <>
            <Link
              to="/feed"
              className={`snx-header__nav-link ${isActive("/feed") ? "snx-header__nav-link--active" : ""}`}
              title="Feed"
              aria-current={isActive("/feed") ? "page" : undefined}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </Link>

            <Link
              to="/explore"
              className={`snx-header__nav-link ${isActive("/explore") ? "snx-header__nav-link--active" : ""}`}
              title="Explore"
              aria-current={isActive("/explore") ? "page" : undefined}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </Link>

            <Link
              to={`/profile/${user.id}`}
              className={`snx-header__nav-link ${isActive("/profile") ? "snx-header__nav-link--active" : ""}`}
              title="Profile"
              aria-current={isActive("/profile") ? "page" : undefined}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </Link>

            <button
              onClick={handleLogout}
              className="snx-header__logout"
              title="Log out"
              aria-label="Log out"
            >
              Log out
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
