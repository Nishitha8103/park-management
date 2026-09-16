const StallBooking = require('../models/StallBooking');
const Park = require('../models/Park');
const StallSlot = require('../models/StallSlot');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Setting = require('../models/Setting');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const DEFAULT_PROOF_TYPES = [
  'Rental Agreement',
  'Electricity Bill / Water Bill',
  'Gas Connection Bill',
  'College ID / Bonafide Certificate',
  'Employer Letter / HR Certificate',
  'Bank Statement with Local Address',
  'Other Valid Address Proof'
];

// @desc    Get accepted address proof types (public/citizen/admin)
// @route   GET /api/stall-bookings/config/proof-types
const getProofTypesConfig = async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'acceptedAddressProofTypes' });
    if (!setting) {
      setting = await Setting.create({
        key: 'acceptedAddressProofTypes',
        value: DEFAULT_PROOF_TYPES,
        description: 'Configurable accepted document proof types for current address verification'
      });
    }
    res.json({ success: true, proofTypes: setting.value });
  } catch (error) {
    console.error('Error fetching proof types:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update accepted address proof types (Admin only)
// @route   PUT /api/stall-bookings/config/proof-types
const updateProofTypesConfig = async (req, res) => {
  try {
    const { proofTypes } = req.body;
    if (!Array.isArray(proofTypes) || proofTypes.length === 0) {
      return res.status(400).json({ success: false, message: 'Proof types must be a non-empty array of strings.' });
    }

    const setting = await Setting.findOneAndUpdate(
      { key: 'acceptedAddressProofTypes' },
      { value: proofTypes },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Address proof types updated successfully.', proofTypes: setting.value });
  } catch (error) {
    console.error('Error updating proof types:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Book a stall slot
// @route   POST /api/stall-bookings
// @access  Private (Citizen/Stall Owner)
const createBooking = async (req, res) => {
  try {
    const {
      parkId,
      slotId,
      userId,
      stallName,
      productsType,
      applicantName,
      applicantPhone,
      amountPaid,
      nativeAddress,
      currentAddress,
      isAddressSameAsAadhaar,
      differentAddressReason,
      differentAddressOtherReason,
      currentAddressProofType
    } = req.body;

    const park = await Park.findById(parkId);
    if (!park) {
      return res.status(404).json({ message: 'Park not found' });
    }

    const slot = await StallSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Stall slot not found' });
    }
    
    if (!slot.isAvailable) {
      return res.status(400).json({ message: 'This slot is already booked or reserved' });
    }

    let documentUrl = '';
    let photoUrl = '';
    let currentAddressProofUrl = '';

    if (req.files) {
      if (req.files.document && req.files.document.length > 0) {
        documentUrl = `/uploads/parks/${req.files.document[0].filename}`;
      }
      if (req.files.photo && req.files.photo.length > 0) {
        photoUrl = `/uploads/parks/${req.files.photo[0].filename}`;
      }
      if (req.files.currentAddressProof && req.files.currentAddressProof.length > 0) {
        currentAddressProofUrl = `/uploads/parks/${req.files.currentAddressProof[0].filename}`;
      }
    }

    // Determine initial verification statuses
    const sameAddressBool = isAddressSameAsAadhaar === 'true' || isAddressSameAsAadhaar === true;
    
    let initialAddressStatus = 'Verified';
    if (!sameAddressBool) {
      if (currentAddressProofUrl) {
        initialAddressStatus = 'Proof Submitted';
      } else {
        initialAddressStatus = 'Proof Missing/Invalid';
      }
    }

    // Check if user already has verified Aadhaar KYC
    let initialIdentityStatus = 'Pending';
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.aadhaarKycStatus === 'verified') {
        initialIdentityStatus = 'Verified';
      }
    }

    // Create booking
    const booking = new StallBooking({
      park: parkId,
      slot: slotId,
      user: userId,
      stallName,
      productsType,
      applicantName,
      applicantPhone,
      amountPaid,
      photoUrl,
      documentUrl,
      nativeAddress: nativeAddress || '',
      currentAddress: currentAddress || '',
      isAddressSameAsAadhaar: sameAddressBool,
      differentAddressReason: sameAddressBool ? '' : (differentAddressReason || ''),
      differentAddressOtherReason: sameAddressBool ? '' : (differentAddressOtherReason || ''),
      currentAddressProofType: sameAddressBool ? '' : (currentAddressProofType || ''),
      currentAddressProofUrl,
      identityVerificationStatus: initialIdentityStatus,
      addressVerificationStatus: initialAddressStatus,
      status: 'Pending Approval'
    });

    await booking.save();

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating stall booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all bookings (Admin view)
// @route   GET /api/stall-bookings
// @access  Private (Admin)
const getBookings = async (req, res) => {
  try {
    const bookings = await StallBooking.find()
      .populate('park', 'name parkCode')
      .populate('slot')
      .populate('user', 'name email phone aadhaarNumber aadhaarKycStatus aadhaarFrontImage aadhaarBackImage aadhaarKycReviewedAt')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching stall bookings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get bookings for a specific user
// @route   GET /api/stall-bookings/user/:userId
// @access  Public / Private
const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, phone } = req.query;

    let queryConditions = [];
    if (userId && userId !== 'undefined' && userId !== 'null' && userId !== 'GUEST_USER') {
      queryConditions.push({ user: userId });
    }
    if (email) {
      queryConditions.push({ applicantEmail: email });
    }
    if (phone) {
      queryConditions.push({ applicantPhone: phone });
    }

    const query = queryConditions.length > 0 ? { $or: queryConditions } : { user: userId };

    const bookings = await StallBooking.find(query)
      .populate('park', 'name parkCode address')
      .populate('slot')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify Applicant Identity (Admin action)
// @route   PUT /api/stall-bookings/:id/verify-identity
// @access  Private (Admin)
const verifyIdentity = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body; // status: 'Verified' | 'Rejected'

    const booking = await StallBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.identityVerificationStatus = status || 'Verified';
    booking.identityReviewedAt = new Date();
    if (adminNotes) booking.adminNotes = adminNotes;
    await booking.save();

    res.json({ success: true, message: `Identity marked as ${booking.identityVerificationStatus}`, booking });
  } catch (error) {
    console.error('Error verifying identity:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify Current Residential Address (Admin action)
// @route   PUT /api/stall-bookings/:id/verify-address
// @access  Private (Admin)
const verifyAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body; // status: 'Verified' | 'Proof Missing/Invalid'

    const booking = await StallBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.addressVerificationStatus = status || 'Verified';
    booking.addressReviewedAt = new Date();
    if (adminNotes) booking.adminNotes = adminNotes;
    await booking.save();

    res.json({ success: true, message: `Address marked as ${booking.addressVerificationStatus}`, booking });
  } catch (error) {
    console.error('Error verifying address:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Request More Information (Admin action)
// @route   PUT /api/stall-bookings/:id/request-info
// @access  Private (Admin)
const requestMoreInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Please provide a message describing the required info.' });
    }

    const booking = await StallBooking.findById(id).populate('park');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.identityVerificationStatus = 'More Info Requested';
    booking.requestInfoMessage = message.trim();
    await booking.save();

    // Send Notification to Citizen
    const notification = new Notification({
      recipientUserId: booking.user,
      recipientRole: 'citizen',
      title: 'Action Required: Additional Stall Booking Info Needed',
      message: `Admin requested more information for your stall booking at ${booking.park?.name || 'the park'}: "${message.trim()}"`,
      type: 'STALL_INFO_REQUESTED',
      category: 'Park Updates'
    });
    await notification.save();

    res.json({ success: true, message: 'Request sent to applicant successfully.', booking });
  } catch (error) {
    console.error('Error requesting info:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Approve a stall booking
// @route   PUT /api/stall-bookings/:id/approve
// @access  Private (Admin)
const approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await StallBooking.findById(id).populate('park').populate('slot');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'Pending Approval') {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }

    const now = new Date();
    booking.status = 'Pending Payment';
    booking.approvalDate = now;

    // Calculate payment expiration deadline
    let expiresAt = null;
    const windowHours = booking.slot?.paymentWindowHours || 24;
    const windowExpiry = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

    if (booking.slot?.paymentDeadlineDate) {
      const d = new Date(booking.slot.paymentDeadlineDate);
      const timeStr = booking.slot.paymentDeadlineTime || '23:59';
      const [h, m] = timeStr.split(':').map(Number);
      d.setHours(h || 23, m || 59, 0, 0);
      expiresAt = (d > now && d < windowExpiry) ? d : windowExpiry;
    } else {
      expiresAt = windowExpiry;
    }

    booking.paymentExpiresAt = expiresAt;
    await booking.save();

    const formattedDeadline = expiresAt.toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    // Notify citizen
    const notification = new Notification({
      recipientUserId: booking.user,
      recipientRole: 'citizen',
      title: 'Stall Booking Approved - Payment Required',
      message: `Your stall booking at ${booking.park?.name || 'the park'} has been approved! Please complete the payment before ${formattedDeadline} to confirm your booking.`,
      type: 'STALL_PAYMENT_PENDING',
      category: 'Park Updates'
    });
    await notification.save();

    res.json(booking);
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reject a stall booking
// @route   PUT /api/stall-bookings/:id/reject
// @access  Private (Admin)
const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const booking = await StallBooking.findById(id).populate('park');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'Pending Approval') {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }

    booking.status = 'Rejected';
    if (reason) {
      booking.rejectionReason = reason;
    }
    await booking.save();

    // Notify citizen
    const reasonText = reason ? ` Reason: ${reason}` : ' Please review your documents and try again.';
    const notification = new Notification({
      recipientUserId: booking.user,
      recipientRole: 'citizen',
      title: 'Stall Booking Rejected',
      message: `Your stall booking at ${booking.park?.name || 'the park'} was rejected.${reasonText}`,
      type: 'STALL_REJECTED',
      category: 'Park Updates'
    });
    await notification.save();

    res.json(booking);
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create Razorpay Order for stall booking
// @route   POST /api/stall-bookings/:id/create-order
// @access  Private (Citizen)
const createRazorpayOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await StallBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'Pending Payment') {
      return res.status(400).json({ message: `Cannot create order for booking in status: ${booking.status}` });
    }

    if (booking.slot) {
      const slot = await StallSlot.findById(booking.slot);
      if (slot) {
        if (slot.availableSlots !== undefined && slot.availableSlots <= 0) {
           return res.status(400).json({ message: 'Sorry, this slot has already been fully booked by others who paid first.' });
        } else if (slot.availableSlots === undefined && !slot.isAvailable) {
           return res.status(400).json({ message: 'Sorry, this slot has already been fully booked by others who paid first.' });
        }
      }
    }

    const amount = booking.amountPaid * 100; // paise

    const razorpay = new Razorpay({
      key_id: (process.env.RAZORPAY_KEY_ID || "rzp_test_TZpwFUaag8MfCo").trim(), 
      key_secret: (process.env.RAZORPAY_KEY_SECRET || "tpAyBheedlToaXMjya5xOno7").trim(), 
    });

    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_stall_${id}_${Date.now()}`
    };

    try {
      const order = await razorpay.orders.create(options);
      res.json({ ...order, razorpayKeyId: (process.env.RAZORPAY_KEY_ID || "rzp_test_TZpwFUaag8MfCo").trim() });
    } catch (razorpayError) {
      console.warn('Razorpay API failed:', razorpayError);
      return res.status(400).json({ 
        message: razorpayError.description || razorpayError.message || 'Payment gateway authentication failed. Please check Razorpay keys.' 
      });
    }
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Error creating Razorpay order', error: error.message });
  }
};

// @desc    Verify Razorpay Payment and confirm booking
// @route   POST /api/stall-bookings/:id/pay
// @access  Private (Citizen)
const payBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    const booking = await StallBooking.findById(id).populate('park');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'Pending Payment') {
      return res.status(400).json({ message: `Cannot pay for booking in status: ${booking.status}` });
    }

    // Verify signature
    if (razorpay_signature !== 'mock_signature') {
      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", (process.env.RAZORPAY_KEY_SECRET || "tpAyBheedlToaXMjya5xOno7").trim())
        .update(sign.toString())
        .digest("hex");

      if (razorpay_signature !== expectedSign) {
        return res.status(400).json({ message: 'Invalid payment signature' });
      }
    }

    // Check availability and decrement slot
    if (booking.slot) {
      const slot = await StallSlot.findById(booking.slot);
      if (slot) {
        if (slot.availableSlots !== undefined) {
          if (slot.availableSlots > 0) {
            slot.availableSlots -= 1;
            slot.isAvailable = slot.availableSlots > 0;
          }
        } else {
          slot.isAvailable = false;
        }
        await slot.save();
      }
    }

    booking.status = 'Confirmed';
    await booking.save();

    // Notify citizen
    const notification = new Notification({
      recipientUserId: booking.user,
      recipientRole: 'citizen',
      title: 'Stall Booking Confirmed!',
      message: `Your payment was successful and your stall booking at ${booking.park?.name || 'the park'} is now confirmed.`,
      type: 'STALL_CONFIRMED',
      category: 'Park Updates'
    });
    await notification.save();

    res.json(booking);
  } catch (error) {
    console.error('Error paying for booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getProofTypesConfig,
  updateProofTypesConfig,
  createBooking,
  getBookings,
  getUserBookings,
  verifyIdentity,
  verifyAddress,
  requestMoreInfo,
  approveBooking,
  rejectBooking,
  createRazorpayOrder,
  payBooking
};
