import { useEffect, useState } from 'react';
import GovLeaveManagement from '../components/GovLeaveManagement';

const GovLeaves = () => {
  const [official, setOfficial] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('govUser');
    if (stored) {
      try {
        setOfficial(JSON.parse(stored));
      } catch {}
    }
  }, []);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.25rem', color: '#0f172a', fontWeight: 700, fontSize: '1.4rem' }}>
        🏛️ Leave &amp; Availability Management
      </h2>
      {official ? (
        <GovLeaveManagement official={official} />
      ) : (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
          Loading your profile...
        </div>
      )}
    </div>
  );
};

export default GovLeaves;
