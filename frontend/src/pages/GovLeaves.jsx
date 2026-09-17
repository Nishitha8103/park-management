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
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {official ? (
        <GovLeaveManagement official={official} />
      ) : (
        <div style={{ textAlign: 'center', color: '#5e7263', padding: '4rem 1rem' }}>
          Loading your profile...
        </div>
      )}
    </div>
  );
};

export default GovLeaves;
