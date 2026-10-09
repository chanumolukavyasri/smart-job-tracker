
import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "https://smart-job-tracker-production-98a1.up.railway.app/api/jobs";

function App() {
  const [jobs, setJobs] = useState([]);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("Applied");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load applications from the Spring Boot backend
  useEffect(() => {
    async function loadJobs() {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Could not load applications.");
        }

        const data = await response.json();
        setJobs(data);
      } catch (err) {
        setError(
          "Cannot connect to the backend. Make sure Spring Boot is running on port 8081."
        );
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, []);

  async function addJob(e) {
    e.preventDefault();

    if (!company.trim() || !role.trim()) return;

    const newJob = {
      company: company.trim(),
      role: role.trim(),
      date: new Date().toISOString().slice(0, 10),
      status,
    };

    try {
      setError("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob),
      });

      if (!response.ok) {
        throw new Error("Could not save the application.");
      }

      const savedJob = await response.json();
      setJobs((previousJobs) => [savedJob, ...previousJobs]);
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

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete the application.");
      }

      setJobs((previousJobs) =>
        previousJobs.filter((job) => job.id !== id)
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

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: currentJob.company,
          role: currentJob.role,
          date: currentJob.date,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not update the application.");
      }

      const updatedJob = await response.json();

      setJobs((previousJobs) =>
        previousJobs.map((job) =>
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

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="brand"><span>J</span> JobTrack</div>
        <p className="nav-label">WORKSPACE</p>
        <div className="nav-active">▦ &nbsp; Dashboard</div>
        <div className="nav-item">▤ &nbsp; My Applications</div>
        <div className="sidebar-note">
          <div className="note-icon">✦</div>
          <strong>Stay organized!</strong>
          <p>Every application brings you one step closer to your dream job.</p>
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
          </div>
          <div className="avatar">JS</div>
        </header>

        {error && (
          <p role="alert" style={{ color: "#c0392b" }}>{error}</p>
        )}

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
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Amazon"
                required
              />
            </label>

            <label>
              Job role
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Software Intern"
                required
              />
            </label>

            <label>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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

        <section className="panel">
          <div className="section-heading applications-heading">
            <div>
              <h2>My applications</h2>
              <p>Manage and update your recruitment progress.</p>
            </div>

            <select
              className="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
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
                {!loading && visibleJobs.map((job) => (
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
                        onChange={(e) =>
                          updateStatus(job.id, e.target.value)
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

            {loading && <p className="empty">Loading applications...</p>}

            {!loading && visibleJobs.length === 0 && (
              <p className="empty">No applications found. Add one above!</p>
            )}
          </div>

          <p className="table-footer">
            Showing {visibleJobs.length} of {jobs.length} applications
          </p>
        </section>

        <footer>JobTrack · Built to organize your career journey</footer>
      </section>
    </main>
  );
}

export default App;
