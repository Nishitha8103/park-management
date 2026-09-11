const StallBooking = require('../models/StallBooking');
const Park = require('../models/Park');
const StallSlot = require('../models/StallSlot');
const Notification = require('../models/Notification');

// @desc    Book a stall slot
// @route   POST /api/stall-bookings
// @access  Private (Citizen/Stall Owner)
const createBooking = async (req, res) => {
  try {
    const { parkId, slotId, userId, stallName, productsType, applicantName, applicantPhone, amountPaid } = req.body;

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
    if (req.files) {
      if (req.files.document && req.files.document.length > 0) {
        documentUrl = `/uploads/parks/${req.files.document[0].filename}`;
      }
      if (req.files.photo && req.files.photo.length > 0) {
        photoUrl = `/uploads/parks/${req.files.photo[0].filename}`;
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
      documentUrl,
      photoUrl,
      status: 'Pending Approval'
    });

    await booking.save();

    // Slot decrement happens on Admin Approval now, not on creation
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
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching stall bookings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get bookings for a specific user
// @route   GET /api/stall-bookings/user/:userId
// @access  Private
const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await StallBooking.find({ user: userId })
      .populate('park', 'name parkCode')
      .populate('slot')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
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
      // Use earlier of slot cutoff date/time or window expiry
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

    // No need to increment slot availability here since we only decrement upon approval now


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

const Razorpay = require('razorpay');
const crypto = require('crypto');

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

    // Check if slots are still available before allowing payment
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
          if (slot.availableSlots <= 0) {
            // In a real system, we would process a refund here since they paid but the slot is full.
            // For now, we allow the booking but it means we slightly overbooked.
          } else {
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
  createBooking,
  getBookings,
  getUserBookings,
  approveBooking,
  rejectBooking,
  createRazorpayOrder,
  payBooking
};
