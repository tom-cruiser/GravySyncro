import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ArrowUpDown, FolderKanban, LayoutGrid, List, Lock, Search, Settings2, Trash2, Users } from 'lucide-react';
import api from '../config/api';
import './WorkspaceGrid.css';

const WorkspaceGrid = ({
  token,
  workspaceLabel = 'Workspaces',
  canManage = false,
  canCreate = false,
  refreshSignal = 0,
  onOpenWorkspace,
  onOpenTeam,
  onOpenSettings,
  onDeleteWorkspace,
  onCreate,
  onUnauthorized,
  onDataLoaded,
}) => {
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const loadWorkspaces = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(api.endpoints.workspaces.list(), authHeaders);
      const items = response.data?.data?.workspaces || [];
      setWorkspaces(items);
      if (onDataLoaded) onDataLoaded(items);
    } catch (error) {
      if (error?.response?.status === 401 && onUnauthorized) {
        onUnauthorized();
      }
      setWorkspaces([]);
      if (onDataLoaded) onDataLoaded([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, [token, refreshSignal]);

  const filteredSortedWorkspaces = useMemo(() => {
    const query = search.trim().toLowerCase();
    let scoped = !query
      ? [...workspaces]
      : workspaces.filter((workspace) => {
          const name = String(workspace.name || '').toLowerCase();
          const client = String(workspace.clientName || '').toLowerCase();
          return name.includes(query) || client.includes(query);
        });

    if (statusFilter === 'active') {
      scoped = scoped.filter((workspace) => workspace.status !== 'archived');
    }

    if (statusFilter === 'archived') {
      scoped = scoped.filter((workspace) => workspace.status === 'archived');
    }

    if (sortBy === 'name') {
      scoped.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    }

    if (sortBy === 'members') {
      scoped.sort((a, b) => getMemberCount(b) - getMemberCount(a));
    }

    if (sortBy === 'recent') {
      scoped.sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bDate - aDate;
      });
    }

    return scoped;
  }, [workspaces, search, statusFilter, sortBy]);

  const singularLabel = workspaceLabel.endsWith('s') ? workspaceLabel.slice(0, -1) : workspaceLabel;

  const formatLastActivity = (workspace) => {
    const value = workspace.updatedAt || workspace.createdAt;
    if (!value) return 'Unknown';
    return new Date(value).toLocaleDateString();
  };

  const getMemberCount = (workspace) => {
    const members = workspace.members || [];
    const guests = workspace.guests || [];
    const set = new Set([
      ...(members.map((entry) => entry.user?._id || entry.user || entry)),
      ...(guests.map((entry) => entry.user?._id || entry.user || entry)),
      workspace.manager?._id || workspace.manager,
    ].map((item) => String(item || '')));
    return set.has('') ? set.size - 1 : set.size;
  };

  return (
    <section className="workspace-gallery">
      <div className="workspace-gallery-toolbar">
        <div className="workspace-gallery-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${workspaceLabel.toLowerCase()}...`}
          />
        </div>

        <div className="workspace-gallery-controls">
          <select
            className="workspace-select-control"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter workspaces by status"
          >
            <option value="all">All status</option>
            <option value="active">Active only</option>
            <option value="archived">Archived only</option>
          </select>
          <label className="workspace-sort-wrap" htmlFor="workspace-sort">
            <ArrowUpDown size={14} />
            <select
              id="workspace-sort"
              className="workspace-select-control"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name</option>
              <option value="members">Most Members</option>
            </select>
          </label>
          <button
            type="button"
            className={`workspace-mini-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={14} /> Grid
          </button>
          <button
            type="button"
            className={`workspace-mini-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={14} /> List
          </button>
        </div>
      </div>

      <p className="workspace-gallery-summary">
        Showing {filteredSortedWorkspaces.length} of {workspaces.length} {workspaceLabel.toLowerCase()}
      </p>

      {loading ? (
        <p className="workspace-gallery-loading">Loading {workspaceLabel.toLowerCase()}...</p>
      ) : filteredSortedWorkspaces.length === 0 ? (
        <div className="workspace-gallery-empty">
          <FolderKanban size={40} />
          <h3>No matching {workspaceLabel.toLowerCase()}</h3>
          <p>Try clearing search/filter or create a new {singularLabel.toLowerCase()}.</p>
          {canCreate && (
            <button type="button" className="primary-btn" onClick={onCreate}>
              Create New {singularLabel}
            </button>
          )}
        </div>
      ) : (
        <div className={`workspace-gallery-list ${viewMode}`}>
          {filteredSortedWorkspaces.map((workspace) => {
            const isArchived = workspace.status === 'archived';
            const isLocked = isArchived && !workspace.reworkEnabled;
            return (
              <article
                key={workspace._id}
                className={`workspace-gallery-card ${isLocked ? 'locked' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => onOpenWorkspace?.(workspace)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpenWorkspace?.(workspace);
                  }
                }}
              >
                <div className="workspace-gallery-head">
                  <strong className="workspace-gallery-title">{singularLabel}: {workspace.name}</strong>
                  <span className={`workspace-status ${isArchived ? 'archived' : 'active'}`}>
                    {isLocked ? <Lock size={11} /> : null}
                    {isArchived ? 'Archived' : 'Active'}
                  </span>
                </div>

                <p className="workspace-gallery-meta">
                  Last activity: {formatLastActivity(workspace)} · {getMemberCount(workspace)} members
                </p>
                {workspace.clientName && (
                  <p className="workspace-gallery-submeta">Client: {workspace.clientName}</p>
                )}

                <div className="workspace-gallery-actions" onClick={(event) => event.stopPropagation()}>
                  <button type="button" className="primary-btn workspace-open-btn" onClick={() => onOpenWorkspace?.(workspace)}>
                    Open
                  </button>
                  {canManage && (
                    <>
                    <button type="button" className="secondary-btn" onClick={() => onOpenTeam?.(workspace)}>
                      <Users size={14} /> Manage Team
                    </button>
                    <button type="button" className="secondary-btn" onClick={() => onOpenSettings?.(workspace)}>
                      <Settings2 size={14} /> Settings
                    </button>
                    <button type="button" className="secondary-btn workspace-delete-btn" onClick={() => onDeleteWorkspace?.(workspace)}>
                      <Trash2 size={14} /> Delete
                    </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default WorkspaceGrid;
