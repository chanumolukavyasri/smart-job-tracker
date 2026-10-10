import { useState, useEffect } from "react";
import "./App.css";

const BASE_URL = "https://smart-job-tracker-production-8f8c.up.railway.app";
const AUTH_URL = `${BASE_URL}/api/auth`;
const JOBS_URL = `${BASE_URL}/api/jobs`;

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [token, setToken] = useState(
    () => sessionStorage.getItem("jobtrack_token") || ""
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("jobtrack_user") || "null"
      );
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [jobs, setJobs] = useState([]);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("Applied");
  const [filter, setFilter] = useState("All");

  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");

  function saveSession(data) {
    const userData = {
      name: data.name,
      email: data.email,
    };

    sessionStorage.setItem("jobtrack_token", data.token);
    sessionStorage.setItem(
      "jobtrack_user",
      JSON.stringify(userData)
    );

    setToken(data.token);
    setUser(userData);
    setPassword("");
    setError("");
  }

  function logout() {
    sessionStorage.removeItem("jobtrack_token");
    sessionStorage.removeItem("jobtrack_user");

    setToken("");
    setUser(null);
    setJobs([]);
    setPassword("");
    setError("");
    setAuthMode("login");
  }

  async function handleAuth(event) {
    event.preventDefault();
    setAuthLoading(true);
    setError("");

    try {
      if (authMode === "register") {
        const registerResponse = await fetch(
          `${AUTH_URL}/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: name.trim(),
              email: email.trim(),
              password,
            }),
          }
        );

        const registerData = await registerResponse.json();

        if (!registerResponse.ok) {
          throw new Error(
            registerData.message || "Registration failed."
          );
        }
      }

      const loginResponse = await fetch(`${AUTH_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(
          loginData.message || "Login failed."
        );
      }

      saveSession(loginData);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that Spring Boot is running."
          : err.message || "Something went wrong."
      );
    } finally {
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    async function loadJobs() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(JOBS_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem("jobtrack_token");
          sessionStorage.removeItem("jobtrack_user");

          if (!cancelled) {
            setToken("");
            setUser(null);
            setJobs([]);
            setError("Your session expired. Please log in again.");
          }
          return;
        }

        if (!response.ok) {
          throw new Error("Could not load applications.");
        }

        const data = await response.json();

        if (!cancelled) {
          setJobs(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message === "Failed to fetch"
              ? "Cannot connect to the backend."
              : err.message || "Failed to load applications."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function addJob(event) {
    event.preventDefault();

    if (!company.trim() || !role.trim()) {
      setError("Enter the company name and job role.");
      return;
    }

    const newJob = {
      company: company.trim(),
      role: role.trim(),
      date: new Date().toISOString().slice(0, 10),
      status,
    };

    try {
      setError("");

      const response = await fetch(JOBS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newJob),
      });

      if (response.status === 401 || response.status === 403) {
        logout();
        setError("Your session expired. Please log in again.");
        return;
      }

      if (!response.ok) {
        throw new Error("Could not save the application.");
      }

      const savedJob = await response.json();

      setJobs((previous) => [savedJob, ...previous]);
      setCompany("");
      setRole("");
      setStatus("Applied");
    } catch (err) {
      setError(err.message || "Failed to save application.");
    }
  }

  async function deleteJob(id) {
    try {
      setError("");

      const response = await fetch(`${JOBS_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        logout();
        setError("Your session expired. Please log in again.");
        return;
      }

      if (!response.ok) {
        throw new Error("Could not delete the application.");
      }

      setJobs((previous) =>
        previous.filter((job) => job.id !== id)
      );
    } catch (err) {
      setError(err.message || "Failed to delete application.");
    }
  }

  async function updateStatus(id, newStatus) {
    const currentJob = jobs.find((job) => job.id === id);
    if (!currentJob) return;

    try {
      setError("");

      const response = await fetch(`${JOBS_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          company: currentJob.company,
          role: currentJob.role,
          date: currentJob.date,
          status: newStatus,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        logout();
        setError("Your session expired. Please log in again.");
        return;
      }

      if (!response.ok) {
        throw new Error("Could not update the application.");
      }

      const updatedJob = await response.json();

      setJobs((previous) =>
        previous.map((job) =>
          job.id === id ? updatedJob : job
        )
      );
    } catch (err) {
      setError(err.message || "Failed to update application.");
    }
  }

  const visibleJobs =
    filter === "All"
      ? jobs
      : jobs.filter((job) => job.status === filter);

  const count = (value) =>
    jobs.filter((job) => job.status === value).length;

  // Login and registration
  if (!token) {
    return (
      <main className="auth-page">
        <div className="auth-shell">
          <div className="auth-brand">
            <span className="auth-logo">J</span>
            <span>JobTrack</span>
          </div>

          <section className="auth-card">
            <div className="auth-heading">
              <p className="auth-eyebrow">
                YOUR CAREER, ORGANIZED
              </p>

              <h1>
                {authMode === "login"
                  ? "Welcome back!"
                  : "Create your account"}
              </h1>

              <p>
                {authMode === "login"
                  ? "Log in to continue tracking your opportunities."
                  : "Start organizing your career journey."}
              </p>
            </div>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <form className="auth-form" onSubmit={handleAuth}>
              {authMode === "register" && (
                <label>
                  Full name
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                  />
                </label>
              )}

              <label>
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete={
                    authMode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  minLength={8}
                  required
                />
              </label>

              <button
                className="auth-submit"
                type="submit"
                disabled={authLoading}
              >
                {authLoading
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Log in"
                    : "Create account"}
              </button>
            </form>

            <div className="auth-switch">
              <span>
                {authMode === "login"
                  ? "New to JobTrack?"
                  : "Already have an account?"}
              </span>

              <button
                type="button"
                onClick={() => {
                  setAuthMode(
                    authMode === "login" ? "register" : "login"
                  );
                  setError("");
                }}
              >
                {authMode === "login"
                  ? "Create account"
                  : "Log in"}
              </button>
            </div>

            <p className="auth-footer">
              Organize your applications. Focus on your future.
            </p>
          </section>
        </div>
      </main>
    );
  }

  // Job application dashboard
  return (
    <main className="app">
      <aside className="sidebar">
        <div className="brand">
          <span>J</span> JobTrack
        </div>

        <p className="nav-label">WORKSPACE</p>

<button
  type="button"
  className={activePage === "dashboard" ? "nav-active" : "nav-item"}
  onClick={() => setActivePage("dashboard")}
>
  ▦ &nbsp; Dashboard
</button>

<button
  type="button"
  className={activePage === "applications" ? "nav-active" : "nav-item"}
  onClick={() => setActivePage("applications")}
>
  ▤ &nbsp; My Applications
</button>
        <div className="sidebar-note">
          <div className="note-icon">✦</div>
          <strong>Stay organized!</strong>
          <p>
            Every application brings you one step closer to your dream job.
          </p>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR CAREER, ORGANIZED</p>
            <h1>Job Application Tracker</h1>
            <p className="subtitle">
              Keep track of your opportunities and next steps.
            </p>
            <p>Welcome, {user?.name || user?.email}!</p>
          </div>

          <button type="button" onClick={logout}>
            Log out
          </button>
        </header>

        {error && (
          <p role="alert" style={{ color: "#c0392b" }}>
            {error}
          </p>
        )}

        {activePage === "dashboard" && (
        <section className="stats">

          <article className="stat-card">
            <p>Total Applications</p>
            <h2>{jobs.length}</h2>
            <span>All your opportunities</span>
          </article>

          <article className="stat-card">
            <p>Applied</p>
            <h2>{count("Applied")}</h2>
            <span>Waiting for a response</span>
          </article>

          <article className="stat-card">
            <p>Interviews</p>
            <h2>{count("Interview")}</h2>
            <span>Opportunities to shine</span>
          </article>

          <article className="stat-card">
            <p>Selected</p>
            <h2>{count("Selected")}</h2>
            <span>Offers and successes</span>
          </article>
        </section>
)}
{activePage === "dashboard" && (
        <section className="panel">

          <div className="section-heading">
            <div>
              <h2>Add an application</h2>
              <p>Record a new job or internship opportunity.</p>
            </div>
          </div>

          <form className="job-form" onSubmit={addJob}>
            <label>
              Company name
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="e.g. Amazon"
                required
              />
            </label>

            <label>
              Job role
              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="e.g. Software Intern"
                required
              />
            </label>

            <label>
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option>Applied</option>
                <option>Interview</option>
                <option>Selected</option>
                <option>Rejected</option>
              </select>
            </label>

            <button type="submit" disabled={loading}>
              + Add application
            </button>
          </form>
        </section>
)}
{activePage === "applications" && (
        <section className="panel">
          <div className="section-heading applications-heading">
            <div>
              <h2>My applications</h2>
              <p>Manage and update your recruitment progress.</p>
            </div>

            <select
              className="filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter applications"
            >
              <option>All</option>
              <option>Applied</option>
              <option>Interview</option>
              <option>Selected</option>
              <option>Rejected</option>
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>COMPANY & ROLE</th>
                  <th>DATE APPLIED</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {!loading &&
                  visibleJobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <strong>{job.company}</strong>
                        <small>{job.role}</small>
                      </td>

                      <td>{job.date}</td>

                      <td>
                        <select
                          className={`status status-${job.status.toLowerCase()}`}
                          value={job.status}
                          onChange={(event) =>
                            updateStatus(job.id, event.target.value)
                          }
                          aria-label={`Status for ${job.company}`}
                        >
                          <option>Applied</option>
                          <option>Interview</option>
                          <option>Selected</option>
                          <option>Rejected</option>
                        </select>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => deleteJob(job.id)}
                          aria-label={`Delete ${job.company}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {loading && (
              <p className="empty">Loading applications...</p>
            )}

            {!loading && visibleJobs.length === 0 && (
              <p className="empty">
                No applications found. Add one above!
              </p>
            )}
          </div>

          <p className="table-footer">
            Showing {visibleJobs.length} of {jobs.length} applications
          </p>
        </section>
)}
        <footer>
          JobTrack · Built to organize your career journey
        </footer>
      </section>
    </main>
  );
}

export default App;
