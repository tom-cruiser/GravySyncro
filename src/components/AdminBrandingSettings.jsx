import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Image, Type, Save } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../config/api';
import './AdminBrandingSettings.css';

const initialState = {
  workspaceLabel: 'Workspaces',
  projectLabel: 'Projects',
  caseLabel: 'Cases',
  jobLabel: 'Jobs',
  primaryColor: '#667eea',
  secondaryColor: '#334155',
  logo: '',
};

const AdminBrandingSettings = () => {
  const { token } = useSelector((state) => state.auth);
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const loadSettings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let terminology = {};
      let branding = {};

      try {
        const response = await axios.get(api.endpoints.workspaces.branding(), authHeaders);
        terminology = response.data?.data?.terminology || {};
        branding = response.data?.data?.branding || {};
      } catch (error) {
        if (error?.response?.status === 404) {
          const terminologyResponse = await axios.get(api.endpoints.workspaces.terminology(), authHeaders);
          terminology = terminologyResponse.data?.data?.terminology || {};
        } else {
          throw error;
        }
      }

      setForm({
        workspaceLabel: terminology.workspaceLabel || initialState.workspaceLabel,
        projectLabel: terminology.projectLabel || initialState.projectLabel,
        caseLabel: terminology.caseLabel || initialState.caseLabel,
        jobLabel: terminology.jobLabel || initialState.jobLabel,
        primaryColor: branding.primaryColor || initialState.primaryColor,
        secondaryColor: branding.secondaryColor || initialState.secondaryColor,
        logo: branding.logo || '',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [token]);

  const handleLogo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'image/png') {
      alert('Only PNG logos are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, logo: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await axios.patch(api.endpoints.workspaces.branding(), form, authHeaders);
      await loadSettings();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="branding-settings">Loading branding settings...</div>;
  }

  return (
    <div className="branding-settings">
      <h3><Type size={18} /> Tenant Branding & Terminology</h3>
      <p className="branding-subtitle">White-label this tenant by editing labels, colors, and logo.</p>

      <div className="branding-grid">
        <section className="branding-card">
          <h4><Type size={16} /> Terminology</h4>
          <label>
            Workspace Label
            <input
              value={form.workspaceLabel}
              onChange={(event) => setForm((prev) => ({ ...prev, workspaceLabel: event.target.value }))}
              placeholder="Workspace"
            />
          </label>
          <label>
            Project Label
            <input
              value={form.projectLabel}
              onChange={(event) => setForm((prev) => ({ ...prev, projectLabel: event.target.value }))}
              placeholder="Project"
            />
          </label>
          <label>
            Case Label
            <input
              value={form.caseLabel}
              onChange={(event) => setForm((prev) => ({ ...prev, caseLabel: event.target.value }))}
              placeholder="Case"
            />
          </label>
          <label>
            Job Label
            <input
              value={form.jobLabel}
              onChange={(event) => setForm((prev) => ({ ...prev, jobLabel: event.target.value }))}
              placeholder="Job"
            />
          </label>
        </section>

        <section className="branding-card">
          <h4><Image size={16} /> Brand Identity</h4>
          <label>
            Logo (.png)
            <input type="file" accept="image/png" onChange={handleLogo} />
          </label>
          {form.logo && <img src={form.logo} alt="Tenant logo preview" className="branding-logo-preview" />}

          <label>
            Primary Color
            <input
              type="color"
              value={form.primaryColor}
              onChange={(event) => setForm((prev) => ({ ...prev, primaryColor: event.target.value }))}
            />
          </label>

          <label>
            Secondary Color
            <input
              type="color"
              value={form.secondaryColor}
              onChange={(event) => setForm((prev) => ({ ...prev, secondaryColor: event.target.value }))}
            />
          </label>

          <button className="primary-btn" type="button" onClick={saveSettings} disabled={saving}>
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Branding'}
          </button>
        </section>
      </div>
    </div>
  );
};

export default AdminBrandingSettings;
