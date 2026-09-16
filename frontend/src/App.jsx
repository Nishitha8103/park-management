import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomPopupModal from './components/CustomPopupModal';
import InstallPrompt from './components/InstallPrompt';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Parks from './pages/Parks';
import ParkDetails from './pages/ParkDetails';
import ScanQR from './pages/ScanQR';
import SubmitComplaint from './pages/SubmitComplaint';
import TrackComplaint from './pages/TrackComplaint';
import ComplaintHistory from './pages/ComplaintHistory';
import Feedback from './pages/Feedback';
import FeedbackHistory from './pages/FeedbackHistory';
import Profile from './pages/Profile';
import Events from './pages/Events';
import NotificationsPage from './pages/NotificationsPage';
import MyStallBookings from './pages/MyStallBookings';
import MyEventRegistrations from './pages/MyEventRegistrations';
import Announcements from './pages/Announcements';
import AdminLayout from './layouts/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminEvents from './pages/admin/AdminEvents';
import AdminParks from './pages/admin/AdminParks';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminContractors from './pages/admin/AdminContractors';
import AdminContractorsAdd from './pages/admin/AdminContractorsAdd';
import AdminContractorsEdit from './pages/admin/AdminContractorsEdit';
import AdminDistricts from './pages/admin/AdminDistricts';
import AdminCorporations from './pages/admin/AdminCorporations';
import AdminZones from './pages/admin/AdminZones';
import AdminWards from './pages/admin/AdminWards';
import AdminOfficials from './pages/admin/AdminOfficials';
import AdminOfficialsAdd from './pages/admin/AdminOfficialsAdd';
import AdminOfficialsEdit from './pages/admin/AdminOfficialsEdit';

import AdminAssignments from './pages/admin/AdminAssignments';
import AdminInspections from './pages/admin/AdminInspections';
import AdminNotifications from './pages/admin/AdminNotifications';

import AdminSettings from './pages/admin/AdminSettings';
import AdminLogout from './pages/admin/AdminLogout';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminStallBookings from './pages/admin/AdminStallBookings';
import AdminStallPayments from './pages/admin/AdminStallPayments';
import AdminEventPayments from './pages/admin/AdminEventPayments';
import AdminReassignmentRequests from './pages/admin/AdminReassignmentRequests';
import AdminLeaveManagement from './pages/admin/AdminLeaveManagement';
import AdminKycReview from './pages/admin/AdminKycReview';
import ContractorLeaves from './pages/ContractorLeaves';
import GovLeaves from './pages/GovLeaves';

// AdminDashboard component is being replaced by modular components in /pages/admin/
// import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import GovDashboard from './pages/GovDashboard';
import GovLogin from './pages/GovLogin';
import GovRegister from './pages/GovRegister';
import GovMyParks from './pages/GovMyParks';
import GovParkDetails from './pages/GovParkDetails';
import GovMyInspections from './pages/GovMyInspections';
import GovInspectionForm from './pages/GovInspectionForm';
import GovComplaints from './pages/GovComplaints';
import GovInspectionDetails from './pages/GovInspectionDetails';

import GovNotifications from './pages/GovNotifications';
import GovUploadImages from './pages/GovUploadImages';
import GovVerifyWork from './pages/GovVerifyWork';
import GovAnalytics from './pages/GovAnalytics';
import GovProfile from './pages/GovProfile';
import GovLogout from './pages/GovLogout';
import GovWorkSchedule from './pages/GovWorkSchedule';
import ContractorDashboard from './pages/ContractorDashboard';
import ContractorLogin from './pages/ContractorLogin';
import ContractorRegister from './pages/ContractorRegister';
import ContractorTaskDetails from './pages/ContractorTaskDetails';
import ContractorMyTasks from './pages/ContractorMyTasks';
import ContractorWorkProgress from './pages/ContractorWorkProgress';
import ContractorCompletedTasks from './pages/ContractorCompletedTasks';
import ContractorReports from './pages/ContractorReports';
import ContractorReportDetails from './pages/ContractorReportDetails';
import ContractorNotifications from './pages/ContractorNotifications';
import ContractorProfile from './pages/ContractorProfile';
import { useState } from 'react';
import ContractorMapView from './pages/ContractorMapView';
import ContractorSchedule from './pages/ContractorSchedule';
import ContractorMaterialRequests from './pages/ContractorMaterialRequests';
import AdminMaterialRequests from './pages/admin/AdminMaterialRequests';
import MainLayout from './layouts/MainLayout';
import GovLayout from './layouts/GovLayout';
import SplashScreen from './components/SplashScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <Router>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} duration={3000} />}
      <CustomPopupModal />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/gov/login" element={<GovLogin />} />
        <Route path="/gov/register" element={<GovRegister />} />
        <Route path="/contractor/login" element={<ContractorLogin />} />
        <Route path="/contractor/register" element={<ContractorRegister />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        
        {/* Admin Portal Routes */}
        <Route path="/admin-dashboard" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="districts" element={<AdminDistricts />} />
          <Route path="corporations" element={<AdminCorporations />} />
          <Route path="zones" element={<AdminZones />} />
          <Route path="wards" element={<AdminWards />} />
          <Route path="parks" element={<AdminParks />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="contractors" element={<AdminContractors />} />
          <Route path="contractors/add" element={<AdminContractorsAdd />} />
          <Route path="contractors/edit/:id" element={<AdminContractorsEdit />} />
          <Route path="officials" element={<AdminOfficials />} />
          <Route path="officials/add" element={<AdminOfficialsAdd />} />
          <Route path="officials/edit/:id" element={<AdminOfficialsEdit />} />

          <Route path="assignments" element={<AdminAssignments />} />
          <Route path="inspections" element={<AdminInspections />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="stall-bookings" element={<AdminStallBookings />} />
          <Route path="stall-payments" element={<AdminStallPayments />} />
          <Route path="event-registrations" element={<AdminEventPayments />} />
          <Route path="material-requests" element={<AdminMaterialRequests />} />
          <Route path="reassignments" element={<AdminReassignmentRequests />} />
          <Route path="leaves" element={<AdminLeaveManagement />} />
          <Route path="kyc-review" element={<AdminKycReview />} />

          <Route path="settings" element={<AdminSettings />} />
          <Route path="logout" element={<AdminLogout />} />
        </Route>
        <Route path="/contractor-dashboard" element={<ContractorDashboard />} />
        <Route path="/contractor/tasks" element={<ContractorMyTasks />} />
        <Route path="/contractor/task/:id" element={<ContractorTaskDetails />} />
        <Route path="/contractor/progress/:id" element={<ContractorWorkProgress />} />
        <Route path="/contractor/completed" element={<ContractorCompletedTasks />} />
        <Route path="/contractor/reports" element={<ContractorReports />} />
        <Route path="/contractor/reports/:id" element={<ContractorReportDetails />} />
        <Route path="/contractor/notifications" element={<ContractorNotifications />} />
        <Route path="/contractor/profile" element={<ContractorProfile />} />
        <Route path="/contractor/map" element={<Navigate to="/contractor-dashboard" replace />} />
        <Route path="/contractor/schedule" element={<ContractorSchedule />} />
        <Route path="/contractor/materials" element={<ContractorMaterialRequests />} />
        <Route path="/contractor/leaves" element={<ContractorLeaves />} />
        
        {/* Government Portal Routes */}
        <Route path="/gov-dashboard" element={<GovLayout />}>
          <Route index element={<GovDashboard />} />
          <Route path="parks" element={<GovMyParks />} />
          <Route path="parks/:id" element={<GovParkDetails />} />
          <Route path="inspections/:id" element={<GovInspectionDetails />} />
          <Route path="inspections" element={<GovInspectionForm />} />
          <Route path="conduct-inspection/:id" element={<GovInspectionForm />} />
          <Route path="my-inspections" element={<GovMyInspections />} />
          <Route path="schedule" element={<GovWorkSchedule />} />

          <Route path="upload-images" element={<GovUploadImages />} />
          <Route path="complaints" element={<GovComplaints />} />
          <Route path="verify-work" element={<GovVerifyWork />} />
          <Route path="verify-work/:id" element={<GovVerifyWork />} />
          <Route path="notifications" element={<GovNotifications />} />
          <Route path="analytics" element={<GovAnalytics />} />
          <Route path="profile" element={<GovProfile />} />
          <Route path="leaves" element={<GovLeaves />} />
          <Route path="logout" element={<GovLogout />} />
        </Route>

        {/* Routes with Sidebar Layout */}
        <Route element={<MainLayout />}>
          <Route path="/parks" element={<Parks />} />
          <Route path="/parks/:id" element={<ParkDetails />} />
          <Route path="/events" element={<Events />} />
          <Route path="/scan" element={<ScanQR />} />
          <Route path="/complaint" element={<SubmitComplaint />} />
          <Route path="/track-complaint" element={<TrackComplaint />} />
          <Route path="/complaint-history" element={<ComplaintHistory />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/feedback-history" element={<FeedbackHistory />} />
          <Route path="/stall-bookings" element={<MyStallBookings />} />
          <Route path="/my-registrations" element={<MyEventRegistrations />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Routes>
      <InstallPrompt />
    </Router>
  );
}

export default App;
