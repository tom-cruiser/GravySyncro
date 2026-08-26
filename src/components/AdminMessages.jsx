import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { io } from "socket.io-client";
import {
  Mail,
  MailOpen,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Tag,
  Filter,
  RefreshCw,
} from "lucide-react";
import "./AdminMessages.css";

// `source` scopes which messages this instance fetches/shows:
//   "app"                 -> in-app support messages (default)
//   "public_contact_form" -> landing-page contact form submissions
// Rendered twice from AdminDashboard.jsx as two separate tabs sharing
// this same list/detail UI, each scoped to its own source.
const AdminMessages = ({ source = "app", title }) => {
  const { token } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ unreadCount: 0 });
  const [response, setResponse] = useState("");
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    category: "",
    search: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const resolvedTitle = title || (source === "public_contact_form" ? "Contact Messages" : "Support Messages");

  useEffect(() => {
    fetchMessages();
  }, [page, filters, source]);

  // Live updates: the backend pushes a `message:new` event to every
  // admin over socket.io as soon as a message is created (see
  // messageController.js). Each tab only accepts events matching its
  // own `source`, mirroring the same filter the backend applies to the
  // initial fetch (an "app" tab treats anything that isn't
  // "public_contact_form" — including undefined, for pre-existing
  // messages — as its own).
  // `page` changes every time the admin paginates — read it from a ref
  // inside the handler instead of the effect deps, so paging doesn't tear
  // down and reconnect the socket.
  const pageRef = useRef(page);
  pageRef.current = page;

  useEffect(() => {
    if (!token) return undefined;

    const socketBaseUrl = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "").replace(/\/api\/v1\/?$/, "");
    const socket = io(socketBaseUrl || window.location.origin, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("authenticate", { token });
    });

    socket.on("message:new", (payload) => {
      const incoming = payload?.message;
      if (!incoming) return;

      const incomingSource = payload?.source || "app";
      const belongsToThisTab = source === "public_contact_form"
        ? incomingSource === "public_contact_form"
        : incomingSource !== "public_contact_form";
      if (!belongsToThisTab) return;

      // Only insert on page 1 — if an admin is a few pages deep, jumping
      // a new row in front of what they're looking at would be jarring.
      // They'll see it as soon as they page back to the top.
      setMessages((prev) => {
        if (pageRef.current !== 1 || prev.some((m) => m._id === incoming._id)) return prev;
        return [incoming, ...prev];
      });
      setStats((prev) => ({ unreadCount: (prev.unreadCount || 0) + 1 }));
    });

    return () => {
      socket.disconnect();
    };
  }, [token, source]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        source,
        ...filters,
      };

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        },
      );

      setMessages(response.data.data.messages);
      setStats({ unreadCount: response.data.data.unreadCount });
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = async (message) => {
    setSelectedMessage(message);
    setResponse(message.response || "");

    // Mark as read if unread
    if (!message.isRead) {
      try {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/messages/${message._id}/read`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        fetchMessages(); // Refresh list
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    }
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!response.trim()) return;

    setSending(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/messages/${selectedMessage._id}/respond`,
        { response, status: "resolved" },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      alert("Response sent successfully!");
      setSelectedMessage(null);
      setResponse("");
      fetchMessages();
    } catch (error) {
      console.error("Error sending response:", error);
      alert("Failed to send response");
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (messageId, newStatus) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/messages/${messageId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchMessages();
      if (selectedMessage && selectedMessage._id === messageId) {
        setSelectedMessage({ ...selectedMessage, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      priority: "",
      category: "",
      search: "",
    });
    setPage(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="status-icon status-pending" size={16} />;
      case "in_progress":
        return (
          <AlertCircle className="status-icon status-progress" size={16} />
        );
      case "resolved":
        return (
          <CheckCircle className="status-icon status-resolved" size={16} />
        );
      case "closed":
        return <CheckCircle className="status-icon status-closed" size={16} />;
      default:
        return null;
    }
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority}`;
  };

  return (
    <div className="admin-messages">
      <div className="messages-header">
        <div>
          <h2>
            <Mail size={24} /> {resolvedTitle}
            {stats.unreadCount > 0 && (
              <span className="unread-badge">{stats.unreadCount}</span>
            )}
          </h2>
        </div>
        <button onClick={fetchMessages} className="btn-refresh">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="messages-filters">
        <input
          type="text"
          placeholder="Search messages..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="filter-input"
        />

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => handleFilterChange("priority", e.target.value)}
          className="filter-select"
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => handleFilterChange("category", e.target.value)}
          className="filter-select"
        >
          <option value="">All Categories</option>
          <option value="general">General</option>
          <option value="technical">Technical</option>
          <option value="billing">Billing</option>
          <option value="feature_request">Feature Request</option>
          <option value="bug_report">Bug Report</option>
          <option value="other">Other</option>
        </select>

        <button onClick={clearFilters} className="btn-clear-filters">
          Clear Filters
        </button>
      </div>

      <div className="messages-content">
        <div className="messages-list">
          {loading ? (
            <div className="loading">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="no-messages">
              <Mail size={48} />
              <p>No messages found</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`message-item ${!message.isRead ? "unread" : ""} ${
                  selectedMessage?._id === message._id ? "selected" : ""
                }`}
                onClick={() => handleSelectMessage(message)}
              >
                <div className="message-item-header">
                  <div className="message-user">
                    {!message.isRead ? (
                      <Mail size={18} />
                    ) : (
                      <MailOpen size={18} />
                    )}
                    <span className="user-name">
                      {message.source === "public_contact_form"
                        ? message.visitor?.email
                        : `${message.user?.firstName || ""} ${message.user?.lastName || ""}`}
                    </span>
                    {message.source === "public_contact_form" && (
                      <span className="source-badge">Contact Form</span>
                    )}
                  </div>
                  <span
                    className={`priority-badge ${getPriorityClass(message.priority)}`}
                  >
                    {message.priority}
                  </span>
                </div>
                <div className="message-subject">{message.subject}</div>
                <div className="message-meta">
                  <span className="category-tag">
                    <Tag size={14} /> {message.category.replace("_", " ")}
                  </span>
                  <span className="status-badge">
                    {getStatusIcon(message.status)}
                    {message.status.replace("_", " ")}
                  </span>
                </div>
                <div className="message-date">
                  <Calendar size={14} /> {formatDate(message.createdAt)}
                </div>
              </div>
            ))
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-page"
              >
                Previous
              </button>
              <span className="page-info">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-page"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="message-detail">
          {!selectedMessage ? (
            <div className="no-selection">
              <Mail size={64} />
              <p>Select a message to view details</p>
            </div>
          ) : (
            <div className="detail-content">
              <div className="detail-header">
                <div className="detail-user-info">
                  <User size={24} />
                  <div>
                    {selectedMessage.source === "public_contact_form" ? (
                      <>
                        <h3>
                          {selectedMessage.visitor?.email}{" "}
                          <span className="source-badge">Contact Form</span>
                        </h3>
                        <p>{selectedMessage.visitor?.phone}</p>
                      </>
                    ) : (
                      <>
                        <h3>
                          {selectedMessage.user?.firstName}{" "}
                          {selectedMessage.user?.lastName}
                        </h3>
                        <p>{selectedMessage.user?.email}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="detail-actions">
                  <select
                    value={selectedMessage.status}
                    onChange={(e) =>
                      handleUpdateStatus(selectedMessage._id, e.target.value)
                    }
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="detail-meta">
                <span
                  className={`priority-badge ${getPriorityClass(selectedMessage.priority)}`}
                >
                  {selectedMessage.priority} priority
                </span>
                <span className="category-tag">
                  <Tag size={14} /> {selectedMessage.category.replace("_", " ")}
                </span>
                <span className="date-text">
                  <Calendar size={14} /> {formatDate(selectedMessage.createdAt)}
                </span>
              </div>

              <div className="detail-subject">
                <h4>Subject:</h4>
                <p>{selectedMessage.subject}</p>
              </div>

              <div className="detail-message">
                <h4>Message:</h4>
                <p>{selectedMessage.message}</p>
              </div>

              {selectedMessage.response && (
                <div className="detail-response">
                  <h4>Your Response:</h4>
                  <p>{selectedMessage.response}</p>
                  {selectedMessage.respondedAt && (
                    <small>
                      Responded on {formatDate(selectedMessage.respondedAt)} by{" "}
                      {selectedMessage.respondedBy?.firstName}{" "}
                      {selectedMessage.respondedBy?.lastName}
                    </small>
                  )}
                </div>
              )}

              <form onSubmit={handleSendResponse} className="response-form">
                <h4>
                  {selectedMessage.response
                    ? "Update Response:"
                    : "Send Response:"}
                </h4>
                {selectedMessage.source === "public_contact_form" && (
                  <p className="response-form-note">
                    This visitor has no account, so your response is saved
                    here but won't trigger an in-app notification — reach
                    them directly at {selectedMessage.visitor?.email || "their email"}{" "}
                    if needed.
                  </p>
                )}
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response here..."
                  rows="6"
                  required
                  disabled={sending}
                />
                <button type="submit" className="btn-send" disabled={sending}>
                  <Send size={18} />
                  {sending ? "Sending..." : "Send Response"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
