// frontend/src/utils/slaUtils.js

export const getSlaStatusAndRemaining = (complaint) => {
  if (!complaint || !complaint.slaDeadline) {
    return { status: 'Not Applicable', text: '', color: 'gray', colorCode: '#64748b' };
  }

  const status = complaint.slaStatus || 'On Time';
  
  if (status === 'Resolved Within SLA') {
    return { status, text: 'Resolved within SLA', color: 'green', colorCode: '#10b981', icon: '✅' };
  }
  
  if (status === 'Resolved After SLA') {
    return { status, text: 'Resolved after SLA', color: 'orange', colorCode: '#f59e0b', icon: '⚠️' };
  }
  
  const now = new Date();
  const deadline = new Date(complaint.slaDeadline);
  const diffMs = deadline.getTime() - now.getTime();
  
  // Already passed
  if (diffMs < 0 || status === 'Overdue') {
    const days = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    const hours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    
    let text = 'SLA breached';
    if (days > 0) text = `${days} day(s) overdue`;
    else if (hours > 0) text = `${hours} hour(s) overdue`;
    else text = 'Recently overdue';
    
    return { status: 'Overdue', text, color: 'red', colorCode: '#ef4444', icon: '🔴' };
  }
  
  // Future
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  let text = '';
  if (days > 0) text = `${days} day(s) remaining`;
  else if (hours > 0) text = `${hours} hour(s) remaining`;
  else text = `${minutes} min(s) remaining`;
  
  if (status === 'Due Soon' || hours <= 24) {
    return { status: 'Due Soon', text, color: 'yellow', colorCode: '#eab308', icon: '🟡' };
  }
  
  return { status: 'On Time', text, color: 'green', colorCode: '#10b981', icon: '🟢' };
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Critical': return '#ef4444'; // red
    case 'High': return '#f97316'; // orange
    case 'Medium': return '#eab308'; // yellow
    case 'Low': return '#3b82f6'; // blue
    default: return '#64748b'; // slate
  }
};
