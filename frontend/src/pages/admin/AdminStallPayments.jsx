import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  CreditCard,
  IndianRupee,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Download,
  Receipt,
  Store,
  FileSpreadsheet,
  Building,
  User,
  Search,
  MapPin,
  ShieldCheck,
  BarChart3,
  X,
  RefreshCw,
  Tag,
  Calendar,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';

const AdminStallPayments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedParam = searchParams.get('sessionKey') || searchParams.get('parkId') || 'All';

  const [bookings, setBookings] = useState([]);
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selection & Filters
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [verificationFilter, setVerificationFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSessionGroups, setCollapsedSessionGroups] = useState({});

  // Modals
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const getAdminToken = () => {
    try {
      const stored = localStorage.getItem('adminUser');
      return stored ? JSON.parse(stored)?.token : null;
    } catch (e) {
      return null;
    }
  };

  const formatLocation = (park) => {
    if (!park) return 'Urban Zone';
    if (typeof park.district === 'object' && park.district?.name) {
      return park.district.name;
    }
    if (typeof park.district === 'string' && park.district.trim()) {
      return park.district;
    }
    if (typeof park.address === 'string' && park.address.trim()) {
      return park.address;
    }
    return 'Urban Zone';
  };

  const formatDisplayDate = (d) => {
    if (!d) return '—';
    const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return '—';
    return dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const fetchBookingsAndParks = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getAdminToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [bookingsRes, parksRes] = await Promise.all([
        axios.get('/api/stall-bookings', { headers }),
        axios.get('/api/parks').catch(() => ({ data: [] }))
      ]);

      const loadedBookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
      
      let loadedParks = [];
      if (Array.isArray(parksRes.data)) {
        loadedParks = parksRes.data;
      } else if (Array.isArray(parksRes.data?.parks)) {
        loadedParks = parksRes.data.parks;
      } else if (Array.isArray(parksRes.data?.data)) {
        loadedParks = parksRes.data.data;
      }

      const parkMap = new Map();
      loadedParks.forEach(p => {
        if (p && p._id) parkMap.set(String(p._id), p);
      });
      loadedBookings.forEach(b => {
        if (b.park && typeof b.park === 'object' && b.park._id) {
          if (!parkMap.has(String(b.park._id))) {
            parkMap.set(String(b.park._id), b.park);
          }
        }
      });

      setBookings(loadedBookings);
      setParks(Array.from(parkMap.values()));
    } catch (err) {
      console.error('Error fetching stall payments:', err);
      setError('Failed to load stall payment records. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsAndParks();
  }, []);

  // Helper to extract Park Name + Booking Date metadata for each stall record
  const getBookingSessionInfo = (b) => {
    const parkObj = typeof b.park === 'object' ? b.park : parks.find(p => String(p._id) === String(b.park)) || {};
    const parkName = (parkObj.name || parkObj.parkName || 'Park').trim();
    const parkId = parkObj._id ? String(parkObj._id) : (typeof b.park === 'string' ? b.park : '');
    const parkCode = parkObj.parkCode || '';
    
    const rawDate = b.bookingDate ? new Date(b.bookingDate) : (b.createdAt ? new Date(b.createdAt) : null);
    const validDate = rawDate && !isNaN(rawDate.getTime()) ? rawDate : null;
    const dateFormatted = validDate ? validDate.toLocaleDateString('en-IN') : 'Date N/A';
    const dateISO = validDate ? `${validDate.getFullYear()}-${String(validDate.getMonth() + 1).padStart(2, '0')}-${String(validDate.getDate()).padStart(2, '0')}` : 'no-date';

    const key = `${parkName.toLowerCase()}___${dateISO}`;
    const label = `${parkName} — ${dateFormatted}`;

    return {
      key,
      label,
      parkName,
      parkId,
      parkCode,
      parkObj,
      dateFormatted,
      validDate
    };
  };

  // Build all distinct Park + Date sessions from bookings
  const allStallSessions = useMemo(() => {
    const sessionsMap = new Map();

    bookings.forEach(b => {
      const info = getBookingSessionInfo(b);
      if (!sessionsMap.has(info.key)) {
        sessionsMap.set(info.key, {
          key: info.key,
          label: info.label,
          parkName: info.parkName,
          parkId: info.parkId,
          parkCode: info.parkCode,
          parkObj: info.parkObj,
          dateFormatted: info.dateFormatted,
          rawDate: info.validDate
        });
      }
    });

    return Array.from(sessionsMap.values()).sort((a, b) => {
      if (!a.rawDate) return 1;
      if (!b.rawDate) return -1;
      return b.rawDate.getTime() - a.rawDate.getTime();
    });
  }, [bookings, parks]);

  // Determine active session key
  const activeSessionKey = useMemo(() => {
    if (!selectedParam || selectedParam === 'All') return 'All';
    const foundByKey = allStallSessions.find(s => s.key === selectedParam);
    if (foundByKey) return foundByKey.key;
    const foundByParkId = allStallSessions.find(s => s.parkId === String(selectedParam));
    if (foundByParkId) return foundByParkId.key;
    return 'All';
  }, [selectedParam, allStallSessions]);

  const selectedSessionObj = useMemo(() => {
    if (activeSessionKey === 'All') return null;
    return allStallSessions.find(s => s.key === activeSessionKey) || null;
  }, [activeSessionKey, allStallSessions]);

  // Filter bookings by chosen Park + Date session
  const sessionBookings = useMemo(() => {
    if (activeSessionKey === 'All') return bookings;
    return bookings.filter(b => {
      const info = getBookingSessionInfo(b);
      return info.key === activeSessionKey;
    });
  }, [bookings, activeSessionKey]);

  // Apply Status, Verification, Search filters
  const filteredBookings = useMemo(() => {
    return sessionBookings.filter(b => {
      if (paymentStatusFilter !== 'All') {
        if (paymentStatusFilter === 'Confirmed' && (b.status !== 'Confirmed' && b.status !== 'Approved')) return false;
        if (paymentStatusFilter === 'Pending' && (b.status !== 'Pending Payment' && b.status !== 'Pending Approval')) return false;
        if (paymentStatusFilter === 'Rejected' && (b.status !== 'Rejected' && b.status !== 'Expired')) return false;
      }

      if (verificationFilter !== 'All') {
        if (verificationFilter === 'Identity Verified' && b.identityVerificationStatus !== 'Verified') return false;
        if (verificationFilter === 'Address Verified' && b.addressVerificationStatus !== 'Verified') return false;
        if (verificationFilter === 'Pending Verification' && (b.identityVerificationStatus === 'Verified' && b.addressVerificationStatus === 'Verified')) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const applicantName = (b.applicantName || b.user?.name || '').toLowerCase();
        const email = (b.user?.email || '').toLowerCase();
        const phone = (b.applicantPhone || b.user?.phone || '').toLowerCase();
        const stallName = (b.stallName || '').toLowerCase();
        const productsType = (b.productsType || '').toLowerCase();
        const bookingId = (b._id || '').toLowerCase();
        
        const info = getBookingSessionInfo(b);
        const parkName = (info.parkName || (typeof b.park === 'object' ? (b.park?.name || b.park?.parkName || '') : '')).toLowerCase();
        const parkCode = (info.parkCode || '').toLowerCase();
        const dateFormatted = (info.dateFormatted || '').toLowerCase();
        const rawBookingDate = b.bookingDate ? String(b.bookingDate).toLowerCase() : '';
        const rawCreatedAt = b.createdAt ? String(b.createdAt).toLowerCase() : '';

        const matches = 
          applicantName.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          stallName.includes(q) ||
          productsType.includes(q) ||
          bookingId.includes(q) ||
          parkName.includes(q) ||
          parkCode.includes(q) ||
          dateFormatted.includes(q) ||
          rawBookingDate.includes(q) ||
          rawCreatedAt.includes(q);

        if (!matches) {
          return false;
        }
      }

      return true;
    });
  }, [sessionBookings, paymentStatusFilter, verificationFilter, searchQuery, parks]);

  // Sorted by newest booking date
  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      const timeA = new Date(a.bookingDate || a.createdAt || 0).getTime();
      const timeB = new Date(b.bookingDate || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [filteredBookings]);

  // Group bookings by Park Name + Booking Date (Same as Event Page structure)
  const sessionGroups = useMemo(() => {
    const groupsMap = new Map();

    sortedBookings.forEach(b => {
      const info = getBookingSessionInfo(b);

      if (!groupsMap.has(info.key)) {
        groupsMap.set(info.key, {
          key: info.key,
          label: info.label,
          parkName: info.parkName,
          bookingDate: info.dateFormatted,
          rawBookingDate: info.validDate,
          parkObj: info.parkObj,
          items: [],
          totalAmount: 0,
          confirmedCount: 0,
          pendingCount: 0,
          rejectedCount: 0
        });
      }

      const grp = groupsMap.get(info.key);
      grp.items.push(b);
      if (b.status === 'Confirmed' || b.status === 'Approved') {
        grp.totalAmount += (Number(b.amountPaid) || 0);
        grp.confirmedCount += 1;
      } else if (b.status === 'Rejected' || b.status === 'Expired') {
        grp.rejectedCount += 1;
      } else {
        grp.pendingCount += 1;
      }
    });

    return Array.from(groupsMap.values()).sort((a, b) => {
      if (!a.rawBookingDate) return 1;
      if (!b.rawBookingDate) return -1;
      return b.rawBookingDate.getTime() - a.rawBookingDate.getTime();
    });
  }, [sortedBookings]);

  const toggleSessionGroup = (groupKey) => {
    setCollapsedSessionGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const expandAllGroups = () => setCollapsedSessionGroups({});
  const collapseAllGroups = () => {
    const collapsed = {};
    sessionGroups.forEach(g => { collapsed[g.key] = true; });
    setCollapsedSessionGroups(collapsed);
  };

  const resetAllFilters = () => {
    setPaymentStatusFilter('All');
    setVerificationFilter('All');
    setSearchQuery('');
  };

  const isAnyFilterActive = paymentStatusFilter !== 'All' || verificationFilter !== 'All' || searchQuery.trim() !== '';

  const handleSessionChange = (e) => {
    const val = e.target.value;
    if (val === 'All') {
      setSearchParams({});
    } else {
      setSearchParams({ sessionKey: val });
    }
  };

  // Summary Metrics
  const totalBookingsCount = sessionBookings.length;
  const confirmedBookings = sessionBookings.filter(b => b.status === 'Confirmed' || b.status === 'Approved');
  const pendingBookings = sessionBookings.filter(b => b.status === 'Pending Payment' || b.status === 'Pending Approval');
  const rejectedBookings = sessionBookings.filter(b => b.status === 'Rejected' || b.status === 'Expired');

  const confirmedCount = confirmedBookings.length;
  const pendingCount = pendingBookings.length;
  const rejectedCount = rejectedBookings.length;
  const totalCollection = confirmedBookings.reduce((sum, b) => sum + (Number(b.amountPaid) || 0), 0);
  const refundAmount = 0;

  const summaryStats = {
    totalBookingsCount,
    confirmedCount,
    pendingCount,
    rejectedCount,
    totalCollection,
    refundAmount
  };

  const filteredCollection = sortedBookings
    .filter(b => b.status === 'Confirmed' || b.status === 'Approved')
    .reduce((sum, b) => sum + (Number(b.amountPaid) || 0), 0);

  // Excel Export Handler with 3 Sheets (Matching Event Page)
  const exportExcelReport = () => {
    const wb = XLSX.utils.book_new();
    const generatedDateStr = new Date().toLocaleString('en-IN');

    // SHEET 1: Stall Booking Details
    const participantHeaders = [
      "S.No",
      "Booking ID",
      "Applicant Name",
      "Contact Phone",
      "Email",
      "Stall Name",
      "Products Category",
      "Park Location",
      "Booking Date",
      "Amount Paid (₹)",
      "Booking Status",
      "Identity Verification",
      "Address Verification"
    ];

    const mainSheetRows = [
      ["PARKS MONITORING SYSTEM - STALL BOOKING & PARTICIPANT REPORT"],
      [`Generated On: ${generatedDateStr}`],
      [""],
      ["STALL SESSION INFORMATION", ""],
      ["Park & Date Session", selectedSessionObj ? selectedSessionObj.label : "All Parks & Dates Combined"],
      ["Park Location", selectedSessionObj ? selectedSessionObj.parkName : "All Parks"],
      ["Booking Date", selectedSessionObj ? selectedSessionObj.dateFormatted : "All Dates"],
      ["Total Stall Bookings", totalBookingsCount],
      ["Confirmed / Approved Bookings", confirmedCount],
      ["Pending Payment / Approval", pendingCount],
      ["Rejected / Expired Bookings", rejectedCount],
      ["Total Revenue Collected (₹)", totalCollection],
      [""],
      ["REGISTERED STALL BOOKING DETAILS", ""],
      participantHeaders
    ];

    sortedBookings.forEach((b, index) => {
      const info = getBookingSessionInfo(b);
      const applicantName = b.applicantName || b.user?.name || 'Stall Owner';
      const phone = b.applicantPhone || b.user?.phone || 'N/A';
      const email = b.user?.email || 'N/A';
      const bookingId = `STALL-${(b._id || '').slice(-6).toUpperCase()}`;

      mainSheetRows.push([
        index + 1,
        bookingId,
        applicantName,
        phone,
        email,
        b.stallName || 'N/A',
        b.productsType || 'N/A',
        info.parkName,
        info.dateFormatted,
        Number(b.amountPaid) || 0,
        b.status || 'Pending',
        b.identityVerificationStatus || 'Pending',
        b.addressVerificationStatus || 'Pending'
      ]);
    });

    const wsParticipants = XLSX.utils.aoa_to_sheet(mainSheetRows);
    wsParticipants['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 18 }, // Booking ID
      { wch: 22 }, // Applicant Name
      { wch: 16 }, // Contact Phone
      { wch: 26 }, // Email
      { wch: 20 }, // Stall Name
      { wch: 18 }, // Products Category
      { wch: 24 }, // Park Location
      { wch: 14 }, // Booking Date
      { wch: 16 }, // Amount Paid
      { wch: 18 }, // Booking Status
      { wch: 18 }, // Identity Verification
      { wch: 18 }  // Address Verification
    ];

    XLSX.utils.book_append_sheet(wb, wsParticipants, "Registered Stalls");

    // SHEET 2: Stall Booking Summary
    const summaryRows = [
      ["STALL METADATA & FINANCIAL AUDIT"],
      [`Generated On: ${generatedDateStr}`],
      [""],
      ["1. PARK & SESSION METADATA"],
      ["Park & Date Session", selectedSessionObj ? selectedSessionObj.label : "All Parks & Dates Combined"],
      ["Park Location", selectedSessionObj ? selectedSessionObj.parkName : "All Parks"],
      ["Booking Date", selectedSessionObj ? selectedSessionObj.dateFormatted : "All Dates"],
      [""],
      ["2. STALL BOOKING SUMMARY METRICS"],
      ["Total Stall Bookings", totalBookingsCount],
      ["Confirmed / Approved Bookings", confirmedCount],
      ["Pending Payment / Approval Bookings", pendingCount],
      ["Rejected / Expired Bookings", rejectedCount],
      [""],
      ["3. FINANCIAL COLLECTION SUMMARY"],
      ["Total Revenue Collected (Confirmed Only) (₹)", totalCollection],
      ["Pending Revenue (Uncollected) (₹)", 0],
      ["Refund Amount (₹)", refundAmount]
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Stall Summary");

    // SHEET 3: Park & Date-wise Breakdown
    const sessionHeaders = [
      "S.No",
      "Park Name",
      "Booking Date",
      "Total Bookings",
      "Confirmed / Paid",
      "Pending Payments",
      "Rejected / Expired",
      "Total Collected Amount (₹)"
    ];

    const sessionRows = sessionGroups.map((grp, idx) => [
      idx + 1,
      grp.parkName,
      grp.bookingDate,
      grp.items.length,
      grp.confirmedCount,
      grp.pendingCount,
      grp.rejectedCount,
      grp.totalAmount
    ]);

    const wsSessionWise = XLSX.utils.aoa_to_sheet([sessionHeaders, ...sessionRows]);
    XLSX.utils.book_append_sheet(wb, wsSessionWise, "Park & Date Breakdown");

    const sanitizedTitle = selectedSessionObj 
      ? `${selectedSessionObj.parkName}_${selectedSessionObj.dateFormatted}`.replace(/[^a-zA-Z0-9]/g, '_')
      : 'All_Parks_Stall_Report';
    const filename = `Stall_Report_${sanitizedTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  const generateAndPrintReceipt = (booking) => {
    if (!booking) return;
    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      alert('Pop-up blocked! Please allow pop-ups to print or download the receipt.');
      return;
    }

    const info = getBookingSessionInfo(booking);
    const applicantName = booking.applicantName || booking.user?.name || 'Stall Owner';
    const receiptNo = `STALL-REC-${(booking._id || '').slice(-6).toUpperCase()}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stall_Receipt_${receiptNo}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; line-height: 1.5; background: #ffffff; }
            .receipt-box { border: 2px solid #059669; border-radius: 12px; padding: 24px; max-width: 650px; margin: 0 auto; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; }
            .header h2 { color: #047857; margin: 0 0 6px 0; font-size: 24px; font-weight: 700; }
            .header p { color: #64748b; margin: 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .ids-row { display: flex; justify-content: space-between; background: #ecfdf5; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; color: #047857; border: 1px solid #a7f3d0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            td.label { font-weight: 600; color: #475569; width: 42%; }
            td.value { font-weight: 600; color: #0f172a; }
            .footer-note { text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; font-size: 13px; color: #047857; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <h2>🌿 Parks Monitoring System</h2>
              <p>Official Stall Booking & Payment Receipt</p>
            </div>
            <div class="ids-row">
              <div>Receipt No: ${receiptNo}</div>
              <div>Booking ID: ${booking._id || 'N/A'}</div>
            </div>
            <table>
              <tbody>
                <tr><td class="label">Applicant Name</td><td class="value">${applicantName}</td></tr>
                <tr><td class="label">Contact Phone</td><td class="value">${booking.applicantPhone || booking.user?.phone || 'N/A'}</td></tr>
                <tr><td class="label">Email</td><td class="value">${booking.user?.email || 'N/A'}</td></tr>
                <tr><td class="label">Stall Name</td><td class="value">${booking.stallName || 'N/A'}</td></tr>
                <tr><td class="label">Products Category</td><td class="value">${booking.productsType || 'N/A'}</td></tr>
                <tr><td class="label">Park Location</td><td class="value">${info.parkName}</td></tr>
                <tr><td class="label">Booking Date</td><td class="value">${info.dateFormatted}</td></tr>
                <tr><td class="label">Booking Fee Paid</td><td class="value">₹${booking.amountPaid || 0}</td></tr>
                <tr><td class="label">Payment Status</td><td class="value">${booking.status || 'Confirmed'}</td></tr>
                <tr><td class="label">Identity Verification</td><td class="value">${booking.identityVerificationStatus || 'Verified'}</td></tr>
              </tbody>
            </table>
            <div class="footer-note">
              <p style="margin:0 0 4px 0; font-weight:bold;">✅ This is an official digitally generated stall receipt.</p>
              <p style="margin:0;">Keep this receipt for your records and park authority verification.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
  };

  const getStatusBadge = (status) => {
    const config = {
      Confirmed: { bg: '#dcfce7', color: '#166534', label: 'Confirmed' },
      Approved: { bg: '#dcfce7', color: '#166534', label: 'Approved' },
      'Pending Payment': { bg: '#e0e7ff', color: '#3730a3', label: 'Pending Payment' },
      'Pending Approval': { bg: '#fef3c7', color: '#92400e', label: 'Pending Approval' },
      Rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
      Expired: { bg: '#f1f5f9', color: '#475569', label: 'Expired' }
    };
    const c = config[status] || { bg: '#f1f5f9', color: '#475569', label: status || 'Unknown' };
    return (
      <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: c.bg, color: c.color }}>
        {c.label}
      </span>
    );
  };

  const getVerificationBadge = (status) => {
    const config = {
      Verified: { bg: '#dcfce7', color: '#166534' },
      Pending: { bg: '#fef3c7', color: '#92400e' },
      Rejected: { bg: '#fee2e2', color: '#991b1b' },
      'Proof Submitted': { bg: '#e0e7ff', color: '#3730a3' }
    };
    const c = config[status] || { bg: '#f1f5f9', color: '#475569' };
    return (
      <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700', background: c.bg, color: c.color }}>
        {status || 'Pending'}
      </span>
    );
  };

  return (
    <div style={{ padding: '2rem', background: '#0f172a', minHeight: '100vh', color: '#f8fafc', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Store size={28} color="#10b981" /> Stall Registrations & Payments
          </h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Park & date-wise revenue tracking, stall owner verification audit, and Excel report generation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowReportModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <BarChart3 size={18} /> Stall-wise Report
          </button>
          <button
            onClick={exportExcelReport}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <FileSpreadsheet size={18} /> Download Excel Report
          </button>
          <button
            onClick={fetchBookingsAndParks}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* 1. Park & Date Session Selection Bar & Metadata Card */}
      <div style={{ background: '#1e293b', border: '1.5px solid #334155', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: selectedSessionObj ? '1rem' : '0' }}>
          <label style={{ fontWeight: 700, color: '#10b981', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} /> Select Park & Booking Date:
          </label>
          <select
            value={activeSessionKey}
            onChange={handleSessionChange}
            style={{ flex: 1, minWidth: '280px', padding: '10px 14px', borderRadius: '8px', background: '#0f172a', color: '#f8fafc', border: '1.5px solid #334155', outline: 'none', fontSize: '0.92rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <option value="All">All Parks & Dates (Overview & Combined Reports)</option>
            {allStallSessions.map(s => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Session Metadata Banner */}
        {selectedSessionObj && (
          <div style={{ background: '#0f172a', border: '1px solid #059669', borderRadius: '10px', padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Selected Park Location</span>
              <strong style={{ fontSize: '1.05rem', color: '#34d399' }}>{selectedSessionObj.parkName}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Booking Date</span>
              <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} color="#10b981" /> {selectedSessionObj.dateFormatted}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Park Code & Area</span>
              <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} color="#10b981" /> {selectedSessionObj.parkCode || 'N/A'} — {formatLocation(selectedSessionObj.parkObj)}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Total Applications</span>
              <span style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: 800 }}>
                {summaryStats.totalBookingsCount} Stall Bookings
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Dynamic Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ background: '#1e293b', border: '1.5px solid #334155', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#60a5fa', marginBottom: '6px' }}>
            <Store size={22} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Bookings</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>{summaryStats.totalBookingsCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {activeSessionKey === 'All' ? `Across ${sessionGroups.length} park & date sessions` : 'For this specific park date'}
          </span>
        </div>

        <div style={{ background: '#1e293b', border: '1.5px solid #047857', borderRadius: '12px', padding: '1.25rem', background: 'linear-gradient(135deg, #064e3b 0%, #1e293b 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', marginBottom: '6px' }}>
            <CheckCircle size={22} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Confirmed / Paid</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>{summaryStats.confirmedCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>Confirmed stall slots</span>
        </div>

        <div style={{ background: '#1e293b', border: '1.5px solid #b45309', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fbbf24', marginBottom: '6px' }}>
            <Clock size={22} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Pending Payments</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>{summaryStats.pendingCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#fde68a' }}>Awaiting payment or review</span>
        </div>

        <div style={{ background: '#1e293b', border: '1.5px solid #991b1b', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', marginBottom: '6px' }}>
            <XCircle size={22} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Rejected / Expired</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171' }}>{summaryStats.rejectedCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>Declined or expired slots</span>
        </div>

        <div style={{ background: '#064e3b', border: '2px solid #10b981', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', marginBottom: '6px' }}>
            <IndianRupee size={22} /> <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Collection</span>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#ffffff' }}>₹{summaryStats.totalCollection.toLocaleString('en-IN')}</div>
          <span style={{ fontSize: '0.73rem', color: '#a7f3d0', fontWeight: 700 }}>From confirmed payments ONLY</span>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div style={{ background: '#1e293b', border: '1.5px solid #334155', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', border: '1.5px solid #334155', borderRadius: '8px', padding: '8px 12px', flex: 1, minWidth: '260px' }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by park name, booking date, stall name, applicant, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', fontSize: '0.875rem', width: '100%' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Park & Date Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0f172a', border: '1.5px solid #334155', borderRadius: '8px', padding: '6px 12px' }}>
          <Calendar size={15} color="#10b981" />
          <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Park & Date:</span>
          <select
            value={activeSessionKey}
            onChange={handleSessionChange}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', maxWidth: '220px' }}
          >
            <option value="All" style={{ background: '#1e293b' }}>All Parks & Booking Dates</option>
            {allStallSessions.map(s => (
              <option key={s.key} value={s.key} style={{ background: '#1e293b' }}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Booking Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0f172a', border: '1.5px solid #334155', borderRadius: '8px', padding: '6px 12px' }}>
          <Filter size={15} color="#94a3b8" />
          <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Status:</span>
          <select
            value={paymentStatusFilter}
            onChange={e => setPaymentStatusFilter(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
          >
            <option value="All" style={{ background: '#1e293b' }}>All Statuses</option>
            <option value="Confirmed" style={{ background: '#1e293b' }}>Confirmed / Approved</option>
            <option value="Pending" style={{ background: '#1e293b' }}>Pending Payment / Review</option>
            <option value="Rejected" style={{ background: '#1e293b' }}>Rejected / Expired</option>
          </select>
        </div>

        {/* Verification Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0f172a', border: '1.5px solid #334155', borderRadius: '8px', padding: '6px 12px' }}>
          <ShieldCheck size={15} color="#94a3b8" />
          <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Verification:</span>
          <select
            value={verificationFilter}
            onChange={e => setVerificationFilter(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
          >
            <option value="All" style={{ background: '#1e293b' }}>All Verification</option>
            <option value="Identity Verified" style={{ background: '#1e293b' }}>Identity Verified</option>
            <option value="Address Verified" style={{ background: '#1e293b' }}>Address Verified</option>
            <option value="Pending Verification" style={{ background: '#1e293b' }}>Pending Verification</option>
          </select>
        </div>

        {isAnyFilterActive && (
          <button
            onClick={resetAllFilters}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
          >
            <RotateCcw size={13} /> Reset Filters
          </button>
        )}
      </div>

      {/* 4. Registered Applicant & Stall Details Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', background: '#1e293b', borderRadius: '12px', border: '1.5px solid #334155' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px' }}>Loading stall booking records...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171', background: '#1e293b', borderRadius: '12px', border: '1.5px solid #991b1b' }}>{error}</div>
      ) : sortedBookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', background: '#1e293b', borderRadius: '12px', border: '1.5px solid #334155' }}>
          <Store size={48} color="#475569" />
          <p style={{ marginTop: '12px', fontSize: '0.95rem' }}>No stall bookings found matching your filters.</p>
          {isAnyFilterActive && (
            <button
              onClick={resetAllFilters}
              style={{ marginTop: '10px', padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : activeSessionKey === 'All' ? (
        /* ALL PARKS: Each distinct Park + Booking Date session is in its own dedicated collapsible card & table (Identical to Event Page) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>
              Showing <strong style={{ color: '#10b981' }}>{sortedBookings.length}</strong> stall bookings separated into <strong style={{ color: '#10b981' }}>{sessionGroups.length}</strong> distinct park & date sessions
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={expandAllGroups}
                style={{ padding: '6px 12px', background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Expand All
              </button>
              <button
                onClick={collapseAllGroups}
                style={{ padding: '6px 12px', background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Collapse All
              </button>
            </div>
          </div>

          {sessionGroups.map((grp) => {
            const isCollapsed = !!collapsedSessionGroups[grp.key];
            return (
              <div key={grp.key} style={{ background: '#1e293b', border: '1.5px solid #334155', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                {/* Park Group Header (Park Name — Date) */}
                <div
                  onClick={() => toggleSessionGroup(grp.key)}
                  style={{ background: '#0f172a', borderBottom: isCollapsed ? 'none' : '2px solid #334155', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', flexWrap: 'wrap', gap: '10px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1.5px solid #10b981', color: '#34d399', borderRadius: '8px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.98rem' }}>
                      <Store size={18} color="#10b981" />
                      <span>{grp.label}</span>
                    </div>
                  </div>

                  {/* Badges on Park Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                      📋 {grp.items.length} Stall Booking{grp.items.length > 1 ? 's' : ''}
                    </span>
                    <span style={{ background: '#064e3b', border: '1px solid #059669', color: '#34d399', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800 }}>
                      ₹{grp.totalAmount.toLocaleString('en-IN')} Collected
                    </span>
                    {grp.pendingCount > 0 && (
                      <span style={{ background: '#78350f', border: '1px solid #b45309', color: '#fde68a', padding: '5px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>
                        {grp.pendingCount} Pending
                      </span>
                    )}
                    <button style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                    </button>
                  </div>
                </div>

                {/* Park Group Table */}
                {!isCollapsed && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1.5px solid #334155' }}>
                          {[
                            'Booking ID',
                            'Applicant Name',
                            'Contact Phone',
                            'Email',
                            'Stall Name',
                            'Products Category',
                            'Amount Paid',
                            'Status',
                            'Identity Verified',
                            'Booking Date',
                            'Actions'
                          ].map(h => (
                            <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {grp.items.map((b) => {
                          const applicantName = b.applicantName || b.user?.name || 'Stall Owner';
                          const phone = b.applicantPhone || b.user?.phone || '—';
                          const email = b.user?.email || '—';
                          const bookingId = `STALL-${(b._id || '').slice(-6).toUpperCase()}`;

                          return (
                            <tr key={b._id} style={{ borderBottom: '1px solid #334155' }}>
                              <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#818cf8', fontSize: '0.85rem' }}>
                                {bookingId}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: 700, color: '#f8fafc' }}>{applicantName}</div>
                              </td>
                              <td style={{ padding: '12px 14px', color: '#cbd5e1', fontSize: '0.82rem' }}>
                                {phone}
                              </td>
                              <td style={{ padding: '12px 14px', color: '#cbd5e1', fontSize: '0.82rem' }}>
                                {email}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: 600, color: '#f8fafc' }}>{b.stallName || 'Stall'}</div>
                              </td>
                              <td style={{ padding: '12px 14px', color: '#cbd5e1', fontSize: '0.82rem' }}>
                                <span style={{ background: '#334155', color: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                  {b.productsType || 'General'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', fontWeight: 800, color: (b.status === 'Confirmed' || b.status === 'Approved') ? '#34d399' : '#94a3b8' }}>
                                ₹{(Number(b.amountPaid) || 0).toLocaleString('en-IN')}
                              </td>
                              <td style={{ padding: '12px 14px' }}>{getStatusBadge(b.status)}</td>
                              <td style={{ padding: '12px 14px' }}>{getVerificationBadge(b.identityVerificationStatus)}</td>
                              <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                {formatDisplayDate(b.bookingDate || b.createdAt)}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <button
                                  onClick={() => setSelectedBooking(b)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: '#064e3b', color: '#a7f3d0', border: '1px solid #047857', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                                >
                                  <Receipt size={13} /> Receipt
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* SINGLE SELECTED PARK + DATE SESSION: Clean table for only that chosen date session */
        <div style={{ background: '#1e293b', borderRadius: '14px', border: '1.5px solid #334155', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          <div style={{ padding: '1rem 1.25rem', background: '#0f172a', borderBottom: '1.5px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontWeight: 800, color: '#34d399', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Store size={17} /> {selectedSessionObj?.label}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {sortedBookings.length} stall bookings for this date
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '2px solid #334155' }}>
                  {[
                    'Booking ID',
                    'Applicant Name',
                    'Contact Phone',
                    'Email',
                    'Stall Name',
                    'Products Category',
                    'Amount Paid',
                    'Status',
                    'Identity Verified',
                    'Booking Date',
                    'Actions'
                  ].map(h => (
                    <th key={h} style={{ padding: '13px 14px', textAlign: 'left', fontWeight: 700, color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedBookings.map((b) => {
                  const applicantName = b.applicantName || b.user?.name || 'Stall Owner';
                  const phone = b.applicantPhone || b.user?.phone || '—';
                  const email = b.user?.email || '—';
                  const bookingId = `STALL-${(b._id || '').slice(-6).toUpperCase()}`;

                  return (
                    <tr key={b._id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '13px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#818cf8', fontSize: '0.85rem' }}>
                        {bookingId}
                      </td>
                      <td style={{ padding: '13px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{applicantName}</div>
                      </td>
                      <td style={{ padding: '13px 14px', color: '#cbd5e1', fontSize: '0.82rem' }}>
                        {phone}
                      </td>
                      <td style={{ padding: '13px 14px', color: '#cbd5e1', fontSize: '0.82rem' }}>
                        {email}
                      </td>
                      <td style={{ padding: '13px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{b.stallName || 'Stall'}</div>
                      </td>
                      <td style={{ padding: '13px 14px', color: '#cbd5e1', fontSize: '0.82rem' }}>
                        <span style={{ background: '#334155', color: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                          {b.productsType || 'General'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 14px', fontWeight: 800, color: (b.status === 'Confirmed' || b.status === 'Approved') ? '#34d399' : '#94a3b8' }}>
                        ₹{(Number(b.amountPaid) || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '13px 14px' }}>{getStatusBadge(b.status)}</td>
                      <td style={{ padding: '13px 14px' }}>{getVerificationBadge(b.identityVerificationStatus)}</td>
                      <td style={{ padding: '13px 14px', color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {formatDisplayDate(b.bookingDate || b.createdAt)}
                      </td>
                      <td style={{ padding: '13px 14px' }}>
                        <button
                          onClick={() => setSelectedBooking(b)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: '#064e3b', color: '#a7f3d0', border: '1px solid #047857', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          <Receipt size={13} /> Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', background: '#0f172a', borderTop: '1px solid #334155', color: '#94a3b8', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>Showing {sortedBookings.length} of {sessionBookings.length} stall records</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>Total Collected: ₹{filteredCollection.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedBooking && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedBooking(null)}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', border: '2px solid #059669', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', color: '#1e293b' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)', padding: '1.5rem', textAlign: 'center', color: 'white', borderTopLeftRadius: '14px', borderTopRightRadius: '14px' }}>
              <h2 style={{ margin: 0 }}>🌿 Parks Monitoring System</h2>
              <p style={{ margin: '4px 0 0', opacity: 0.9 }}>Official Stall Booking & Payment Receipt</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div><div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Receipt Number</div><div style={{ fontWeight: 800, fontSize: '1rem', color: '#064e3b', fontFamily: 'monospace' }}>STALL-REC-{(selectedBooking._id || '').slice(-6).toUpperCase()}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Booking ID</div><div style={{ fontWeight: 800, fontSize: '1rem', color: '#064e3b', fontFamily: 'monospace' }}>{(selectedBooking._id || '').slice(-8).toUpperCase()}</div></div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginBottom: '1rem' }}>
                <tbody>
                  {[
                    ['Applicant Name', selectedBooking.applicantName || selectedBooking.user?.name || 'Stall Owner'],
                    ['Contact Phone', selectedBooking.applicantPhone || selectedBooking.user?.phone || 'N/A'],
                    ['Email', selectedBooking.user?.email || 'N/A'],
                    ['Stall Name', selectedBooking.stallName || 'N/A'],
                    ['Products Category', selectedBooking.productsType || 'N/A'],
                    ['Park Location', getBookingSessionInfo(selectedBooking).parkName],
                    ['Booking Date', getBookingSessionInfo(selectedBooking).dateFormatted],
                    ['Booking Fee Paid', `₹${selectedBooking.amountPaid || 0}`],
                    ['Booking Status', selectedBooking.status || 'Confirmed'],
                    ['Identity Verification', selectedBooking.identityVerificationStatus || 'Verified']
                  ].map(([label, value]) => (
                    <tr key={label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 4px', color: '#64748b', fontWeight: 600, width: '42%' }}>{label}</td>
                      <td style={{ padding: '8px 4px', color: '#0f172a', fontWeight: label === 'Booking Fee Paid' ? 800 : 500 }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button onClick={() => generateAndPrintReceipt(selectedBooking)} style={{ flex: 1, padding: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Download size={16} /> Download PDF Receipt
                </button>
                <button onClick={() => setSelectedBooking(null)} style={{ padding: '12px 20px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stall-wise Audit Report Modal */}
      {showReportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem', backdropFilter: 'blur(6px)' }} onClick={() => setShowReportModal(false)}>
          <div style={{ background: '#1e293b', border: '1.5px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', color: '#f8fafc' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1.5px solid #334155', background: '#0f172a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BarChart3 size={24} color="#10b981" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>Stall Booking & Revenue Audit</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    {selectedSessionObj ? selectedSessionObj.label : 'All Parks & Dates Combined'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Session Info Card */}
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '1rem' }}>
                <h4 style={{ margin: '0 0 10px', color: '#10b981', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 16px', fontSize: '0.88rem' }}>
                  <div><span style={{ color: '#94a3b8' }}>Park & Date Session:</span> <strong>{selectedSessionObj ? selectedSessionObj.label : 'All Parks & Dates Combined'}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Park Name:</span> <strong>{selectedSessionObj ? selectedSessionObj.parkName : 'All Parks'}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Booking Date:</span> <strong>{selectedSessionObj ? selectedSessionObj.dateFormatted : 'All Dates'}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Total Bookings:</span> <strong>{summaryStats.totalBookingsCount}</strong></div>
                </div>
              </div>

              {/* Park & Date-wise Breakdown Table */}
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '1rem' }}>
                <h4 style={{ margin: '0 0 10px', color: '#34d399', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Store size={16} /> Park & Date-wise Breakdown
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Park Name — Booking Date</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Total Bookings</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Confirmed / Paid</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Pending</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Rejected</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Collected</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionGroups.map(grp => (
                        <tr key={grp.key} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#f8fafc' }}>
                            {grp.label}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#60a5fa', fontWeight: 700 }}>{grp.items.length}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#34d399', fontWeight: 700 }}>{grp.confirmedCount}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: grp.pendingCount > 0 ? '#fbbf24' : '#94a3b8', fontWeight: 700 }}>{grp.pendingCount}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: grp.rejectedCount > 0 ? '#f87171' : '#94a3b8', fontWeight: 700 }}>{grp.rejectedCount}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#34d399', fontWeight: 800 }}>₹{grp.totalAmount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Metrics Summary */}
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '1rem' }}>
                <h4 style={{ margin: '0 0 10px', color: '#60a5fa', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary Metrics</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                  <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Bookings</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>{summaryStats.totalBookingsCount}</div>
                  </div>
                  <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #047857' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>Confirmed / Paid</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>{summaryStats.confirmedCount}</div>
                  </div>
                  <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #b45309' }}>
                    <span style={{ fontSize: '0.75rem', color: '#fde68a' }}>Pending Payments</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>{summaryStats.pendingCount}</div>
                  </div>
                  <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #991b1b' }}>
                    <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>Rejected / Expired</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>{summaryStats.rejectedCount}</div>
                  </div>
                </div>
              </div>

              {/* Financial Collection Box */}
              <div style={{ background: '#064e3b', border: '1.5px solid #10b981', borderRadius: '10px', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase' }}>Total Collection (Confirmed Payments Only)</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff' }}>₹{summaryStats.totalCollection.toLocaleString('en-IN')}</div>
                  <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>Refunds: ₹{summaryStats.refundAmount.toLocaleString('en-IN')}</span>
                </div>
                <button
                  onClick={exportExcelReport}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}
                >
                  <FileSpreadsheet size={20} /> Download 3-Sheet Excel
                </button>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1.5px solid #334155', background: '#0f172a', textAlign: 'right' }}>
              <button onClick={() => setShowReportModal(false)} style={{ padding: '8px 18px', background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStallPayments;
