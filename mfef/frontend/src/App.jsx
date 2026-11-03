
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  CalendarDays,
  User,
  LogOut,
  Pill,
  Menu,
  X,
  Search,
  RefreshCw,
  Upload,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Login from "./Login";
import Profile from "./Profile";
import "./App.css";

const API_URL = "http://localhost:5000/api";
const PAGE_SIZE = 50;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function App() {
  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("admin") || "null");
    } catch {
      return null;
    }
  });

  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Medicine field helpers
  const getExpiryDate = (medicine) =>
    medicine.expiryDate ||
    medicine.expiry ||
    medicine.expirationDate;

  const getQuantity = (medicine) =>
    Number(medicine.quantity ?? medicine.stock ?? 0);

  const getMinimumStock = (medicine) =>
    Number(medicine.minStock ?? medicine.minimumStock ?? 20);

  const getMedicineName = (medicine) =>
    medicine.medicineName ||
    medicine.name ||
    "Unnamed medicine";

  const getMedicineId = (medicine) =>
    medicine._id || medicine.id;

  // Expiry status
  const getExpiryStatus = (medicine) => {
    const expiry = getExpiryDate(medicine);

    if (!expiry) return "Unknown";

    const expiryDate = new Date(expiry);

    if (Number.isNaN(expiryDate.getTime())) {
      return "Unknown";
    }

    expiryDate.setHours(0, 0, 0, 0);

    const daysLeft = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / 86400000
    );

    if (daysLeft < 0) return "Expired";
    if (daysLeft <= 30) return "Expiring Soon";

    return "Valid";
  };

  // Format dates
  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Fetch medicines from MongoDB through backend API
  const fetchMedicines = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/medicines");

      console.log("API RESPONSE:", response.data);
      console.log(
        "IS ARRAY:",
        Array.isArray(response.data)
      );

      let records = [];

      if (Array.isArray(response.data)) {
        records = response.data;
      } else if (Array.isArray(response.data.medicines)) {
        records = response.data.medicines;
      } else if (Array.isArray(response.data.data)) {
        records = response.data.data;
      }

      console.log("MEDICINE RECORDS:", records.length);
      console.log("FIRST MEDICINE:", records[0]);

      setMedicines(records);
      setCurrentPage(1);

      if (!Array.isArray(response.data) && records.length === 0) {
        console.warn(
          "API response did not contain a medicine array."
        );
      }
    } catch (err) {
      console.error("MEDICINE FETCH ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Could not load medicines. Check your backend API."
      );

      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  // Automatically load medicines when admin is logged in
  useEffect(() => {
    if (admin) {
      fetchMedicines();
    }
  }, [admin]);

  // Low stock medicines
  const lowStockMedicines = useMemo(
    () =>
      medicines.filter(
        (medicine) =>
          getQuantity(medicine) <= getMinimumStock(medicine) &&
          getExpiryStatus(medicine) !== "Expired"
      ),
    [medicines]
  );

  // Expiring medicines
  const expiringMedicines = useMemo(
    () =>
      medicines.filter(
        (medicine) =>
          getExpiryStatus(medicine) === "Expiring Soon"
      ),
    [medicines]
  );

  // Expired medicines
  const expiredMedicines = useMemo(
    () =>
      medicines.filter(
        (medicine) =>
          getExpiryStatus(medicine) === "Expired"
      ),
    [medicines]
  );

  // Total stock
  const totalStock = useMemo(
    () =>
      medicines.reduce(
        (sum, medicine) => sum + getQuantity(medicine),
        0
      ),
    [medicines]
  );

  // Login
  const handleLogin = (adminData) => {
    setAdmin(adminData);
    localStorage.setItem("admin", JSON.stringify(adminData));
  };

  // Logout
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      console.log("Server logout request was unsuccessful.");
    }

    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    setAdmin(null);
    setMedicines([]);
    setActivePage("Dashboard");
  };

  // CSV import
  const handleCsvImport = async (event) => {
    event.preventDefault();

    if (!csvFile) {
      setNotice("Please select a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    setImporting(true);
    setNotice("");

    try {
      const response = await api.post(
        "/medicines/import-csv",
        formData
      );

      setNotice(
        `${response.data.message} Imported: ${
          response.data.importedCount ?? "See result"
        } records. Skipped: ${
          response.data.skippedCount ?? 0
        }.`
      );

      setCsvFile(null);
      event.target.reset();

      await fetchMedicines();
    } catch (err) {
      console.error("CSV IMPORT ERROR:", err);

      setNotice(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "CSV import failed. Check your backend terminal."
      );
    } finally {
      setImporting(false);
    }
  };

  // Sidebar menu
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Medicine Inventory", icon: Package },
    { name: "Stock Alerts", icon: AlertTriangle },
    { name: "Expiry Tracking", icon: CalendarDays },
    { name: "Profile", icon: User },
  ];

  // Search medicines
  const filteredMedicines = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return medicines;

    return medicines.filter((medicine) =>
      [
        getMedicineName(medicine),
        medicine.category,
        medicine.batchNumber,
        medicine.supplier,
        medicine.manufacturer,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [medicines, search]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredMedicines.length / PAGE_SIZE)
  );

  const paginatedMedicines = filteredMedicines.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Medicine table
  const renderMedicineTable = (
    records,
    showStatus = true,
    showPagination = false
  ) => (
    <>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Category</th>
              <th>Batch Number</th>
              <th>Quantity</th>
              <th>Expiry Date</th>
              {showStatus && <th>Status</th>}
            </tr>
          </thead>

          <tbody>
            {records.map((medicine, index) => {
              const status = getExpiryStatus(medicine);
              const quantity = getQuantity(medicine);
              const minimum = getMinimumStock(medicine);

              const stockStatus =
                quantity <= minimum ? "Low Stock" : "In Stock";

              return (
                <tr key={getMedicineId(medicine) || index}>
                  <td>
                    <div className="medicine-cell">
                      <span className="medicine-row-icon">
                        <Pill size={17} />
                      </span>

                      <strong>
                        {getMedicineName(medicine)}
                      </strong>
                    </div>
                  </td>

                  <td>{medicine.category || "—"}</td>

                  <td>
                    {medicine.batchNumber ||
                      medicine.batch ||
                      "—"}
                  </td>

                  <td>
                    <strong>{quantity}</strong>
                  </td>

                  <td>
                    {formatDate(getExpiryDate(medicine))}
                  </td>

                  {showStatus && (
                    <td>
                      <span
                        className={`status-badge ${
                          status === "Expired"
                            ? "expired"
                            : status === "Expiring Soon"
                              ? "expiring"
                              : quantity <= minimum
                                ? "low"
                                : status === "Valid"
                                  ? "available"
                                  : "unknown"
                        }`}
                      >
                        {status === "Expired"
                          ? "Expired"
                          : status === "Expiring Soon"
                            ? "Expiring Soon"
                            : quantity <= minimum
                              ? stockStatus
                              : status === "Valid"
                                ? "Available"
                                : "Check Date"}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}

            {records.length === 0 && (
              <tr>
                <td
                  colSpan={showStatus ? 6 : 5}
                  className="no-data"
                >
                  No medicine records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPagination && filteredMedicines.length > 0 && (
        <div className="pagination">
          <span>
            Showing{" "}
            {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(
              currentPage * PAGE_SIZE,
              filteredMedicines.length
            )}{" "}
            of {filteredMedicines.length} medicines
          </span>

          <div className="pagination-buttons">
            <button
              className="secondary-button"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              className="secondary-button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1)
                )
              }
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );

  // Login screen
  if (!admin) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside
        className={`sidebar ${
          sidebarOpen ? "" : "sidebar-closed"
        }`}
      >
        <div className="logo">
          <div className="logo-icon">
            <Pill size={25} />
          </div>

          {sidebarOpen && (
            <div>
              <h2>MediTrack</h2>
              <p>Medicine Management</p>
            </div>
          )}
        </div>

        <p className="menu-heading">
          {sidebarOpen ? "WORKSPACE" : ""}
        </p>

        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`side-link ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  setNotice("");
                  setCurrentPage(1);

                  if (window.innerWidth <= 768) {
                    setSidebarOpen(false);
                  }
                }}
                title={item.name}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="footer-avatar">
            {(admin.name || admin.email || "A")
              .charAt(0)
              .toUpperCase()}
          </div>

          {sidebarOpen && (
            <div className="footer-user">
              <strong>
                {admin.name || "Administrator"}
              </strong>
              <span>System Administrator</span>
            </div>
          )}

          <button
            className="logout-icon-button"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-heading">
            <button
              className="mobile-menu-button"
              onClick={() =>
                setSidebarOpen(!sidebarOpen)
              }
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <X size={21} />
              ) : (
                <Menu size={21} />
              )}
            </button>

            <div>
              <p className="breadcrumb">
                WORKSPACE / MEDICINE MANAGEMENT
              </p>

              <h1>{activePage}</h1>

              <p className="page-subtitle">
                Manage your medicines, stock and expiry dates.
              </p>
            </div>
          </div>

          <div className="profile">
            <div className="profile-avatar">
              {(admin.name || admin.email || "A")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {admin.name || "Administrator"}
              </strong>
              <small>Administrator</small>
            </div>
          </div>
        </header>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="notice error-notice">
            <AlertCircle size={19} />
            <span>{error}</span>

            <button onClick={fetchMedicines}>
              Retry
            </button>
          </div>
        )}

        {/* NOTICE */}
        {notice && (
          <div className="notice">
            <AlertCircle size={19} />
            <span>{notice}</span>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="loading-message">
            <RefreshCw size={18} className="spin-icon" />
            Loading medicine records...
          </div>
        )}

        {/* DASHBOARD */}
        {activePage === "Dashboard" && (
          <section className="page-content">
            <div className="welcome-section">
              <div>
                <span className="welcome-label">
                  <ShieldCheck size={15} />
                  ADMIN OVERVIEW
                </span>

                <h2>
                  Welcome back,{" "}
                  {admin.name || "Administrator"}!
                </h2>

                <p>
                  Here is an overview of your medicine
                  inventory and stock health.
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={fetchMedicines}
                disabled={loading}
              >
                <RefreshCw size={17} />
                Refresh Data
              </button>
            </div>

            {/* STATISTICS */}
            <div className="stats-grid">
              <StatCard
                icon={<Package size={23} />}
                label="Total Medicines"
                value={medicines.length.toLocaleString("en-IN")}
                caption="Medicine records in database"
                color="blue"
              />

              <StatCard
                icon={<Pill size={23} />}
                label="Total Stock Units"
                value={totalStock.toLocaleString("en-IN")}
                caption="Units currently recorded"
                color="green"
              />

              <StatCard
                icon={<TrendingUp size={23} />}
                label="Low Stock"
                value={lowStockMedicines.length.toLocaleString("en-IN")}
                caption="Need restocking"
                color="orange"
              />

              <StatCard
                icon={<Clock size={23} />}
                label="Expiring Soon"
                value={expiringMedicines.length.toLocaleString("en-IN")}
                caption="Within the next 30 days"
                color="purple"
              />

              <StatCard
                icon={<AlertTriangle size={23} />}
                label="Expired Medicines"
                value={expiredMedicines.length.toLocaleString("en-IN")}
                caption="Require attention"
                color="red"
              />
            </div>

            {/* RECENT RECORDS */}
            <div className="inventory-section">
              <div className="section-header">
                <div>
                  <h2>Recent Medicine Records</h2>
                  <p>
                    Latest records returned by your medicine API.
                  </p>
                </div>

                <button
                  className="text-button"
                  onClick={() =>
                    setActivePage("Medicine Inventory")
                  }
                >
                  View Inventory →
                </button>
              </div>

              {renderMedicineTable(
                medicines.slice(0, 5)
              )}
            </div>

            {/* CSV IMPORT */}
            <div className="inventory-section csv-section">
              <div className="section-header">
                <div>
                  <h2>Import Medicine CSV</h2>
                  <p>
                    Import your spreadsheet to add medicine
                    records to MongoDB.
                  </p>
                </div>

                <div className="csv-icon">
                  <Upload size={22} />
                </div>
              </div>

              <form
                onSubmit={handleCsvImport}
                className="csv-form"
              >
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) =>
                    setCsvFile(
                      event.target.files?.[0] || null
                    )
                  }
                />

                <button
                  className="primary-button"
                  type="submit"
                  disabled={importing || loading}
                >
                  <Upload size={17} />
                  {importing ? "Importing..." : "Import CSV"}
                </button>
              </form>

              <p className="helper-text">
                Select a CSV file containing medicine records.
              </p>
            </div>
          </section>
        )}

        {/* MEDICINE INVENTORY */}
        {activePage === "Medicine Inventory" && (
          <section className="page-content">
            <div className="inventory-section">
              <div className="section-header">
                <div>
                  <h2>Medicine Inventory</h2>
                  <p>
                    All medicine records loaded from your database.
                  </p>
                </div>

                <span className="record-count">
                  {filteredMedicines.length.toLocaleString("en-IN")} records
                </span>
              </div>

              <div className="search-box">
                <Search size={18} />

                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search medicine, category, batch or supplier..."
                />
              </div>

              {renderMedicineTable(
                paginatedMedicines,
                true,
                true
              )}
            </div>
          </section>
        )}

        {/* STOCK ALERTS */}
        {activePage === "Stock Alerts" && (
          <section className="page-content">
            <div className="inventory-section">
              <div className="section-header">
                <div>
                  <h2>Stock Alerts</h2>
                  <p>
                    Medicines that have reached their minimum
                    stock level.
                  </p>
                </div>

                <span className="record-count">
                  {lowStockMedicines.length} alerts
                </span>
              </div>

              {renderMedicineTable(lowStockMedicines)}
            </div>
          </section>
        )}

        {/* EXPIRY TRACKING */}
        {activePage === "Expiry Tracking" && (
          <section className="page-content">
            <div className="inventory-section">
              <div className="section-header">
                <div>
                  <h2>Expiry Tracking</h2>
                  <p>
                    Medicines that are expired or approaching
                    their expiry date.
                  </p>
                </div>

                <span className="record-count">
                  {(
                    expiredMedicines.length +
                    expiringMedicines.length
                  ).toLocaleString("en-IN")} alerts
                </span>
              </div>

              {renderMedicineTable(
                medicines.filter((medicine) =>
                  ["Expired", "Expiring Soon"].includes(
                    getExpiryStatus(medicine)
                  )
                )
              )}
            </div>
          </section>
        )}

        {/* PROFILE */}
        {activePage === "Profile" && (
          <section className="page-content">
            <div className="page-heading">
              <span className="welcome-label">
                <ShieldCheck size={15} />
                ACCOUNT SETTINGS
              </span>

              <h2>Administrator Profile</h2>

              <p>
                View your account details and manage your session.
              </p>
            </div>

            <Profile
              admin={admin}
              onLogout={handleLogout}
            />
          </section>
        )}
      </main>
    </div>
  );
}

// DASHBOARD STAT CARD
function StatCard({
  icon,
  label,
  value,
  caption,
  color,
}) {
  return (
    <article className={`stat-card ${color}`}>
      <div className="stat-card-top">
        <div className="stat-icon">{icon}</div>

        <span className="stat-decoration">
          <CheckCircle size={16} />
        </span>
      </div>

      <p className="stat-label">{label}</p>

      <h2>{value}</h2>

      <p className="stat-caption">{caption}</p>
    </article>
  );
}

export default App;
