const StallSlot = require('../models/StallSlot');
const Park = require('../models/Park');

// @desc    Create a new stall slot (Admin)
// @route   POST /api/stall-slots
// @access  Private (Admin)
const createStallSlot = async (req, res) => {
  try {
    const { parkId, date, startTime, endTime, location, price, totalSlots, paymentDeadlineDate, paymentDeadlineTime, paymentWindowHours } = req.body;

    const park = await Park.findById(parkId);
    if (!park) {
      return res.status(404).json({ message: 'Park not found' });
    }

    const slot = new StallSlot({
      park: parkId,
      date,
      startTime,
      endTime,
      location,
      price,
      totalSlots: totalSlots || 1,
      availableSlots: totalSlots || 1,
      paymentDeadlineDate: paymentDeadlineDate ? new Date(paymentDeadlineDate) : undefined,
      paymentDeadlineTime: paymentDeadlineTime || '23:59',
      paymentWindowHours: paymentWindowHours ? Number(paymentWindowHours) : 24
    });

    await slot.save();
    res.status(201).json(slot);
  } catch (error) {
    console.error('Error creating stall slot:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all slots for a specific park
// @route   GET /api/stall-slots/park/:parkId
// @access  Public
const getSlotsByPark = async (req, res) => {
  try {
    const { parkId } = req.params;
    const { availableOnly } = req.query;

    let query = { park: parkId };
    if (availableOnly === 'true') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      query.isAvailable = true;
      query.availableSlots = { $gt: 0 };
      query.date = { $gte: todayStart };
    }

    const slots = await StallSlot.find(query).sort({ date: 1 });
    res.json(slots);
  } catch (error) {
    console.error('Error fetching stall slots:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all available stall slots across all parks
// @route   GET /api/stall-slots/available
// @access  Public
const getAllAvailableSlots = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const slots = await StallSlot.find({
      isAvailable: true,
      availableSlots: { $gt: 0 },
      date: { $gte: todayStart }
    })
      .populate('park', 'name address')
      .sort({ date: 1 });

    res.json(slots);
  } catch (error) {
    console.error('Error fetching all available slots:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a stall slot (Admin)
// @route   DELETE /api/stall-slots/:id
// @access  Private (Admin)
const deleteStallSlot = async (req, res) => {
  try {
    const slot = await StallSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    if (!slot.isAvailable) {
      return res.status(400).json({ message: 'Cannot delete a slot that is already booked or reserved.' });
    }

    await StallSlot.findByIdAndDelete(req.params.id);
    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('Error deleting stall slot:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createStallSlot,
  getSlotsByPark,
  getAllAvailableSlots,
  deleteStallSlot
};
