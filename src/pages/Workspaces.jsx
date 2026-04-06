import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  Lock,
  RotateCcw,
  Plus,
  Settings2,
  Users,
  X,
  Mail,
  UserPlus,
  Shield,
  UserMinus,
} from 'lucide-react';
import api from '../config/api';
import { logout } from '../features/auth/authSlice';
import { setCurrentWorkspace } from '../features/workspace/workspaceSlice';
import { useDispatch } from 'react-redux';
import WorkspaceGrid from '../components/WorkspaceGrid';
import './Workspaces.css';

const initialForm = {
  name: '',
  description: '',
  clientName: '',
};

const normalizeWorkspaceRole = (role) => {
  const normalized = String(role || '').trim().toLowerCase();

  if (['admin', 'enterprise admin'].includes(normalized)) {
    return 'Enterprise Admin';
  }

  if (['manager', 'workspace manager'].includes(normalized)) {
    return 'Workspace Manager';
  }

  if (['member', 'contributor'].includes(normalized)) {
    return 'Contributor';
  }

  if (['guest', 'client'].includes(normalized)) {
    return 'Guest';
  }

  return role || 'Guest';
};

const Workspaces = () => {
  const { user, token } = useSelector((state) => state.auth);
  const { inbox } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [terminology, setTerminology] = useState({ workspaceLabel: 'Workspaces' });
  const [form, setForm] = useState(initialForm);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [internalSearch, setInternalSearch] = useState('');
  const [internalCandidates, setInternalCandidates] = useState([]);
  const [createSearch, setCreateSearch] = useState('');
  const [createCandidates, setCreateCandidates] = useState([]);
  const [initialMembers, setInitialMembers] = useState([]);
  const [guestEmail, setGuestEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Contributor');
  const [workspaceSnapshot, setWorkspaceSnapshot] = useState([]);

  useEffect(() => {
    if (!token) return undefined;

    const socketBaseUrl = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '').replace(/\/api\/v1\/?$/, '');
    const socket = io(socketBaseUrl || window.location.origin, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      socket.emit('authenticate', { token });
    });

    socket.on('workspace:deleted', ({ workspaceId }) => {
      setRefreshSignal((value) => value + 1);

      if (workspaceId && selectedWorkspace?._id && String(workspaceId) === String(selectedWorkspace._id)) {
        setSelectedWorkspace(null);
        setShowSettingsModal(false);
        setShowTeamModal(false);
        dispatch(setCurrentWorkspace(null));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, selectedWorkspace?._id, dispatch]);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const loadData = async () => {
    try {
      setTerminology({ workspaceLabel: 'Workspaces' });
    } catch (error) {
      if (error?.response?.status === 401) {
        dispatch(logout());
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  const normalizedRole = normalizeWorkspaceRole(user?.role);
  const canManage = ['Enterprise Admin', 'Workspace Manager'].includes(normalizedRole);
  const canCreateWorkspace = Boolean(user?.tenantId);

  const workspaceLabel = terminology.workspaceLabel || 'Workspaces';
  const singularWorkspaceLabel = workspaceLabel.endsWith('s') ? workspaceLabel.slice(0, -1) : workspaceLabel;

  const workspaceStats = useMemo(() => {
    const activeCount = workspaceSnapshot.filter((workspace) => workspace.status !== 'archived').length;
    const archivedCount = workspaceSnapshot.length - activeCount;
    const memberSet = new Set();

    workspaceSnapshot.forEach((workspace) => {
      const members = workspace.members || [];
      const guests = workspace.guests || [];
      members.forEach((entry) => memberSet.add(String(entry.user?._id || entry.user || '')));
      guests.forEach((entry) => memberSet.add(String(entry.user?._id || entry.user || '')));
      memberSet.add(String(workspace.manager?._id || workspace.manager || ''));
    });

    if (memberSet.has('')) memberSet.delete('');

    return {
      total: workspaceSnapshot.length,
      active: activeCount,
      archived: archivedCount,
      uniqueMembers: memberSet.size,
    };
  }, [workspaceSnapshot]);

  const openTeamModal = async (workspace) => {
    setSelectedWorkspace(workspace);
    setShowTeamModal(true);
    await loadWorkspaceMembers(workspace._id);
  };

  const openSettingsModal = (workspace) => {
    setSelectedWorkspace(workspace);
    setShowSettingsModal(true);
  };

  const loadWorkspaceMembers = async (workspaceId) => {
    setTeamLoading(true);
    try {
      const response = await axios.get(api.endpoints.workspaces.members(workspaceId), authHeaders);
      setWorkspaceMembers(response.data?.data?.members || []);
    } catch (error) {
      if (error?.response?.status === 401) {
        dispatch(logout());
        navigate('/login');
      }
      setWorkspaceMembers([]);
    } finally {
      setTeamLoading(false);
    }
  };

  const searchInternalUsers = async (query) => {
    setInternalSearch(query);
    if (!query.trim()) {
      setInternalCandidates([]);
      return;
    }

    try {
      const response = await axios.get(`${api.endpoints.users.profile().replace('/profile', '/search')}?q=${encodeURIComponent(query)}`, authHeaders);
      setInternalCandidates(response.data?.data?.users || []);
    } catch (error) {
      setInternalCandidates([]);
    }
  };

  const searchCreateMembers = async (query) => {
    setCreateSearch(query);
    if (!query.trim()) {
      setCreateCandidates([]);
      return;
    }

    try {
      const response = await axios.get(`${api.endpoints.users.profile().replace('/profile', '/search')}?q=${encodeURIComponent(query)}`, authHeaders);
      const users = response.data?.data?.users || [];
      setCreateCandidates(users.filter((candidate) => !initialMembers.some((member) => member._id === candidate._id)));
    } catch (error) {
      setCreateCandidates([]);
    }
  };

  const addInitialMember = (candidate) => {
    if (!candidate?._id || initialMembers.some((member) => member._id === candidate._id)) return;
    setInitialMembers((prev) => [...prev, candidate]);
    setCreateCandidates((prev) => prev.filter((entry) => entry._id !== candidate._id));
    setCreateSearch('');
  };

  const removeInitialMember = (memberId) => {
    setInitialMembers((prev) => prev.filter((entry) => entry._id !== memberId));
  };

  const createWorkspace = async () => {
    await axios.post(api.endpoints.workspaces.create(), {
      ...form,
      memberIds: initialMembers.map((member) => member._id),
    }, authHeaders);
    setForm(initialForm);
    setInitialMembers([]);
    setCreateSearch('');
    setCreateCandidates([]);
    setShowCreateModal(false);
    setRefreshSignal((value) => value + 1);
  };

  const addInternalMember = async (candidate) => {
    if (!selectedWorkspace) return;
    await axios.post(
      api.endpoints.workspaces.addInternalMember(selectedWorkspace._id),
      { userId: candidate._id, role: inviteRole },
      authHeaders,
    );
    await loadWorkspaceMembers(selectedWorkspace._id);
    setRefreshSignal((value) => value + 1);
    setInternalSearch('');
    setInternalCandidates([]);
  };

  const addGuestMember = async () => {
    if (!selectedWorkspace || !guestEmail.trim()) return;

    try {
      await axios.post(
        api.endpoints.workspaces.addGuestMember(selectedWorkspace._id),
        { email: guestEmail.trim(), role: inviteRole === 'Contributor' ? 'Guest' : inviteRole },
        authHeaders,
      );
      setGuestEmail('');
      await loadWorkspaceMembers(selectedWorkspace._id);
      setRefreshSignal((value) => value + 1);
    } catch (error) {
      if (error?.response?.status === 401) {
        dispatch(logout());
        navigate('/login');
        return;
      }

      alert(error?.response?.data?.message || 'Failed to invite guest.');
    }
  };

  const updateMemberRole = async (memberId, role) => {
    if (!selectedWorkspace) return;
    await axios.patch(api.endpoints.workspaces.updateMember(selectedWorkspace._id, memberId), { role }, authHeaders);
    await loadWorkspaceMembers(selectedWorkspace._id);
    setRefreshSignal((value) => value + 1);
  };

  const removeMember = async (memberId) => {
    if (!selectedWorkspace) return;
    await axios.delete(api.endpoints.workspaces.removeMember(selectedWorkspace._id, memberId), authHeaders);
    await loadWorkspaceMembers(selectedWorkspace._id);
    setRefreshSignal((value) => value + 1);
  };

  const toggleArchive = async (workspace) => {
    await axios.post(api.endpoints.workspaces.archive(workspace._id), {}, authHeaders);
    setRefreshSignal((value) => value + 1);
    if (selectedWorkspace?._id === workspace._id) {
      const response = await axios.get(api.endpoints.workspaces.byId(workspace._id), authHeaders);
      setSelectedWorkspace(response.data?.data?.workspace || workspace);
    }
  };

  const toggleRework = async (workspace) => {
    await axios.post(api.endpoints.workspaces.rework(workspace._id), {}, authHeaders);
    setRefreshSignal((value) => value + 1);
    if (selectedWorkspace?._id === workspace._id) {
      const response = await axios.get(api.endpoints.workspaces.byId(workspace._id), authHeaders);
      setSelectedWorkspace(response.data?.data?.workspace || workspace);
    }
  };

  const handleDeleteWorkspace = async (workspace) => {
    if (!workspace?._id) return;
    const ok = window.confirm(`Delete workspace "${workspace.name}"? This will remove workspace access and move related documents to deleted state.`);
    if (!ok) return;

    try {
      await axios.delete(api.endpoints.workspaces.delete(workspace._id), authHeaders);
      if (selectedWorkspace?._id === workspace._id) {
        setSelectedWorkspace(null);
        setShowSettingsModal(false);
        setShowTeamModal(false);
      }
      dispatch(setCurrentWorkspace(null));
      setRefreshSignal((value) => value + 1);
    } catch (error) {
      if (error?.response?.status === 401) {
        dispatch(logout());
        navigate('/login');
        return;
      }
      alert(error?.response?.data?.message || 'Failed to delete workspace');
    }
  };

  useEffect(() => {
    const relevant = inbox.find((notification) =>
      ['workspace_archived', 'workspace_reopened', 'workspace_assigned'].includes(notification.type)
      && notification.relatedWorkspace,
    );

    if (relevant) {
      setRefreshSignal((value) => value + 1);
    }
  }, [inbox]);

  return (
    <div className="workspaces-page">
      <div className="workspaces-hero">
        <div className="workspaces-hero-left">
          <p className="eyebrow">Collaboration</p>
          <h1>{workspaceLabel}</h1>
          <p>
            Organize work into secure {workspaceLabel.toLowerCase()} with live collaboration, controlled access,
            and archive/rework lifecycle management.
          </p>
          <div className="workspaces-kpis" role="list" aria-label="Workspace summary metrics">
            <div className="workspace-kpi-card" role="listitem">
              <span>Total</span>
              <strong>{workspaceStats.total}</strong>
            </div>
            <div className="workspace-kpi-card" role="listitem">
              <span>Active</span>
              <strong>{workspaceStats.active}</strong>
            </div>
            <div className="workspace-kpi-card" role="listitem">
              <span>Archived</span>
              <strong>{workspaceStats.archived}</strong>
            </div>
            <div className="workspace-kpi-card" role="listitem">
              <span>Members</span>
              <strong>{workspaceStats.uniqueMembers}</strong>
            </div>
          </div>
        </div>
        {canCreateWorkspace && (
          <button className="primary-btn workspaces-hero-cta" type="button" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            New {singularWorkspaceLabel || 'Workspace'}
          </button>
        )}
      </div>

      <WorkspaceGrid
        token={token}
        workspaceLabel={workspaceLabel}
        canManage={canManage}
        canCreate={canCreateWorkspace}
        refreshSignal={refreshSignal}
        onCreate={() => setShowCreateModal(true)}
        onOpenWorkspace={(workspace) => {
          dispatch(setCurrentWorkspace(workspace));
          navigate(`/documents?workspaceId=${workspace._id}`);
        }}
        onOpenTeam={openTeamModal}
        onOpenSettings={openSettingsModal}
        onDeleteWorkspace={handleDeleteWorkspace}
        onDataLoaded={setWorkspaceSnapshot}
        onUnauthorized={() => {
          dispatch(logout());
          navigate('/login');
        }}
      />

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="workspace-modal" onClick={(event) => event.stopPropagation()}>
            <div className="workspace-modal-header">
              <h3>Create {workspaceLabel.slice(0, -1) || 'Workspace'}</h3>
              <button type="button" className="close-btn" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
            </div>
            <div className="workspace-modal-body">
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Workspace name" />
              <input value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} placeholder="Client / account" />
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" rows="4" />

              <div className="workspace-inline-block">
                <h4><Users size={16} /> Invite Initial Members</h4>
                <input
                  value={createSearch}
                  onChange={(event) => searchCreateMembers(event.target.value)}
                  placeholder="Search tenant users to add"
                />
                <div className="candidate-list">
                  {createCandidates.map((candidate) => (
                    <button key={candidate._id} type="button" className="candidate-row" onClick={() => addInitialMember(candidate)}>
                      <span>{candidate.firstName} {candidate.lastName}</span>
                      <small>{candidate.email}</small>
                    </button>
                  ))}
                </div>

                {initialMembers.length > 0 && (
                  <div className="selected-initial-members">
                    {initialMembers.map((member) => (
                      <button key={member._id} type="button" className="selected-member-pill" onClick={() => removeInitialMember(member._id)}>
                        {member.firstName} {member.lastName} <X size={12} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="workspace-modal-footer">
              <button className="secondary-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="primary-btn" onClick={createWorkspace} disabled={!form.name.trim()}>
                Create {singularWorkspaceLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTeamModal && selectedWorkspace && (
        <div className="modal-overlay" onClick={() => setShowTeamModal(false)}>
          <div className="workspace-modal workspace-modal-wide" onClick={(event) => event.stopPropagation()}>
            <div className="workspace-modal-header">
              <h3><Users size={18} /> Manage Team · {selectedWorkspace.name}</h3>
              <button type="button" className="close-btn" onClick={() => setShowTeamModal(false)}><X size={18} /></button>
            </div>
            <div className="workspace-modal-body team-modal-body">
              <section className="workspace-card">
                <h4><UserPlus size={16} /> Invite Internal</h4>
                <input
                  value={internalSearch}
                  onChange={(event) => searchInternalUsers(event.target.value)}
                  placeholder="Search users in your tenant"
                />
                <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}>
                  <option value="Contributor">Contributor</option>
                  <option value="Guest">Guest</option>
                </select>
                <div className="candidate-list">
                  {internalCandidates.map((candidate) => (
                    <button key={candidate._id} type="button" className="candidate-row" onClick={() => addInternalMember(candidate)}>
                      <span>{candidate.firstName} {candidate.lastName}</span>
                      <small>{candidate.email}</small>
                    </button>
                  ))}
                </div>
              </section>

              <section className="workspace-card">
                <h4><Mail size={16} /> Invite External Guest</h4>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(event) => setGuestEmail(event.target.value)}
                  placeholder="guest@example.com"
                />
                <button className="primary-btn" onClick={addGuestMember} disabled={!guestEmail.trim()}>
                  Send Invite
                </button>
              </section>

              <section className="workspace-card team-list-card">
                <h4><Shield size={16} /> Members & Guests</h4>
                {teamLoading ? (
                  <p>Loading team...</p>
                ) : workspaceMembers.length === 0 ? (
                  <p>No members found.</p>
                ) : (
                  <div className="workspace-list">
                    {workspaceMembers.map((member) => {
                      const isManager = member.role === 'Workspace Manager';
                      return (
                        <article key={member._id} className="workspace-row">
                          <div>
                            <strong>{member.user?.firstName} {member.user?.lastName}</strong>
                            <p>{member.user?.email}</p>
                            <small>{member.role}</small>
                          </div>
                          <div className="workspace-actions">
                            {!isManager && (
                              <>
                                <select
                                  value={member.role === 'Guest' ? 'Guest' : 'Contributor'}
                                  onChange={(event) => updateMemberRole(member._id, event.target.value)}
                                >
                                  <option value="Contributor">Contributor</option>
                                  <option value="Guest">Guest</option>
                                </select>
                                <button className="secondary-btn" onClick={() => removeMember(member._id)}>
                                  <UserMinus size={15} /> Remove
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
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && selectedWorkspace && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="workspace-modal" onClick={(event) => event.stopPropagation()}>
            <div className="workspace-modal-header">
              <h3><Settings2 size={18} /> Workspace Settings</h3>
              <button type="button" className="close-btn" onClick={() => setShowSettingsModal(false)}><X size={18} /></button>
            </div>
            <div className="workspace-modal-body">
              <div className={`lifecycle-lock ${selectedWorkspace.status === 'archived' && !selectedWorkspace.reworkEnabled ? 'locked' : ''}`}>
                <p>
                  <strong>Status:</strong> {selectedWorkspace.status === 'archived' ? 'Archived' : 'Active'}
                  {selectedWorkspace.reworkEnabled ? ' · Rework enabled' : ''}
                </p>
                <small>
                  {selectedWorkspace.status === 'archived' && !selectedWorkspace.reworkEnabled
                    ? 'This project is locked. Editing actions should remain disabled.'
                    : 'Project is available for collaboration.'}
                </small>
              </div>
            </div>
            <div className="workspace-modal-footer">
              <button className="secondary-btn" onClick={() => toggleArchive(selectedWorkspace)}>
                <Lock size={15} /> Archive Project
              </button>
              <button className="secondary-btn" onClick={() => toggleRework(selectedWorkspace)}>
                <RotateCcw size={15} /> {selectedWorkspace.reworkEnabled ? 'Disable Rework' : 'Allow Rework'}
              </button>
              <button className="secondary-btn workspace-delete-btn" onClick={() => handleDeleteWorkspace(selectedWorkspace)}>
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspaces;