import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  }, [navigate]);

  return <div style={{ padding: '2rem' }}>Logging out...</div>;
};
export default AdminLogout;
