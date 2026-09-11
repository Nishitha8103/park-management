import { useState, useEffect } from 'react';
import { CheckSquare, Plus, Clock, CheckCircle2, AlertCircle, Calendar, MapPin, Tag } from 'lucide-react';

const FloraTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [parks, setParks] = useState([]);
  const [floraList, setFloraList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal State for New Task
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    park: '',
    flora: '',
    taskType: 'Watering',
    priority: 'Medium',
    dueDate: new Date().toISOString().split('T')[0],
    instructions: ''
  });

  // Modal State for Complete Task
  const [completingTask, setCompletingTask] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');

  const [msg, setMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const getAuthToken = () => {
    try {
      const plantingUser = JSON.parse(localStorage.getItem('plantingUser') || '{}');
      if (plantingUser?.token) return plantingUser.token;
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user?.token) return user.token;
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      if (adminUser?.token) return adminUser.token;
    } catch (e) {}
    return localStorage.getItem('token') || '';
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const [tasksRes, parksRes, floraRes] = await Promise.all([
        fetch('/api/flora/tasks/my-tasks', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/parks'),
        fetch('/api/flora', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }
      if (parksRes.ok) {
        const parksData = await parksRes.json();
        setParks(Array.isArray(parksData) ? parksData : parksData.parks || []);
      }
      if (floraRes.ok) {
        const floraData = await floraRes.json();
        setFloraList(floraData);
      }
    } catch (err) {
      console.error("Error loading task data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      const token = getAuthToken();
      const res = await fetch('/api/flora/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskForm)
      });
      const data = await res.json();

      if (res.ok) {
        setMsg({ type: 'success', text: 'Plant maintenance task created successfully!' });
        setShowTaskModal(false);
        fetchInitialData();
      } else {
        setMsg({ type: 'error', text: data.message || 'Failed to create task.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Server error while creating task.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus, notes = '') => {
    setSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/flora/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, completionNotes: notes })
      });

      if (res.ok) {
        setMsg({ type: 'success', text: `Task status updated to ${newStatus}!` });
        setCompletingTask(null);
        fetchInitialData();
      } else {
        const data = await res.json();
        setMsg({ type: 'error', text: data.message || 'Failed to update task.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Server error updating task status.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter(t => filterStatus === 'ALL' || t.status === filterStatus);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckSquare color="#059669" size={32} />
            Plant Maintenance Tasks
          </h1>
          <p style={{ color: '#4b5563', marginTop: '0.25rem' }}>
            Schedule and complete routine watering, pruning, fertilizing, and health inspections.
          </p>
        </div>
        <button 
          onClick={() => {
            setTaskForm({
              park: parks.length > 0 ? parks[0]._id : '',
              flora: '',
              taskType: 'Watering',
              priority: 'Medium',
              dueDate: new Date().toISOString().split('T')[0],
              instructions: ''
            });
            setShowTaskModal(true);
          }}
          style={{
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)'
          }}
        >
          <Plus size={20} /> Create New Task
        </button>
      </div>

      {msg.text && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          backgroundColor: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: msg.type === 'success' ? '#166534' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {msg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
        {['ALL', 'Pending', 'In Progress', 'Completed'].map((st) => (
          <button 
            key={st}
            onClick={() => setFilterStatus(st)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              backgroundColor: filterStatus === st ? '#059669' : 'transparent',
              color: filterStatus === st ? 'white' : '#6b7280'
            }}
          >
            {st === 'ALL' ? 'All Tasks' : st}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading maintenance tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <CheckSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No tasks found in this section.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredTasks.map((task) => (
            <div key={task._id} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '6px',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      display: 'inline-block',
                      marginBottom: '0.35rem'
                    }}>
                      {task.taskType}
                    </span>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827' }}>
                      {task.flora ? task.flora.species : 'General Park Flora'}
                    </h3>
                  </div>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600', 
                    padding: '0.25rem 0.6rem', 
                    borderRadius: '9999px',
                    backgroundColor: task.status === 'Completed' ? '#dcfce7' : task.status === 'In Progress' ? '#fef9c3' : '#fee2e2',
                    color: task.status === 'Completed' ? '#15803d' : task.status === 'In Progress' ? '#a16207' : '#b91c1c'
                  }}>
                    {task.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: '0.875rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={15} color="#059669" />
                    <span>{task.park?.name || 'Park'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={15} color="#2563eb" />
                    <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Today'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Tag size={15} color="#7c3aed" />
                    <span>Priority: {task.priority || 'Medium'}</span>
                  </div>
                  {task.instructions && (
                    <div style={{ marginTop: '0.4rem', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '6px', fontSize: '0.8rem', color: '#4b5563' }}>
                      <strong>Instructions:</strong> {task.instructions}
                    </div>
                  )}
                  {task.completionNotes && (
                    <div style={{ marginTop: '0.4rem', padding: '0.5rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.8rem', color: '#166534' }}>
                      <strong>Completion Note:</strong> {task.completionNotes}
                    </div>
                  )}
                </div>
              </div>

              {task.status !== 'Completed' && (
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  {task.status === 'Pending' && (
                    <button 
                      onClick={() => handleUpdateStatus(task._id, 'In Progress')}
                      style={{
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        border: 'none',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Start Task
                    </button>
                  )}
                  <button 
                    onClick={() => setCompletingTask(task)}
                    style={{
                      backgroundColor: '#16a34a',
                      color: 'white',
                      border: 'none',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <CheckCircle2 size={14} /> Mark Completed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Task */}
      {showTaskModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: '#111827' }}>
              Create Maintenance Task
            </h2>
            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Select Park</label>
                <select 
                  required
                  value={taskForm.park}
                  onChange={(e) => setTaskForm({...taskForm, park: e.target.value})}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                >
                  {parks.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Select Flora Item (Optional)</label>
                <select 
                  value={taskForm.flora}
                  onChange={(e) => setTaskForm({...taskForm, flora: e.target.value})}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                >
                  <option value="">General Park Maintenance</option>
                  {floraList.map(f => (
                    <option key={f._id} value={f._id}>{f.species} ({f.locationInPark || 'No location'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Task Type</label>
                  <select 
                    value={taskForm.taskType}
                    onChange={(e) => setTaskForm({...taskForm, taskType: e.target.value})}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  >
                    <option value="Watering">Watering</option>
                    <option value="Pruning">Pruning</option>
                    <option value="Fertilizing">Fertilizing</option>
                    <option value="Weeding">Weeding</option>
                    <option value="Health Check">Health Check</option>
                    <option value="Soil Treatment">Soil Treatment</option>
                    <option value="Re-planting">Re-planting</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Priority</label>
                  <select 
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Due Date</label>
                <input 
                  type="date" required
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Instructions</label>
                <textarea 
                  rows="3"
                  value={taskForm.instructions}
                  onChange={(e) => setTaskForm({...taskForm, instructions: e.target.value})}
                  placeholder="Details for the staff worker..."
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowTaskModal(false)}
                  style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', border: 'none', background: '#059669', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                >
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Complete Task */}
      {completingTask && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '450px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem', color: '#111827' }}>
              Complete Task: {completingTask.taskType}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem' }}>
              Add any optional notes about work done (e.g. 50L water applied, leaves pruned).
            </p>

            <textarea 
              rows="3"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="e.g. Successfully watered all rose beds and checked drip irrigation."
              style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '1.25rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                onClick={() => setCompletingTask(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={submitting}
                onClick={() => handleUpdateStatus(completingTask._id, 'Completed', completionNotes)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#16a34a', color: 'white', fontWeight: '600', cursor: 'pointer' }}
              >
                {submitting ? 'Updating...' : 'Confirm Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloraTasks;
