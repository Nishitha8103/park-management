const mongoose = require('mongoose');
const StallBooking = require('../models/StallBooking');
const StallSlot = require('../models/StallSlot');
const Notification = require('../models/Notification');

const syncAllSlotAvailability = async () => {
  try {
    const slots = await StallSlot.find();
    for (const slot of slots) {
      const activeBookingsCount = await StallBooking.countDocuments({
        slot: slot._id,
        status: { $in: ['Pending Approval', 'Pending Payment', 'Confirmed', 'Approved'] }
      });
      const total = slot.totalSlots || 1;
      const remaining = Math.max(0, total - activeBookingsCount);
      if (slot.availableSlots !== remaining || slot.isAvailable !== (remaining > 0)) {
        slot.availableSlots = remaining;
        slot.isAvailable = remaining > 0;
        await slot.save();
      }
    }
  } catch (err) {
    console.error('Error syncing slot availability:', err);
  }
};

const checkStallPaymentStatus = async () => {
  try {
    const now = new Date();
    // 30 minutes in milliseconds
    const EXPIRY_TIME_MS = 30 * 60 * 1000;

    // Find bookings that are 'Pending Payment'
    const pendingBookings = await StallBooking.find({
      status: 'Pending Payment',
      approvalDate: { $exists: true, $ne: null }
    }).populate('park');

    for (const booking of pendingBookings) {
      let isExpired = false;
      if (booking.paymentExpiresAt) {
        isExpired = now > new Date(booking.paymentExpiresAt);
      } else {
        const timeSinceApproval = now.getTime() - booking.approvalDate.getTime();
        isExpired = timeSinceApproval > EXPIRY_TIME_MS;
      }

      if (isExpired) {
        booking.status = 'Expired';
        await booking.save();

        if (booking.slot) {
          const slot = await StallSlot.findById(booking.slot);
          if (slot) {
            if (slot.availableSlots !== undefined) {
              slot.availableSlots = Math.min(slot.totalSlots || 1, slot.availableSlots + 1);
            } else {
              slot.availableSlots = 1;
            }
            slot.isAvailable = true;
            await slot.save();
          }
        }

        await Notification.create({
          recipientUserId: booking.user,
          recipientRole: 'citizen',
          title: 'Stall Booking Expired (Payment Deadline Passed)',
          message: `Your approved stall booking at ${booking.park?.name || 'the park'} expired because payment was not completed before the deadline.`,
          type: 'STALL_BOOKING_CANCELLED',
          category: 'Park Updates'
        });
        
        console.log(`[Cron] Marked booking ${booking._id} as Expired due to payment deadline timeout.`);
      }
    }

    // Periodically re-sync all slot availability to ensure consistency
    await syncAllSlotAvailability();
  } catch (err) {
    console.error('Error running Stall Payment check cron job:', err);
  }
};

const initStallPaymentCron = () => {
  // Sync slots and check expiry on startup
  syncAllSlotAvailability();

  // Check every 1 minute
  setInterval(checkStallPaymentStatus, 60 * 1000);
  setTimeout(checkStallPaymentStatus, 5000);
  
  console.log('Stall Payment Expiry Cron Job Initialized');
};

module.exports = { initStallPaymentCron, syncAllSlotAvailability };
