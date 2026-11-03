
import "./Auth.css";

function Profile({ admin, onLogout }) {
  if (!admin) {
    return <p>Admin details not available.</p>;
  }

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    onLogout();
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-avatar">
          {admin.name?.charAt(0).toUpperCase() || "A"}
        </div>

        <h2>{admin.name || "Administrator"}</h2>
        <p className="profile-role">System Administrator</p>

        <div className="profile-details">
          <div className="profile-row">
            <span>Admin ID</span>
            <strong>{admin._id || admin.id || "N/A"}</strong>
          </div>

          <div className="profile-row">
            <span>Name</span>
            <strong>{admin.name || "N/A"}</strong>
          </div>

          <div className="profile-row">
            <span>Email</span>
            <strong>{admin.email || "N/A"}</strong>
          </div>

          <div className="profile-row">
            <span>Role</span>
            <strong>{admin.role || "Admin"}</strong>
          </div>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Profile;
