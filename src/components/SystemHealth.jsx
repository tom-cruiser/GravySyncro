import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { 
  Activity, 
  Database, 
  HardDrive, 
  Cpu, 
  Server,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import './SystemHealth.css';

const SystemHealth = () => {
  const { token } = useSelector((state) => state.auth);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchHealth();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchHealth = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/system/health`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setHealth(response.data.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching health:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return <CheckCircle className="status-icon status-healthy" size={20} />;
      case 'degraded':
      case 'not_configured':
        return <AlertCircle className="status-icon status-warning" size={20} />;
      case 'error':
      case 'disconnected':
        return <XCircle className="status-icon status-error" size={20} />;
      default:
        return <AlertCircle className="status-icon status-unknown" size={20} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return 'status-healthy';
      case 'degraded':
      case 'not_configured':
        return 'status-warning';
      case 'error':
      case 'disconnected':
        return 'status-error';
      default:
        return 'status-unknown';
    }
  };

  if (loading) {
    return (
      <div className="system-health">
        <div className="health-header">
          <div className="health-title">
            <Activity size={24} />
            <h2>System Health Monitor</h2>
          </div>
        </div>
        <div className="health-skeleton">
          <div className="skeleton-card"></div>
          <div className="skeleton-services">
            <div className="skeleton-service"></div>
            <div className="skeleton-service"></div>
          </div>
          <div className="skeleton-resources">
            <div className="skeleton-resource"></div>
            <div className="skeleton-resource"></div>
            <div className="skeleton-resource"></div>
            <div className="skeleton-resource"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!health) {
    return <div className="health-error">Failed to load system health</div>;
  }

  return (
    <div className="system-health">
      <div className="health-header">
        <div className="health-title">
          <Activity size={24} />
          <h2>System Health Monitor</h2>
        </div>
        <div className="health-actions">
          <label className="auto-refresh">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (30s)
          </label>
          <button onClick={fetchHealth} className="btn-refresh">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div className="last-updated">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Overall Status */}
      <div className={`health-card overall-status ${getStatusClass(health.overallStatus)}`}>
        {getStatusIcon(health.overallStatus)}
        <div>
          <h3>Overall System Status</h3>
          <p className="status-text">{health.overallStatus.toUpperCase()}</p>
        </div>
      </div>

      {/* Services Status */}
      <div className="health-section">
        <h3><Server size={20} /> Services</h3>
        
        <div className="services-grid">
          {/* MongoDB */}
          <div className="service-card">
            <div className="service-header">
              <Database size={24} />
              <div>
                <h4>MongoDB</h4>
                <span className={`service-status ${getStatusClass(health.services.database.status)}`}>
                  {getStatusIcon(health.services.database.status)}
                  {health.services.database.status}
                </span>
              </div>
            </div>
            <div className="service-details">
              {health.services.database.status === 'connected' && (
                <>
                  <div className="detail-row">
                    <span>Host:</span>
                    <span>{health.services.database.host}</span>
                  </div>
                  <div className="detail-row">
                    <span>Database:</span>
                    <span>{health.services.database.database}</span>
                  </div>
                  <div className="detail-row">
                    <span>Collections:</span>
                    <span>{health.services.database.collections}</span>
                  </div>
                  <div className="detail-row">
                    <span>Response Time:</span>
                    <span>{health.services.database.responseTime}ms</span>
                  </div>
                </>
              )}
              {health.services.database.error && (
                <div className="error-message">
                  {health.services.database.error}
                </div>
              )}
            </div>
          </div>

          {/* Wasabi S3 */}
          <div className="service-card">
            <div className="service-header">
              <HardDrive size={24} />
              <div>
                <h4>Wasabi Storage</h4>
                <span className={`service-status ${getStatusClass(health.services.storage.status)}`}>
                  {getStatusIcon(health.services.storage.status)}
                  {health.services.storage.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="service-details">
              {health.services.storage.status === 'connected' && (
                <>
                  <div className="detail-row">
                    <span>Bucket:</span>
                    <span>{health.services.storage.bucket}</span>
                  </div>
                  <div className="detail-row">
                    <span>Region:</span>
                    <span>{health.services.storage.region}</span>
                  </div>
                  <div className="detail-row">
                    <span>Response Time:</span>
                    <span>{health.services.storage.responseTime}ms</span>
                  </div>
                </>
              )}
              {health.services.storage.status === 'not_configured' && (
                <div className="warning-message">
                  Storage not configured. Set WASABI_* environment variables.
                </div>
              )}
              {health.services.storage.error && (
                <div className="error-message">
                  {health.services.storage.error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Resources */}
      <div className="health-section">
        <h3><Cpu size={20} /> System Resources</h3>
        
        <div className="resources-grid">
          {/* CPU */}
          <div className="resource-card">
            <h4><Cpu size={18} /> CPU</h4>
            <div className="resource-details">
              <div className="detail-row">
                <span>Cores:</span>
                <span>{health.system.cpu.cores}</span>
              </div>
              <div className="detail-row">
                <span>Load Average:</span>
                <span>
                  {health.system.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}
                </span>
              </div>
            </div>
          </div>

          {/* Memory */}
          <div className="resource-card">
            <h4><Server size={18} /> Memory</h4>
            <div className="resource-details">
              <div className="detail-row">
                <span>Total:</span>
                <span>{formatBytes(health.system.memory.total)}</span>
              </div>
              <div className="detail-row">
                <span>Used:</span>
                <span>{formatBytes(health.system.memory.used)}</span>
              </div>
              <div className="detail-row">
                <span>Free:</span>
                <span>{formatBytes(health.system.memory.free)}</span>
              </div>
              <div className="memory-bar">
                <div 
                  className="memory-fill"
                  style={{ width: `${health.system.memory.usagePercentage}%` }}
                />
              </div>
              <div className="memory-percentage">
                {health.system.memory.usagePercentage}% used
              </div>
            </div>
          </div>

          {/* Process Memory */}
          <div className="resource-card">
            <h4><Activity size={18} /> Process Memory</h4>
            <div className="resource-details">
              <div className="detail-row">
                <span>Heap Used:</span>
                <span>{formatBytes(health.system.memory.process.heapUsed)}</span>
              </div>
              <div className="detail-row">
                <span>Heap Total:</span>
                <span>{formatBytes(health.system.memory.process.heapTotal)}</span>
              </div>
              <div className="detail-row">
                <span>RSS:</span>
                <span>{formatBytes(health.system.memory.process.rss)}</span>
              </div>
            </div>
          </div>

          {/* Uptime */}
          <div className="resource-card">
            <h4><Activity size={18} /> Uptime</h4>
            <div className="resource-details">
              <div className="detail-row">
                <span>System:</span>
                <span>{formatUptime(health.system.uptime.system)}</span>
              </div>
              <div className="detail-row">
                <span>Process:</span>
                <span>{formatUptime(health.system.uptime.process)}</span>
              </div>
              <div className="detail-row">
                <span>Platform:</span>
                <span>{health.system.platform}</span>
              </div>
              <div className="detail-row">
                <span>Node Version:</span>
                <span>{health.system.nodeVersion}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
