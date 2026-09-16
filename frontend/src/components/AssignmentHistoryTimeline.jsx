import React from 'react';
import { 
  UserCheck, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Calendar,
  ArrowRight,
  Shield,
  Briefcase,
  Layers
} from 'lucide-react';
import './AssignmentHistoryTimeline.css';

const getActionConfig = (actionType) => {
  switch (actionType) {
    case 'Initial Assignment':
      return {
        label: 'Initial Assignment',
        icon: UserCheck,
        color: '#0284c7',
        bgColor: '#f0f9ff',
        borderColor: '#bae6fd'
      };
    case 'Reassignment Requested':
      return {
        label: 'Reassignment Requested',
        icon: RotateCcw,
        color: '#d97706',
        bgColor: '#fffbeb',
        borderColor: '#fde68a'
      };
    case 'Reassignment Approved':
      return {
        label: 'Reassignment Approved by Admin',
        icon: CheckCircle2,
        color: '#16a34a',
        bgColor: '#f0fdf4',
        borderColor: '#bbf7d0'
      };
    case 'Reassignment Rejected':
      return {
        label: 'Reassignment Rejected',
        icon: XCircle,
        color: '#dc2626',
        bgColor: '#fef2f2',
        borderColor: '#fecaca'
      };
    case 'Direct Reassignment':
      return {
        label: 'Direct Reassignment by Admin',
        icon: RotateCcw,
        color: '#7c3aed',
        bgColor: '#faf5ff',
        borderColor: '#ddd6fe'
      };
    case 'Escalated':
      return {
        label: 'Task Escalated',
        icon: AlertTriangle,
        color: '#ea580c',
        bgColor: '#fff7ed',
        borderColor: '#fed7aa'
      };
    default:
      return {
        label: actionType || 'Task Updated',
        icon: Clock,
        color: '#475569',
        bgColor: '#f8fafc',
        borderColor: '#e2e8f0'
      };
  }
};

export default function AssignmentHistoryTimeline({ history = [], currentAssignee, currentRole, initialAssignedDate }) {
  // If no explicit history array yet, synthesize initial entry from current task
  let displayList = Array.isArray(history) && history.length > 0 ? [...history] : [];

  if (displayList.length === 0 && currentAssignee) {
    displayList.push({
      historyId: 'initial-1',
      assignedToName: typeof currentAssignee === 'string' ? currentAssignee : currentAssignee.name || 'Assigned User',
      assignedToRole: currentRole || 'contractor',
      assignedBy: 'Administrator',
      assignedAt: initialAssignedDate || new Date(),
      actionType: 'Initial Assignment',
      reason: 'Task assigned by Admin upon ticket triage'
    });
  }

  // Sort descending by timestamp (newest on top) or ascending (chronological)
  const chronological = [...displayList].reverse();

  return (
    <div className="reassignment-history-widget">
      <div className="history-widget-header">
        <div className="history-header-left">
          <Layers size={18} className="text-emerald" />
          <h4>Assignment & Reassignment Audit Trail</h4>
        </div>
        <span className="history-count-badge">{displayList.length} Event{displayList.length > 1 ? 's' : ''}</span>
      </div>

      {displayList.length === 0 ? (
        <div className="history-empty-state">
          <Clock size={24} color="#94a3b8" />
          <p>No reassignment events recorded yet. Task is on its initial assignment.</p>
        </div>
      ) : (
        <div className="history-timeline-track">
          {chronological.map((item, idx) => {
            const config = getActionConfig(item.actionType);
            const Icon = config.icon;
            const eventDate = item.assignedAt || item.reviewedAt ? new Date(item.assignedAt || item.reviewedAt).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            }) : 'Date not recorded';

            const isContractor = ['contractor', 'Contractor'].includes(item.assignedToRole || item.previousAssigneeRole);

            return (
              <div key={item.historyId || idx} className="timeline-event-item">
                <div className="timeline-node-pin" style={{ backgroundColor: config.bgColor, borderColor: config.borderColor, color: config.color }}>
                  <Icon size={16} />
                </div>

                <div className="timeline-event-card" style={{ borderLeftColor: config.color }}>
                  <div className="timeline-card-head">
                    <div className="action-type-pill" style={{ backgroundColor: config.bgColor, color: config.color, borderColor: config.borderColor }}>
                      <span>{config.label}</span>
                    </div>
                    <span className="timeline-timestamp">
                      <Clock size={12} /> {eventDate}
                    </span>
                  </div>

                  {/* Assignee / Parties Involved */}
                  <div className="timeline-parties-box">
                    {item.previousAssigneeName && (
                      <div className="party-from">
                        <span className="party-label">From:</span>
                        <span className="party-name">{item.previousAssigneeName}</span>
                        <span className="role-tag">{item.previousAssigneeRole === 'contractor' ? 'Contractor' : 'Govt Official'}</span>
                      </div>
                    )}

                    {item.previousAssigneeName && item.assignedToName && (
                      <ArrowRight size={14} className="party-arrow" />
                    )}

                    {item.assignedToName && (
                      <div className="party-to">
                        <span className="party-label">{item.previousAssigneeName ? 'Reassigned To:' : 'Assigned To:'}</span>
                        <span className="party-name">{item.assignedToName}</span>
                        <span className="role-tag role-active">{isContractor ? 'Contractor' : 'Govt Official'}</span>
                      </div>
                    )}
                  </div>

                  {/* Reason & Explanation */}
                  {item.reason && (
                    <div className="timeline-detail-row">
                      <span className="detail-label">Reason:</span>
                      <span className="detail-value reason-highlight">{item.reason}</span>
                    </div>
                  )}

                  {item.explanation && (
                    <div className="timeline-detail-row">
                      <span className="detail-label">Explanation / Notes:</span>
                      <span className="detail-value">{item.explanation}</span>
                    </div>
                  )}

                  {/* Deadline Changes */}
                  {item.newDeadline && (
                    <div className="timeline-deadline-alert">
                      <Calendar size={13} />
                      <span>
                        Deadline Adjusted: <strong>{new Date(item.newDeadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                        {item.deadlineChangeReason && ` (${item.deadlineChangeReason})`}
                      </span>
                    </div>
                  )}

                  <div className="timeline-actor-footer">
                    <span>Handled By: <strong>{item.assignedBy || item.reviewedBy || 'System Administrator'}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
