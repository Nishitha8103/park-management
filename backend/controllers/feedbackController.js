const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Create Feedback
exports.createFeedback = async (req, res) => {
  try {
    const {
      parkName,
      parkId,
      corporation,
      zone,
      ward,
      overallRating,
      cleanlinessRating,
      maintenanceRating,
      comments,
      tags,
      userName,
      userEmail,
      userPhone,
      userId
    } = req.body;

    if (!parkName) {
      return res.status(400).json({ message: 'Park name is required' });
    }

    // Generate unique feedback ID (e.g. FB10482)
    const count = await Feedback.countDocuments();
    const feedbackId = `FB${1000 + count + Math.floor(100 + Math.random() * 900)}`;

    const feedback = new Feedback({
      feedbackId,
      user: userId || (req.user ? req.user.id : null),
      userName: userName || (req.user ? req.user.name : 'Public Citizen'),
      userEmail: userEmail || (req.user ? req.user.email : ''),
      userPhone: userPhone || (req.user ? req.user.phone : ''),
      park: parkId || null,
      parkName,
      corporation: corporation || 'BBMP',
      zone: zone || '',
      ward: ward || '',
      overallRating: Number(overallRating) || 5,
      cleanlinessRating: Number(cleanlinessRating) || 4,
      maintenanceRating: Number(maintenanceRating) || 5,
      comments: comments || '',
      tags: tags || []
    });

    await feedback.save();

    // Create Notification for Admin users
    try {
      const adminUsers = await User.find({ role: 'admin' });
      for (const admin of adminUsers) {
        await Notification.create({
          userId: admin._id,
          title: 'New Citizen Feedback Received',
          message: `${feedback.userName} submitted a ${feedback.overallRating}★ rating for ${parkName}.`,
          type: 'FEEDBACK_RECEIVED',
          link: '/admin-dashboard/feedback'
        });
      }
    } catch (notifErr) {
      console.error('Error creating feedback notifications:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ message: 'Server error while submitting feedback', error: error.message });
  }
};

// Get all feedback (for Admin)
exports.getAllFeedback = async (req, res) => {
  try {
    const { park, rating, search, startDate, endDate } = req.query;
    const filter = {};

    if (park) {
      filter.parkName = new RegExp(park, 'i');
    }

    if (rating && !isNaN(rating)) {
      filter.overallRating = Number(rating);
    }

    if (search) {
      filter.$or = [
        { feedbackId: new RegExp(search, 'i') },
        { parkName: new RegExp(search, 'i') },
        { userName: new RegExp(search, 'i') },
        { comments: new RegExp(search, 'i') },
        { zone: new RegExp(search, 'i') },
        { ward: new RegExp(search, 'i') }
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const feedbacks = await Feedback.find(filter)
      .populate('user', 'name email phone role')
      .populate('park', 'name zone ward district')
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching all feedbacks:', error);
    res.status(500).json({ message: 'Failed to fetch feedbacks', error: error.message });
  }
};

// Get Feedback stats (analytics for Admin)
exports.getFeedbackStats = async (req, res) => {
  try {
    const totalCount = await Feedback.countDocuments();
    const feedbacks = await Feedback.find({}, 'overallRating cleanlinessRating maintenanceRating createdAt');

    if (totalCount === 0) {
      return res.json({
        total: 0,
        averageOverall: 0,
        averageCleanliness: 0,
        averageMaintenance: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    }

    let sumOverall = 0;
    let sumCleanliness = 0;
    let sumMaintenance = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    feedbacks.forEach(f => {
      sumOverall += f.overallRating || 0;
      sumCleanliness += f.cleanlinessRating || 0;
      sumMaintenance += f.maintenanceRating || 0;
      const r = Math.min(5, Math.max(1, Math.round(f.overallRating || 5)));
      distribution[r] = (distribution[r] || 0) + 1;
    });

    res.json({
      total: totalCount,
      averageOverall: (sumOverall / totalCount).toFixed(1),
      averageCleanliness: (sumCleanliness / totalCount).toFixed(1),
      averageMaintenance: (sumMaintenance / totalCount).toFixed(1),
      ratingDistribution: distribution
    });
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    res.status(500).json({ message: 'Failed to fetch feedback stats', error: error.message });
  }
};

// Get feedback for current user
exports.getMyFeedback = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.query.userId;
    const userEmail = req.user ? req.user.email : req.query.email;

    const filter = {};
    if (userId) {
      filter.$or = [{ user: userId }, { userEmail: userEmail }];
    } else if (userEmail) {
      filter.userEmail = userEmail;
    } else {
      return res.json([]);
    }

    const feedbacks = await Feedback.find(filter).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error('Error getting my feedback:', error);
    res.status(500).json({ message: 'Failed to fetch user feedback' });
  }
};

// Delete feedback (admin only)
exports.deleteFeedback = async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete feedback' });
  }
};
