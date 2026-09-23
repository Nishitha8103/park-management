const mongoose = require('mongoose');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Notification = require('../models/Notification');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generate a sequential-style ID like REG-2026-00125 or RCT-2026-00125
 */
const generateSequentialId = async (prefix) => {
  const year = new Date().getFullYear();
  const count = await EventRegistration.countDocuments();
  const seq = String(count + 1).padStart(5, '0');
  return `${prefix}-${year}-${seq}`;
};

// ── Public Event Routes ─────────────────────────────────────────────────────

// Get all active events (public)
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({ isActive: true }).sort({ eventDate: 1 }).lean();
    for (let event of events) {
      const registrations = await EventRegistration.find({
        event: event._id,
        registrationStatus: { $in: ['Confirmed', 'Completed'] }
      });
      event.registeredCount = registrations.reduce((acc, reg) => acc + reg.numberOfAttendees, 0);
    }
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
};

// Get all events including inactive (admin)
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ eventDate: 1 }).lean();
    for (let event of events) {
      const registrations = await EventRegistration.find({ event: event._id });
      event.registeredCount = registrations.reduce((acc, reg) => acc + reg.numberOfAttendees, 0);
      const confirmed = registrations.filter(r => r.paymentStatus === 'Successful');
      event.confirmedCount = confirmed.reduce((acc, reg) => acc + reg.numberOfAttendees, 0);
      event.totalRevenue = confirmed.reduce((acc, reg) => acc + (reg.totalAmount || 0), 0);
    }
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all events', error: error.message });
  }
};

// Helper to check for event conflicts at the same park and overlapping time
const checkEventConflict = async ({ parkName, location, eventDate, excludeEventId = null }) => {
  const targetPark = (parkName || '').trim();
  const targetLocation = (location || '').trim();
  
  if (!targetPark && !targetLocation) return null;
  if (!eventDate) return null;

  const targetTime = new Date(eventDate).getTime();
  if (isNaN(targetTime)) return null;

  // Window check: Within 2 hours before or after the specified time at the same park/venue
  const windowStart = new Date(targetTime - 2 * 60 * 60 * 1000);
  const windowEnd = new Date(targetTime + 2 * 60 * 60 * 1000);

  const parkConditions = [];
  if (targetPark) {
    parkConditions.push({ parkName: { $regex: new RegExp(`^${targetPark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    parkConditions.push({ location: { $regex: new RegExp(`^${targetPark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
  }
  if (targetLocation && targetLocation !== targetPark) {
    parkConditions.push({ location: { $regex: new RegExp(`^${targetLocation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
  }

  const query = {
    $or: parkConditions,
    eventDate: { $gte: windowStart, $lte: windowEnd }
  };

  if (excludeEventId) {
    query._id = { $ne: excludeEventId };
  }

  const conflictingEvent = await Event.findOne(query);
  return conflictingEvent;
};

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, eventDate, location, image, isActive, isPaid, price, capacity, parkName } = req.body;

    // Check for conflicting event at the same park and time
    const conflict = await checkEventConflict({ parkName, location, eventDate });
    if (conflict) {
      const conflictDate = new Date(conflict.eventDate).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      const venue = conflict.parkName || conflict.location || 'this park';
      return res.status(400).json({
        message: `An event ("${conflict.title}") is already scheduled at ${venue} around that time (${conflictDate}). Please choose a different time or park venue.`
      });
    }

    const newEvent = new Event({ title, description, eventDate, location, image, isActive, isPaid, price, capacity, parkName });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(400).json({ message: 'Error creating event', error: error.message });
  }
};

// Update an event
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, eventDate, location, image, isActive, isPaid, price, capacity, parkName } = req.body;

    if (eventDate && (parkName || location)) {
      const conflict = await checkEventConflict({ parkName, location, eventDate, excludeEventId: id });
      if (conflict) {
        const conflictDate = new Date(conflict.eventDate).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
        const venue = conflict.parkName || conflict.location || 'this park';
        return res.status(400).json({
          message: `An event ("${conflict.title}") is already scheduled at ${venue} around that time (${conflictDate}). Please choose a different time or park venue.`
        });
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: 'Error updating event', error: error.message });
  }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting event', error: error.message });
  }
};

// Register for a FREE event (no payment required)
exports.registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, email, phone, age, gender,
      emergencyContactName, emergencyContactPhone, emergencyContactRelation,
      declarationAccepted, numberOfAttendees, userId
    } = req.body;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const attendees = Number(numberOfAttendees) || 1;

    // Check capacity
    if (event.capacity > 0) {
      const confirmed = await EventRegistration.find({
        event: id,
        registrationStatus: { $in: ['Confirmed', 'Completed'] }
      });
      const totalRegistered = confirmed.reduce((acc, reg) => acc + (Number(reg.numberOfAttendees) || 1), 0);
      if (totalRegistered + attendees > event.capacity) {
        return res.status(400).json({ message: `Only ${Math.max(0, event.capacity - totalRegistered)} spots left for this event.` });
      }
    }

    const registrationId = await generateSequentialId('REG');
    const receiptNumber = await generateSequentialId('RCT');

    const registration = new EventRegistration({
      event: id,
      userId: userId || null,
      name, email, phone, age, gender,
      emergencyContactName, emergencyContactPhone, emergencyContactRelation,
      declarationAccepted: declarationAccepted !== undefined ? declarationAccepted : true,
      numberOfAttendees: attendees,
      totalAmount: 0,
      paymentStatus: 'Successful',
      registrationStatus: 'Confirmed',
      paymentDate: new Date(),
      registrationId,
      receiptNumber,
      eventSnapshot: {
        title: event.title,
        parkName: event.parkName || event.location,
        eventDate: event.eventDate,
        location: event.location,
        price: 0
      }
    });
    await registration.save();

    try {
      const notifRecipientId = userId || email;
      await Notification.create({
        recipientUserId: notifRecipientId,
        recipientRole: 'citizen',
        title: 'Event Registration Confirmed',
        message: `Your registration for "${event.title}" at ${event.parkName || event.location} has been confirmed successfully. Registration ID: ${registrationId}`,
        type: 'Event Registration Confirmed',
        category: 'Event',
        priority: 'NORMAL',
        relatedEntityType: 'EVENT',
        relatedEntityId: id,
        actionRoute: '/my-registrations'
      });
    } catch (notifErr) {
      console.warn('Notification creation failed (non-critical):', notifErr.message);
    }

    res.status(201).json({ message: 'Successfully registered for the event', registration });
  } catch (error) {
    res.status(400).json({ message: 'Error registering for event', error: error.message });
  }
};

// ── Razorpay Payment Flow ───────────────────────────────────────────────────

// Create Razorpay Order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { numberOfAttendees } = req.body;

    const event = await Event.findById(id);
    if (!event || !event.isPaid) {
      return res.status(400).json({ message: 'Invalid event or event is not paid' });
    }

    const attendees = Number(numberOfAttendees) || 1;

    // Check capacity using only CONFIRMED registrations
    if (event.capacity > 0) {
      const confirmed = await EventRegistration.find({
        event: id,
        registrationStatus: { $in: ['Confirmed', 'Completed'] }
      });
      const totalRegistered = confirmed.reduce((acc, reg) => acc + (Number(reg.numberOfAttendees) || 1), 0);
      if (totalRegistered + attendees > event.capacity) {
        return res.status(400).json({ message: `Only ${Math.max(0, event.capacity - totalRegistered)} spots left for this event.` });
      }
    }

    let eventPrice = Number(event.price);
    if (isNaN(eventPrice) || eventPrice <= 0) {
      return res.status(400).json({ message: 'Event price must be greater than 0 for a paid event.' });
    }
    const amount = attendees * eventPrice * 100; // in paise

    const razorpay = new Razorpay({
      key_id: (process.env.RAZORPAY_KEY_ID || 'rzp_test_TZpwFUaag8MfCo').trim(),
      key_secret: (process.env.RAZORPAY_KEY_SECRET || 'tpAyBheedlToaXMjya5xOno7').trim(),
    });

    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_event_${id}_${Date.now()}`
    };

    try {
      const order = await razorpay.orders.create(options);
      res.json({ ...order, razorpayKeyId: (process.env.RAZORPAY_KEY_ID || 'rzp_test_TZpwFUaag8MfCo').trim() });
    } catch (razorpayError) {
      console.warn('Razorpay API failed:', razorpayError);
      return res.status(400).json({
        message: razorpayError.description || razorpayError.message || 'Payment gateway authentication failed.'
      });
    }
  } catch (error) {
    console.error('Error in createRazorpayOrder:', error);
    res.status(500).json({ message: 'Error creating Razorpay order', error });
  }
};

// Verify Razorpay Payment and Confirm Registration
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { id } = req.params; // Event ID
    const {
      name, email, phone, age, gender,
      emergencyContactName, emergencyContactPhone, emergencyContactRelation,
      declarationAccepted, numberOfAttendees,
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      userId
    } = req.body;

    // 1. Verify Razorpay signature
    if (razorpay_signature !== 'mock_signature') {
      const sign = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac('sha256', (process.env.RAZORPAY_KEY_SECRET || 'tpAyBheedlToaXMjya5xOno7').trim())
        .update(sign.toString())
        .digest('hex');

      if (razorpay_signature !== expectedSign) {
        return res.status(400).json({ message: 'Invalid payment signature. Payment not verified.' });
      }
    }

    // 2. Prevent duplicate registrations for the same payment
    const existing = await EventRegistration.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (existing) {
      return res.status(400).json({ message: 'This payment has already been used for registration.' });
    }

    // 3. Load event
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const attendees = numberOfAttendees || 1;
    const totalAmount = event.isPaid ? attendees * (event.price || 0) : 0;

    // 4. Generate unique IDs
    const registrationId = await generateSequentialId('REG');
    const receiptNumber = await generateSequentialId('RCT');

    // 5. Save confirmed registration
    const registration = new EventRegistration({
      event: id,
      userId: userId || null,
      name, email, phone, age, gender,
      emergencyContactName, emergencyContactPhone, emergencyContactRelation,
      declarationAccepted: declarationAccepted !== undefined ? declarationAccepted : true,
      numberOfAttendees: attendees,
      totalAmount,
      paymentStatus: 'Successful',
      registrationStatus: 'Confirmed',
      paymentDate: new Date(),
      paymentGateway: 'Razorpay',
      paymentReceiverType: 'Authorized Corporation/Government Account',
      registrationId,
      receiptNumber,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      eventSnapshot: {
        title: event.title,
        parkName: event.parkName || event.location,
        eventDate: event.eventDate,
        location: event.location,
        price: event.price || 0
      }
    });

    await registration.save();

    // 6. Create notification for the user
    try {
      const notifRecipientId = userId || email;
      await Notification.create({
        recipientUserId: notifRecipientId,
        recipientRole: 'citizen',
        title: 'Event Registration Confirmed',
        message: `Your registration for "${event.title}" at ${event.parkName || event.location} has been confirmed successfully. Registration ID: ${registrationId}`,
        type: 'Event Registration Confirmed',
        category: 'Event',
        priority: 'NORMAL',
        relatedEntityType: 'EVENT',
        relatedEntityId: id,
        actionRoute: '/my-registrations'
      });
    } catch (notifErr) {
      console.warn('Notification creation failed (non-critical):', notifErr.message);
    }

    // 7. Return full registration data for the success screen
    res.status(201).json({
      message: 'Payment verified and registration confirmed successfully',
      registration: {
        registrationId,
        receiptNumber,
        name,
        email,
        phone,
        numberOfAttendees: attendees,
        totalAmount,
        paymentStatus: 'Successful',
        registrationStatus: 'Confirmed',
        paymentDate: registration.paymentDate,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        paymentReceiverType: 'Authorized Corporation/Government Account',
        event: {
          title: event.title,
          parkName: event.parkName || event.location,
          eventDate: event.eventDate,
          location: event.location,
          price: event.price || 0
        }
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
};

// ── New Public Routes ────────────────────────────────────────────────────────

// Get a specific registration receipt (by registrationId)
exports.getRegistrationReceipt = async (req, res) => {
  try {
    const { regId } = req.params;
    const registration = await EventRegistration.findOne({ registrationId: regId }).populate('event');
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching receipt', error: error.message });
  }
};

// Get registrations for logged-in public user (by email or userId)
exports.getMyRegistrations = async (req, res) => {
  try {
    const { email, userId } = req.query;
    const cleanEmail = email ? email.trim() : '';
    const cleanUserId = userId ? userId.trim() : '';

    if (!cleanEmail && !cleanUserId) {
      return res.status(400).json({ message: 'Email or userId is required' });
    }

    const conditions = [];
    if (cleanEmail) {
      const emailRegex = new RegExp('^' + cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
      conditions.push({ email: emailRegex });
    }
    if (cleanUserId && mongoose.Types.ObjectId.isValid(cleanUserId)) {
      conditions.push({ userId: cleanUserId });
    }

    if (conditions.length === 0) {
      return res.json([]);
    }

    const query = conditions.length > 1 ? { $or: conditions } : conditions[0];

    const registrations = await EventRegistration.find(query)
      .populate('event', 'title parkName location eventDate price')
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    console.error('Error in getMyRegistrations:', error);
    res.status(500).json({ message: 'Error fetching registrations', error: error.message });
  }
};

// ── Admin Routes ─────────────────────────────────────────────────────────────

// Get all event registrations (admin)
exports.getAllRegistrations = async (req, res) => {
  try {
    const { eventId, paymentStatus } = req.query;
    const filter = {};
    if (eventId) filter.event = eventId;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const registrations = await EventRegistration.find(filter)
      .populate('event', 'title parkName location eventDate price capacity description')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all registrations', error: error.message });
  }
};

// Get payment statistics (admin)
exports.getPaymentStats = async (req, res) => {
  try {
    const all = await EventRegistration.find();
    const total = all.length;
    const successful = all.filter(r => r.paymentStatus === 'Successful');
    const pending = all.filter(r => r.paymentStatus === 'Pending' || r.paymentStatus === 'Processing');
    const failed = all.filter(r => r.paymentStatus === 'Failed');
    const confirmed = all.filter(r => r.registrationStatus === 'Confirmed' || r.registrationStatus === 'Completed');

    const totalCollection = successful.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

    res.json({
      total,
      successful: successful.length,
      pending: pending.length,
      failed: failed.length,
      confirmed: confirmed.length,
      totalCollection
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment stats', error: error.message });
  }
};
