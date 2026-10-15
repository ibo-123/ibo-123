import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';

interface AuditLogItem {
  id: string;
  action: string;
  target: string;
  actor: string;
  timestamp: string;
}

export default function AdminAuditLogs() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/admin/audit-logs', true);

      const items: any[] = res?.data?.items || res?.data?.logs || res?.data?.auditLogs || res?.items || [];

      if (Array.isArray(items) && items.length > 0) {
        const fetched: AuditLogItem[] = items.map((item, index) => {
          const rawTime = item.created_at || item.timestamp;
          const formattedTime = rawTime
            ? new Date(rawTime as string).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Recent';

          return {
            id: item.id ? `LOG-${item.id.slice(0, 6)}` : `LOG-00${index + 1}`,
            action: (item.action as string) || (item.event as string) || (item.action_type as string) || 'System Activity',
            target: (item.target as string) || (item.entity_name as string) || (item.resource_type as string) || 'System',
            actor: (item.actor_email as string) || (item.actor as string) || (item.user_name as string) || 'System Admin',
            timestamp: formattedTime,
          };
        });
        setLogs(fetched);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <AdminLayout>
      <div style={{ padding: '1rem 1.25rem' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>System Audit Logs & Security History</h1>
            <div style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.25rem' }}>{formattedDate}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#C8933A',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
              }}
            >
              AD
            </div>
          </div>
        </div>

        {/* Audit Logs Card Container */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.85rem',
            padding: '1.75rem 2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Recorded System Events ({logs.length})
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
              No security or administrative activity recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {logs.map((log, index) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.1rem 0.5rem',
                    borderBottom: index < logs.length - 1 ? '1px solid #F1F5F9' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '0.65rem',
                        backgroundColor: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        flexShrink: 0,
                      }}
                    >
                      📋
                    </div>

                    <div>
                      <span style={{ fontSize: '0.925rem', fontWeight: 700, color: '#1E293B' }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: '0.925rem', color: '#64748B', margin: '0 0.4rem' }}>
                        →
                      </span>
                      <span style={{ fontSize: '0.925rem', fontWeight: 500, color: '#475569' }}>
                        {log.target}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>
                      {log.actor}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                      {log.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
