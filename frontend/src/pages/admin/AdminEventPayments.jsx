import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  Users,
  IndianRupee,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Download,
  Receipt,
  FileSpreadsheet,
  Calendar,
  MapPin,
  Ticket,
  BarChart3,
  X,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';

const AdminEventPayments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedParam = searchParams.get('eventKey') || searchParams.get('eventId') || 'All';

  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [regStatusFilter, setRegStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSessionGroups, setCollapsedSessionGroups] = useState({});

  // Modals
  const [selectedReg, setSelectedReg] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const getAdminToken = () => JSON.parse(localStorage.getItem('adminUser'))?.token;

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getAdminToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [eventsRes, regRes] = await Promise.all([
        axios.get('/api/events/all', { headers }),
        axios.get('/api/events/registrations/all', { headers })
      ]);
      setEvents(eventsRes.data || []);
      setRegistrations(regRes.data || []);
    } catch (err) {
      setError('Failed to load event data and registrations. Please refresh.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  // Helper function to extract exact event session metadata from registration
  const getRegEventInfo = (reg) => {
    const ev = reg.eventSnapshot || (typeof reg.event === 'object' ? reg.event : null) || {};
    const title = (ev.title || 'Event').trim();
    const parkName = (ev.parkName || ev.location || 'Park').trim();
    const rawDate = ev.eventDate ? new Date(ev.eventDate) : null;
    const validDate = rawDate && !isNaN(rawDate.getTime()) ? rawDate : null;
    const dateFormatted = validDate ? validDate.toLocaleDateString('en-IN') : 'Date N/A';
    const dateISO = validDate ? `${validDate.getFullYear()}-${String(validDate.getMonth() + 1).padStart(2, '0')}-${String(validDate.getDate()).padStart(2, '0')}` : 'no-date';
    
    const key = `${title.toLowerCase()}___${parkName.toLowerCase()}___${dateISO}`;
    const label = `${title} — ${parkName} (${dateFormatted})`;
    
    return {
      key,
      label,
      title,
      parkName,
      dateFormatted,
      validDate,
      price: ev.price || 0,
      evId: ev._id ? String(ev._id) : (typeof reg.event === 'string' ? reg.event : '')
    };
  };

  // Build all distinct Event + Park + Event Date sessions (from events and registrations)
  const allEventSessions = useMemo(() => {
    const sessionsMap = new Map();

    // From Events DB
    events.forEach(ev => {
      const title = (ev.title || 'Event').trim();
      const parkName = (ev.parkName || ev.location || 'Park').trim();
      const rawDate = ev.eventDate ? new Date(ev.eventDate) : null;
      const validDate = rawDate && !isNaN(rawDate.getTime()) ? rawDate : null;
      const dateFormatted = validDate ? validDate.toLocaleDateString('en-IN') : 'Date N/A';
      const dateISO = validDate ? `${validDate.getFullYear()}-${String(validDate.getMonth() + 1).padStart(2, '0')}-${String(validDate.getDate()).padStart(2, '0')}` : 'no-date';
      const key = `${title.toLowerCase()}___${parkName.toLowerCase()}___${dateISO}`;
      const label = `${title} — ${parkName} (${dateFormatted})`;

      if (!sessionsMap.has(key)) {
        sessionsMap.set(key, {
          key,
          label,
          title,
          parkName,
          dateFormatted,
          rawDate: validDate,
          price: ev.price || 0,
          capacity: ev.capacity || 'Unlimited',
          eventObj: ev
        });
      }
    });

    // From Registrations Snapshot/History (in case past event dates exist)
    registrations.forEach(r => {
      const info = getRegEventInfo(r);
      if (!sessionsMap.has(info.key)) {
        sessionsMap.set(info.key, {
          key: info.key,
          label: info.label,
          title: info.title,
          parkName: info.parkName,
          dateFormatted: info.dateFormatted,
          rawDate: info.validDate,
          price: info.price || 0,
          capacity: 'N/A',
          eventObj: r.eventSnapshot || (typeof r.event === 'object' ? r.event : null)
        });
      }
    });

    // Sort all sessions by event date descending
    return Array.from(sessionsMap.values()).sort((a, b) => {
      if (!a.rawDate) return 1;
      if (!b.rawDate) return -1;
      return b.rawDate.getTime() - a.rawDate.getTime();
    });
  }, [events, registrations]);

  // Determine active session key
  const activeSessionKey = useMemo(() => {
    if (!selectedParam || selectedParam === 'All') return 'All';
    const foundByKey = allEventSessions.find(s => s.key === selectedParam);
    if (foundByKey) return foundByKey.key;
    const foundById = allEventSessions.find(s => s.eventObj && String(s.eventObj._id) === String(selectedParam));
    if (foundById) return foundById.key;
    return 'All';
  }, [selectedParam, allEventSessions]);

  const selectedSessionObj = useMemo(() => {
    if (activeSessionKey === 'All') return null;
    return allEventSessions.find(s => s.key === activeSessionKey) || null;
  }, [activeSessionKey, allEventSessions]);

  // Filter registrations by chosen event session
  const sessionRegistrations = useMemo(() => {
    if (activeSessionKey === 'All') return registrations;
    return registrations.filter(r => {
      const info = getRegEventInfo(r);
      return info.key === activeSessionKey;
    });
  }, [registrations, activeSessionKey]);

  // Apply search & status filters
  const filteredRegistrations = useMemo(() => {
    return sessionRegistrations.filter(r => {
      if (paymentStatusFilter !== 'All' && r.paymentStatus !== paymentStatusFilter) {
        return false;
      }
      if (regStatusFilter !== 'All' && r.registrationStatus !== regStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (r.name || '').toLowerCase();
        const email = (r.email || '').toLowerCase();
        const phone = (r.phone || '').toLowerCase();
        const regId = (r.registrationId || '').toLowerCase();
        const txId = (r.razorpayPaymentId || '').toLowerCase();
        const evTitle = (r.eventSnapshot?.title || r.event?.title || '').toLowerCase();
        const park = (r.eventSnapshot?.parkName || r.event?.parkName || r.eventSnapshot?.location || r.event?.location || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !phone.includes(q) && !regId.includes(q) && !txId.includes(q) && !evTitle.includes(q) && !park.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [sessionRegistrations, paymentStatusFilter, regStatusFilter, searchQuery]);

  // Sorted by newest registration date
  const sortedRegistrations = useMemo(() => {
    return [...filteredRegistrations].sort((a, b) => {
      const timeA = new Date(a.paymentDate || a.createdAt || 0).getTime();
      const timeB = new Date(b.paymentDate || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [filteredRegistrations]);

  // Group registrations by Event with Park Name and Event Date (for All Events view)
  const sessionGroups = useMemo(() => {
    const groupsMap = new Map();

    sortedRegistrations.forEach(reg => {
      const info = getRegEventInfo(reg);

      if (!groupsMap.has(info.key)) {
        groupsMap.set(info.key, {
          key: info.key,
          label: info.label,
          title: info.title,
          parkName: info.parkName,
          eventDate: info.dateFormatted,
          rawEventDate: info.validDate,
          items: [],
          totalAmount: 0,
          totalAttendees: 0,
          successfulCount: 0,
          pendingCount: 0,
          failedCount: 0
        });
      }

      const grp = groupsMap.get(info.key);
      grp.items.push(reg);
      if (reg.paymentStatus === 'Successful') {
        grp.totalAmount += (reg.totalAmount || 0);
        grp.successfulCount += 1;
      } else if (reg.paymentStatus === 'Failed') {
        grp.failedCount += 1;
      } else {
        grp.pendingCount += 1;
      }
      grp.totalAttendees += (reg.numberOfAttendees || 1);
    });

    return Array.from(groupsMap.values()).sort((a, b) => {
      if (!a.rawEventDate) return 1;
      if (!b.rawEventDate) return -1;
      return b.rawEventDate.getTime() - a.rawEventDate.getTime();
    });
  }, [sortedRegistrations]);

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
    setRegStatusFilter('All');
    setSearchQuery('');
  };

  const isAnyFilterActive = paymentStatusFilter !== 'All' || regStatusFilter !== 'All' || searchQuery.trim() !== '';

  // Dynamic summary stats from sessionRegistrations
  const totalRegistrations = sessionRegistrations.length;
  const totalAttendees = sessionRegistrations.reduce((sum, r) => sum + (r.numberOfAttendees || 1), 0);
  
  const successfulRegs = sessionRegistrations.filter(r => r.paymentStatus === 'Successful');
  const pendingRegs = sessionRegistrations.filter(r => r.paymentStatus === 'Pending' || r.paymentStatus === 'Processing');
  const failedRegs = sessionRegistrations.filter(r => r.paymentStatus === 'Failed');

  const successfulPaymentsCount = successfulRegs.length;
  const pendingPaymentsCount = pendingRegs.length;
  const failedPaymentsCount = failedRegs.length;

  const successfulAttendeesCount = successfulRegs.reduce((sum, r) => sum + (r.numberOfAttendees || 1), 0);
  const pendingAttendeesCount = pendingRegs.reduce((sum, r) => sum + (r.numberOfAttendees || 1), 0);
  const failedAttendeesCount = failedRegs.reduce((sum, r) => sum + (r.numberOfAttendees || 1), 0);

  const totalCollection = successfulRegs.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const refundAmount = 0;

  const summaryStats = {
    totalRegistrations,
    totalAttendees,
    successfulPaymentsCount,
    pendingPaymentsCount,
    failedPaymentsCount,
    successfulAttendeesCount,
    pendingAttendeesCount,
    failedAttendeesCount,
    totalCollection,
    refundAmount
  };

  const filteredSuccessfulRegs = sortedRegistrations.filter(r => r.paymentStatus === 'Successful');
  const filteredCollection = filteredSuccessfulRegs.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const filteredAttendees = sortedRegistrations.reduce((sum, r) => sum + (r.numberOfAttendees || 1), 0);

  // Handle Event Dropdown change
  const handleEventChange = (e) => {
    const val = e.target.value;
    if (val === 'All') {
      setSearchParams({});
    } else {
      setSearchParams({ eventKey: val });
    }
  };

  // Excel Exporter with Registered Participants prominently on Sheet 1
  const exportExcelReport = () => {
    const wb = XLSX.utils.book_new();
    const generatedDateStr = new Date().toLocaleString('en-IN');

    // SHEET 1: Complete Registered Participants Table with Event Header
    const participantHeaders = [
      "S.No",
      "Registration ID",
      "Participant Name",
      "Email",
      "Mobile Number",
      "Event Name",
      "Park Location",
      "Event Date",
      "Attendees",
      "Amount Paid (₹)",
      "Payment Status",
      "Transaction ID",
      "Registration Date",
      "Registration Status"
    ];

    const mainSheetRows = [
      ["PARKS MONITORING SYSTEM - EVENT REGISTRATIONS & PARTICIPANT REPORT"],
      [`Generated On: ${generatedDateStr}`],
      [""],
      ["EVENT INFORMATION", ""],
      ["Event Session", selectedSessionObj ? selectedSessionObj.label : "All Events Combined"],
      ["Park Location", selectedSessionObj ? selectedSessionObj.parkName : "All Parks"],
      ["Event Date", selectedSessionObj ? selectedSessionObj.dateFormatted : "All Dates"],
      ["Ticket Price", selectedSessionObj ? `₹${selectedSessionObj.price || 0}` : "Varies"],
      ["Total Registrations", totalRegistrations],
      ["Total Attendees", totalAttendees],
      ["Successful Payments Count", successfulPaymentsCount],
      ["Total Revenue Collected (₹)", totalCollection],
      [""],
      ["REGISTERED PARTICIPANT DETAILS", ""],
      participantHeaders
    ];

    sortedRegistrations.forEach((reg, index) => {
      const info = getRegEventInfo(reg);
      mainSheetRows.push([
        index + 1,
        reg.registrationId || "—",
        reg.name || "N/A",
        reg.email || "N/A",
        reg.phone || reg.emergencyContactPhone || "N/A",
        info.title,
        info.parkName,
        info.dateFormatted,
        reg.numberOfAttendees || 1,
        reg.totalAmount || 0,
        reg.paymentStatus || "Pending",
        reg.razorpayPaymentId || (reg.totalAmount === 0 ? "Free Entry" : "—"),
        reg.paymentDate ? new Date(reg.paymentDate).toLocaleString('en-IN') : (reg.createdAt ? new Date(reg.createdAt).toLocaleString('en-IN') : "—"),
        reg.registrationStatus || "Pending Payment"
      ]);
    });

    const wsParticipants = XLSX.utils.aoa_to_sheet(mainSheetRows);

    // Set clean readable column widths
    wsParticipants['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 20 }, // Registration ID
      { wch: 24 }, // Participant Name
      { wch: 30 }, // Email
      { wch: 18 }, // Mobile Number
      { wch: 22 }, // Event Name
      { wch: 28 }, // Park Location
      { wch: 14 }, // Event Date
      { wch: 12 }, // Attendees
      { wch: 16 }, // Amount Paid (₹)
      { wch: 16 }, // Payment Status
      { wch: 24 }, // Transaction ID
      { wch: 22 }, // Registration Date
      { wch: 18 }  // Registration Status
    ];

    XLSX.utils.book_append_sheet(wb, wsParticipants, "Registered Participants");

    // SHEET 2: Event Summary & Metrics
    const summaryRows = [
      ["EVENT METADATA & FINANCIAL AUDIT"],
      [`Generated On: ${generatedDateStr}`],
      [""],
      ["1. EVENT METADATA"],
      ["Event Session", selectedSessionObj ? selectedSessionObj.label : "All Events Combined"],
      ["Park / Location", selectedSessionObj ? selectedSessionObj.parkName : "All Parks"],
      ["Event Date", selectedSessionObj ? selectedSessionObj.dateFormatted : "N/A"],
      ["Ticket Price (₹)", selectedSessionObj ? (selectedSessionObj.price || 0) : "Varies"],
      ["Total Capacity", selectedSessionObj ? (selectedSessionObj.capacity || "Unlimited") : "N/A"],
      [""],
      ["2. REGISTRATION & ATTENDEE METRICS"],
      ["Total Registrations (Unique)", totalRegistrations],
      ["Total Attendees (People)", totalAttendees],
      ["Successful Payments Count", successfulPaymentsCount],
      ["Pending Payments Count", pendingPaymentsCount],
      ["Failed Payments Count", failedPaymentsCount],
      [""],
      ["3. FINANCIAL COLLECTION SUMMARY"],
      ["Total Successful Revenue Collected (₹)", totalCollection],
      ["Pending Revenue (Uncollected)", 0],
      ["Failed Revenue (Uncollected)", 0],
      ["Refund Amount (₹)", refundAmount]
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Event Summary");

    // SHEET 3: Event-wise Summary Breakdown
    const eventHeaders = [
      "S.No",
      "Event Name",
      "Park Name",
      "Event Date",
      "Total Registrations",
      "Total Attendees",
      "Successful Payments",
      "Pending Payments",
      "Total Collected Amount (₹)"
    ];

    const eventRows = sessionGroups.map((grp, idx) => [
      idx + 1,
      grp.title,
      grp.parkName,
      grp.eventDate,
      grp.items.length,
      grp.totalAttendees,
      grp.successfulCount,
      grp.pendingCount,
      grp.totalAmount
    ]);

    const wsEventWise = XLSX.utils.aoa_to_sheet([eventHeaders, ...eventRows]);
    XLSX.utils.book_append_sheet(wb, wsEventWise, "Events Breakdown");

    const sanitizedTitle = selectedSessionObj 
      ? `${selectedSessionObj.title}_${selectedSessionObj.dateFormatted}`.replace(/[^a-zA-Z0-9]/g, '_')
      : 'All_Events';
    const filename = `Event_Registrations_${sanitizedTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  const generateAndPrintReceipt = (reg) => {
    if (!reg) return;
    const info = getRegEventInfo(reg);
    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      alert('Pop-up blocked! Please allow pop-ups to print/download your receipt.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt_${reg.receiptNumber || reg.registrationId || 'Event'}</title>
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
              <p>Official Event Registration Receipt</p>
            </div>
            <div class="ids-row">
              <div>Receipt No: ${reg.receiptNumber || 'N/A'}</div>
              <div>Registration ID: ${reg.registrationId || 'N/A'}</div>
            </div>
            <table>
              <tbody>
                <tr><td class="label">Participant Name</td><td class="value">${reg.name || 'N/A'}</td></tr>
                <tr><td class="label">Email</td><td class="value">${reg.email || 'N/A'}</td></tr>
                <tr><td class="label">Phone</td><td class="value">${reg.phone || reg.emergencyContactPhone || 'N/A'}</td></tr>
                <tr><td class="label">Event Name</td><td class="value">${info.title}</td></tr>
                <tr><td class="label">Park Name</td><td class="value">${info.parkName}</td></tr>
                <tr><td class="label">Event Date</td><td class="value">${info.dateFormatted}</td></tr>
                <tr><td class="label">No. of Attendees</td><td class="value">${reg.numberOfAttendees || 1}</td></tr>
                <tr><td class="label">Amount Paid</td><td class="value">₹${reg.totalAmount || 0}</td></tr>
                <tr><td class="label">Transaction ID</td><td class="value">${reg.razorpayPaymentId || 'Free Entry'}</td></tr>
                <tr><td class="label">Payment Date</td><td class="value">${reg.paymentDate ? new Date(reg.paymentDate).toLocaleString('en-IN') : (reg.createdAt ? new Date(reg.createdAt).toLocaleString('en-IN') : 'N/A')}</td></tr>
                <tr><td class="label">Payment Status</td><td class="value">${reg.paymentStatus || 'Successful'}</td></tr>
                <tr><td class="label">Registration Status</td><td class="value">${reg.registrationStatus || 'Confirmed'}</td></tr>
                <tr><td class="label">Payment Receiver</td><td class="value">${reg.paymentReceiverType || 'Authorized Corporation/Government Account'}</td></tr>
              </tbody>
            </table>
            <div class="footer-note">
              <p style="margin:0 0 4px 0; font-weight:bold;">✅ This is an official digitally generated receipt.</p>
              <p style="margin:0;">Keep this receipt for your records.</p>
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

  const getPaymentBadge = (status) => {
    const styles = {
      Successful: { bg: '#dcfce7', color: '#166534', icon: '🟢' },
      Pending:    { bg: '#fef9c3', color: '#854d0e', icon: '🟡' },
      Processing: { bg: '#fef9c3', color: '#854d0e', icon: '🟡' },
      Failed:     { bg: '#fee2e2', color: '#991b1b', icon: '🔴' },
    };
    const s = styles[status] || { bg: '#f1f5f9', color: '#475569', icon: '⚪' };
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: s.bg, color: s.color }}>
        {s.icon} {status}
      </span>
    );
  };

  const getRegBadge = (status) => {
    const styles = {
      Confirmed:        { bg: '#dcfce7', color: '#166534' },
      Completed:        { bg: '#e0e7ff', color: '#3730a3' },
      'Pending Payment': { bg: '#fef9c3', color: '#854d0e' },
    };
    const s = styles[status] || { bg: '#f1f5f9', color: '#475569' };
    return (
      <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: s.bg, color: s.color }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ padding: '2rem', background: '#0f172a', minHeight: '100vh', color: '#f8fafc', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Ticket size={28} color="#10b981" /> Event Registrations & Payments
          </h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Event-wise revenue tracking, participant analytics, and Excel report generation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowReportModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <BarChart3 size={18} /> Event-wise Report
          </button>
          <button
            onClick={exportExcelReport}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <FileSpreadsheet size={18} /> Download Excel Report
          </button>
          <button
            onClick={fetchData}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* 1. Event Selection Bar & Metadata Card */}
      <div style={{ background: '#1e293b', border: '1.5px solid #334155', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: selectedSessionObj ? '1rem' : '0' }}>
          <label style={{ fontWeight: 700, color: '#10b981', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} /> Select Event:
          </label>
          <select
            value={activeSessionKey}
            onChange={handleEventChange}
            style={{ flex: 1, minWidth: '280px', padding: '10px 14px', borderRadius: '8px', background: '#0f172a', color: '#f8fafc', border: '1.5px solid #334155', outline: 'none', fontSize: '0.92rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <option value="All">All Events (Overview & Combined Reports)</option>
            {allEventSessions.map(s => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Event Metadata Banner */}
        {selectedSessionObj && (
          <div style={{ background: '#0f172a', border: '1px solid #059669', borderRadius: '10px', padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Selected Event</span>
              <strong style={{ fontSize: '1.05rem', color: '#34d399' }}>{selectedSessionObj.title}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Park Location</span>
              <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} color="#10b981" /> {selectedSessionObj.parkName}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Event Date</span>
              <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} color="#10b981" />
                {selectedSessionObj.dateFormatted}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Ticket Price / Capacity</span>
              <span style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: 800 }}>
                {selectedSessionObj.price > 0 ? `₹${selectedSessionObj.price} / ticket` : 'Free Event'}
                {' '}(Cap: {selectedSessionObj.capacity || 'Unlimited'})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Dynamic Event Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ background: '#1e293b', border: '1.5px solid #334155', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#60a5fa', marginBottom: '6px' }}>
            <Users size={22} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Registrations</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>{summaryStats.totalRegistrations}</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {activeSessionKey === 'All' ? `Across ${sessionGroups.length} event sessions` : 'For this specific event date'}
          </span>
        </div>

        <div style={{ background: '#1e293b', border: '1.5px solid #334155', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#c084fc', marginBottom: '6px' }}>
            <Users size={22} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Attendees</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c084fc' }}>{summaryStats.totalAttendees}</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total pass-holders</span>
        </div>

        <div style={{ background: '#1e293b', border: '1.5px solid #047857', borderRadius: '12px', padding: '1.25rem', background: 'linear-gradient(135deg, #064e3b 0%, #1e293b 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', marginBottom: '6px' }}>
            <CheckCircle size={22} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Successful Payments</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>{summaryStats.successfulPaymentsCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>Confirmed tickets</span>
        </div>

        <div style={{ background: '#1e293b', border: '1.5px solid #b45309', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fbbf24', marginBottom: '6px' }}>
            <Clock size={22} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Pending Payments</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>{summaryStats.pendingPaymentsCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#fde68a' }}>Awaiting payment</span>
        </div>

        <div style={{ background: '#1e293b', border: '1.5px solid #991b1b', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', marginBottom: '6px' }}>
            <XCircle size={22} /> <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Failed Payments</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171' }}>{summaryStats.failedPaymentsCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>Transactions unfulfilled</span>
        </div>

        <div style={{ background: '#064e3b', border: '2px solid #10b981', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', marginBottom: '6px' }}>
            <IndianRupee size={22} /> <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Collection</span>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#ffffff' }}>₹{summaryStats.totalCollection.toLocaleString('en-IN')}</div>
          <span style={{ fontSize: '0.73rem', color: '#a7f3d0', fontWeight: 700 }}>From successful payments ONLY</span>
        </div>
      </div>

      {/* 3. Search & Status Filters Bar */}
      <div style={{ background: '#1e293b', border: '1.5px solid #334155', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', border: '1.5px solid #334155', borderRadius: '8px', padding: '8px 12px', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by participant name, email, phone, Reg ID, TX ID..."
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

        {/* Payment Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0f172a', border: '1.5px solid #334155', borderRadius: '8px', padding: '6px 12px' }}>
          <Filter size={15} color="#94a3b8" />
          <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Payment:</span>
          <select
            value={paymentStatusFilter}
            onChange={e => setPaymentStatusFilter(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
          >
            <option value="All" style={{ background: '#1e293b' }}>All Payment Statuses</option>
            <option value="Successful" style={{ background: '#1e293b' }}>Successful</option>
            <option value="Pending" style={{ background: '#1e293b' }}>Pending</option>
            <option value="Processing" style={{ background: '#1e293b' }}>Processing</option>
            <option value="Failed" style={{ background: '#1e293b' }}>Failed</option>
          </select>
        </div>

        {/* Registration Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0f172a', border: '1.5px solid #334155', borderRadius: '8px', padding: '6px 12px' }}>
          <Ticket size={15} color="#94a3b8" />
          <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Reg. Status:</span>
          <select
            value={regStatusFilter}
            onChange={e => setRegStatusFilter(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
          >
            <option value="All" style={{ background: '#1e293b' }}>All Registration Statuses</option>
            <option value="Confirmed" style={{ background: '#1e293b' }}>Confirmed</option>
            <option value="Completed" style={{ background: '#1e293b' }}>Completed</option>
            <option value="Pending Payment" style={{ background: '#1e293b' }}>Pending Payment</option>
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

      {/* 4. Registered Participant Details Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', background: '#1e293b', borderRadius: '12px', border: '1.5px solid #334155' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px' }}>Loading registered participants from database...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171', background: '#1e293b', borderRadius: '12px', border: '1.5px solid #991b1b' }}>{error}</div>
      ) : sortedRegistrations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', background: '#1e293b', borderRadius: '12px', border: '1.5px solid #334155' }}>
          <Ticket size={48} color="#475569" />
          <p style={{ marginTop: '12px', fontSize: '0.95rem' }}>No registered participants found matching your filters.</p>
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
        /* ALL EVENTS: Each distinct Event + Park + Date session is in its own dedicated card & table */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>
              Showing <strong style={{ color: '#10b981' }}>{sortedRegistrations.length}</strong> registrations separated into <strong style={{ color: '#10b981' }}>{sessionGroups.length}</strong> distinct event sessions
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
                {/* Event Group Header (Event Name — Park Name (Date)) */}
                <div
                  onClick={() => toggleSessionGroup(grp.key)}
                  style={{ background: '#0f172a', borderBottom: isCollapsed ? 'none' : '2px solid #334155', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', flexWrap: 'wrap', gap: '10px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1.5px solid #10b981', color: '#34d399', borderRadius: '8px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.98rem' }}>
                      <Ticket size={18} color="#10b981" />
                      <span>{grp.label}</span>
                    </div>
                  </div>

                  {/* Badges on Event Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                      👥 {grp.items.length} Registration{grp.items.length > 1 ? 's' : ''} ({grp.totalAttendees} Attendees)
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

                {/* Event Group Table */}
                {!isCollapsed && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1.5px solid #334155' }}>
                          {[
                            'Registration ID',
                            'Participant Name',
                            'Email',
                            'Mobile Number',
                            'Attendees',
                            'Amount Paid',
                            'Payment Status',
                            'Transaction ID',
                            'Registration Date',
                            'Reg. Status',
                            'Actions'
                          ].map(h => (
                            <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {grp.items.map((reg) => (
                          <tr key={reg._id} style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#818cf8', fontSize: '0.85rem' }}>
                              {reg.registrationId || '—'}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: 700, color: '#f8fafc' }}>{reg.name}</div>
                            </td>
                            <td style={{ padding: '12px 14px', color: '#cbd5e1', fontSize: '0.82rem' }}>
                              {reg.email}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#cbd5e1', fontSize: '0.82rem' }}>
                              {reg.phone || reg.emergencyContactPhone || '—'}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, color: '#f8fafc' }}>
                              {reg.numberOfAttendees || 1}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 800, color: reg.paymentStatus === 'Successful' ? '#34d399' : '#94a3b8' }}>
                              ₹{(reg.totalAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '12px 14px' }}>{getPaymentBadge(reg.paymentStatus)}</td>
                            <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#94a3b8' }}>
                              {reg.razorpayPaymentId || (reg.totalAmount === 0 ? 'Free Entry' : '—')}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                              {formatDisplayDate(reg.paymentDate || reg.createdAt)}
                            </td>
                            <td style={{ padding: '12px 14px' }}>{getRegBadge(reg.registrationStatus)}</td>
                            <td style={{ padding: '12px 14px' }}>
                              {reg.registrationId && (
                                <button
                                  onClick={() => setSelectedReg(reg)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: '#064e3b', color: '#a7f3d0', border: '1px solid #047857', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                                >
                                  <Receipt size={13} /> Receipt
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* SINGLE SELECTED EVENT DATE: Clean table for only that chosen event session */
        <div style={{ background: '#1e293b', borderRadius: '14px', border: '1.5px solid #334155', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          <div style={{ padding: '1rem 1.25rem', background: '#0f172a', borderBottom: '1.5px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontWeight: 800, color: '#34d399', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Ticket size={17} /> {selectedSessionObj?.label}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {sortedRegistrations.length} registrations for this date
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '2px solid #334155' }}>
                  {[
                    'Registration ID',
                    'Participant Name',
                    'Email',
                    'Mobile Number',
                    'Attendees',
                    'Amount Paid',
                    'Payment Status',
                    'Transaction ID',
                    'Registration Date',
                    'Reg. Status',
                    'Actions'
                  ].map(h => (
                    <th key={h} style={{ padding: '13px 14px', textAlign: 'left', fontWeight: 700, color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRegistrations.map((reg) => (
                  <tr key={reg._id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '13px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#818cf8', fontSize: '0.85rem' }}>
                      {reg.registrationId || '—'}
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{reg.name}</div>
                    </td>
                    <td style={{ padding: '13px 14px', color: '#cbd5e1', fontSize: '0.82rem' }}>
                      {reg.email}
                    </td>
                    <td style={{ padding: '13px 14px', color: '#cbd5e1', fontSize: '0.82rem' }}>
                      {reg.phone || reg.emergencyContactPhone || '—'}
                    </td>
                    <td style={{ padding: '13px 14px', textAlign: 'center', fontWeight: 800, color: '#f8fafc' }}>
                      {reg.numberOfAttendees || 1}
                    </td>
                    <td style={{ padding: '13px 14px', fontWeight: 800, color: reg.paymentStatus === 'Successful' ? '#34d399' : '#94a3b8' }}>
                      ₹{(reg.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '13px 14px' }}>{getPaymentBadge(reg.paymentStatus)}</td>
                    <td style={{ padding: '13px 14px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#94a3b8' }}>
                      {reg.razorpayPaymentId || (reg.totalAmount === 0 ? 'Free Entry' : '—')}
                    </td>
                    <td style={{ padding: '13px 14px', color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {formatDisplayDate(reg.paymentDate || reg.createdAt)}
                    </td>
                    <td style={{ padding: '13px 14px' }}>{getRegBadge(reg.registrationStatus)}</td>
                    <td style={{ padding: '13px 14px' }}>
                      {reg.registrationId && (
                        <button
                          onClick={() => setSelectedReg(reg)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: '#064e3b', color: '#a7f3d0', border: '1px solid #047857', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          <Receipt size={13} /> Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', background: '#0f172a', borderTop: '1px solid #334155', color: '#94a3b8', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>Showing {sortedRegistrations.length} of {sessionRegistrations.length} registrations</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>Total Collected: ₹{filteredCollection.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReg && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedReg(null)}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', border: '2px solid #059669', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', color: '#1e293b' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)', padding: '1.5rem', textAlign: 'center', color: 'white', borderTopLeftRadius: '14px', borderTopRightRadius: '14px' }}>
              <h2 style={{ margin: 0 }}>🌿 Parks Monitoring System</h2>
              <p style={{ margin: '4px 0 0', opacity: 0.9 }}>Official Event Registration Receipt</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div><div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Receipt Number</div><div style={{ fontWeight: 800, fontSize: '1rem', color: '#064e3b', fontFamily: 'monospace' }}>{selectedReg.receiptNumber || 'N/A'}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Registration ID</div><div style={{ fontWeight: 800, fontSize: '1rem', color: '#064e3b', fontFamily: 'monospace' }}>{selectedReg.registrationId || 'N/A'}</div></div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginBottom: '1rem' }}>
                <tbody>
                  {[
                    ['Participant Name', selectedReg.name],
                    ['Email', selectedReg.email],
                    ['Phone', selectedReg.phone || selectedReg.emergencyContactPhone || 'N/A'],
                    ['Event Name', getRegEventInfo(selectedReg).title],
                    ['Park Name', getRegEventInfo(selectedReg).parkName],
                    ['Event Date', getRegEventInfo(selectedReg).dateFormatted],
                    ['No. of Attendees', selectedReg.numberOfAttendees || 1],
                    ['Amount Paid', `₹${selectedReg.totalAmount || 0}`],
                    ['Transaction ID', selectedReg.razorpayPaymentId || 'Free Entry'],
                    ['Payment Date', selectedReg.paymentDate ? new Date(selectedReg.paymentDate).toLocaleString('en-IN') : (selectedReg.createdAt ? new Date(selectedReg.createdAt).toLocaleString('en-IN') : 'N/A')],
                    ['Payment Status', selectedReg.paymentStatus],
                    ['Registration Status', selectedReg.registrationStatus],
                  ].map(([label, value]) => (
                    <tr key={label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 4px', color: '#64748b', fontWeight: 600, width: '42%' }}>{label}</td>
                      <td style={{ padding: '8px 4px', color: '#0f172a', fontWeight: label === 'Amount Paid' ? 800 : 500 }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button onClick={() => generateAndPrintReceipt(selectedReg)} style={{ flex: 1, padding: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Download size={16} /> Download PDF Receipt
                </button>
                <button onClick={() => setSelectedReg(null)} style={{ padding: '12px 20px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event-wise Audit Report Modal */}
      {showReportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem', backdropFilter: 'blur(6px)' }} onClick={() => setShowReportModal(false)}>
          <div style={{ background: '#1e293b', border: '1.5px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', color: '#f8fafc' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1.5px solid #334155', background: '#0f172a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BarChart3 size={24} color="#10b981" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>Event Registration & Revenue Audit</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    {selectedSessionObj ? selectedSessionObj.label : 'All Events Overview'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Event Info Card */}
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '1rem' }}>
                <h4 style={{ margin: '0 0 10px', color: '#10b981', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 16px', fontSize: '0.88rem' }}>
                  <div><span style={{ color: '#94a3b8' }}>Event Session:</span> <strong>{selectedSessionObj ? selectedSessionObj.label : 'All Events Combined'}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Park Name:</span> <strong>{selectedSessionObj ? selectedSessionObj.parkName : 'All Parks'}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Event Date:</span> <strong>{selectedSessionObj ? selectedSessionObj.dateFormatted : 'N/A'}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Ticket Price:</span> <strong>{selectedSessionObj ? `₹${selectedSessionObj.price || 0}` : 'Varies'}</strong></div>
                </div>
              </div>

              {/* Events Breakdown Table */}
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '1rem' }}>
                <h4 style={{ margin: '0 0 10px', color: '#34d399', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Ticket size={16} /> Event-wise Breakdown (Park & Date)
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Event — Park Name (Date)</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Registrations</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Attendees</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Successful</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Pending</th>
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
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#c084fc', fontWeight: 700 }}>{grp.totalAttendees}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#34d399', fontWeight: 700 }}>{grp.successfulCount}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: grp.pendingCount > 0 ? '#fbbf24' : '#94a3b8', fontWeight: 700 }}>{grp.pendingCount}</td>
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
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Registrations</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>{summaryStats.totalRegistrations}</div>
                  </div>
                  <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Attendees</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c084fc' }}>{summaryStats.totalAttendees}</div>
                  </div>
                  <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #047857' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>Successful Payments</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>{summaryStats.successfulPaymentsCount}</div>
                  </div>
                  <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #b45309' }}>
                    <span style={{ fontSize: '0.75rem', color: '#fde68a' }}>Pending Payments</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>{summaryStats.pendingPaymentsCount}</div>
                  </div>
                  <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #991b1b' }}>
                    <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>Failed Payments</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>{summaryStats.failedPaymentsCount}</div>
                  </div>
                </div>
              </div>

              {/* Financial Collection Box */}
              <div style={{ background: '#064e3b', border: '1.5px solid #10b981', borderRadius: '10px', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase' }}>Total Collection (Successful Payments Only)</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff' }}>₹{summaryStats.totalCollection.toLocaleString('en-IN')}</div>
                  <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>Refunds: ₹{summaryStats.refundAmount.toLocaleString('en-IN')}</span>
                </div>
                <button
                  onClick={exportExcelReport}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}
                >
                  <FileSpreadsheet size={20} /> Download Excel Report
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

export default AdminEventPayments;
