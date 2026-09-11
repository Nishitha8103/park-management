const Flora = require('../models/Flora');
const FloraTask = require('../models/FloraTask');
const User = require('../models/User');

// @desc    Get all flora (Admin or Staff)
// @route   GET /api/flora
// @access  Private
const getFlora = async (req, res) => {
  try {
    let query = {};
    
    // If the user is Planting Staff, show flora for their assigned parks
    if (req.user && req.user.role === 'Planting Staff') {
      const staffUser = await User.findById(req.user._id);
      if (staffUser && staffUser.assignedParks && staffUser.assignedParks.length > 0) {
        query.park = { $in: staffUser.assignedParks };
      } else {
        return res.json([]); // No parks assigned
      }
    }

    const flora = await Flora.find(query).populate('park', 'name');
    res.json(flora);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new flora (Admin or Staff)
// @route   POST /api/flora
// @access  Private
const addFlora = async (req, res) => {
  try {
    const { park, species, scientificName, type, healthStatus, locationInPark, wateringFrequencyDays, notes } = req.body;
    
    const flora = await Flora.create({
      park,
      species,
      scientificName,
      type,
      healthStatus: healthStatus || 'Healthy',
      plantingDate: new Date(),
      locationInPark,
      wateringFrequencyDays: wateringFrequencyDays || 2,
      notes
    });

    res.status(201).json(flora);
  } catch (error) {
    res.status(400).json({ message: 'Error adding plant', error: error.message });
  }
};

// @desc    Update flora status (Admin or Staff)
// @route   PUT /api/flora/:id
// @access  Private
const updateFlora = async (req, res) => {
  try {
    const { healthStatus, species, scientificName, type, locationInPark, wateringFrequencyDays, notes } = req.body;
    
    const flora = await Flora.findById(req.params.id);
    if (!flora) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    if (healthStatus) flora.healthStatus = healthStatus;
    if (species) flora.species = species;
    if (scientificName) flora.scientificName = scientificName;
    if (type) flora.type = type;
    if (locationInPark) flora.locationInPark = locationInPark;
    if (wateringFrequencyDays) flora.wateringFrequencyDays = wateringFrequencyDays;
    if (notes) flora.notes = notes;

    const updatedFlora = await flora.save();
    res.json(updatedFlora);
  } catch (error) {
    res.status(400).json({ message: 'Error updating plant', error: error.message });
  }
};

// @desc    Get all Planting Staff members (Admin)
// @route   GET /api/flora/staff
// @access  Private/Admin
const getPlantingStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'Planting Staff' })
      .select('-password')
      .populate('assignedParks', 'name location');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching planting staff', error: error.message });
  }
};

// @desc    Create a Planting Staff member (Admin)
// @route   POST /api/flora/staff
// @access  Private/Admin
const createPlantingStaff = async (req, res) => {
  try {
    const { name, username, email, password, assignedParks } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    const staff = await User.create({
      name,
      username: username || email.split('@')[0],
      email,
      password,
      role: 'Planting Staff',
      assignedParks: assignedParks || []
    });

    res.status(201).json({
      _id: staff._id,
      name: staff.name,
      username: staff.username,
      email: staff.email,
      role: staff.role,
      assignedParks: staff.assignedParks
    });
  } catch (error) {
    res.status(400).json({ message: 'Error creating planting staff', error: error.message });
  }
};

// @desc    Get tasks for logged in staff
// @route   GET /api/flora/tasks/my-tasks
// @access  Private (Planting Staff or Admin)
const getMyTasks = async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user.role === 'Planting Staff') {
      const staffUser = await User.findById(req.user._id);
      if (staffUser && staffUser.assignedParks && staffUser.assignedParks.length > 0) {
        query = { $or: [{ assignedTo: req.user._id }, { park: { $in: staffUser.assignedParks } }] };
      } else {
        query = { assignedTo: req.user._id };
      }
    }

    const tasks = await FloraTask.find(query)
      .populate('park', 'name')
      .populate('flora', 'species locationInPark')
      .sort({ dueDate: 1 });
      
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all tasks (Admin)
// @route   GET /api/flora/tasks/all
// @access  Private/Admin
const getAllTasks = async (req, res) => {
  try {
    const tasks = await FloraTask.find({})
      .populate('park', 'name')
      .populate('flora', 'species locationInPark')
      .populate('assignedTo', 'name email')
      .sort({ dueDate: -1 });
      
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new task
// @route   POST /api/flora/tasks
// @access  Private (Admin or Staff)
const createTask = async (req, res) => {
  try {
    const { park, flora, assignedTo, taskType, priority, dueDate, instructions } = req.body;

    const task = await FloraTask.create({
      park,
      flora: flora || null,
      assignedTo: assignedTo || req.user._id,
      taskType: taskType || 'Watering',
      priority: priority || 'Medium',
      dueDate: dueDate || new Date(),
      instructions
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: 'Error creating task', error: error.message });
  }
};

// @desc    Update a task status
// @route   PATCH /api/flora/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res) => {
  try {
    const { status, completionNotes } = req.body;
    
    const task = await FloraTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (status) {
      task.status = status;
      if (status === 'Completed') {
        task.completedAt = new Date();
      }
    }
    
    if (completionNotes !== undefined) task.completionNotes = completionNotes;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: 'Error updating task', error: error.message });
  }
};

module.exports = {
  getFlora,
  addFlora,
  updateFlora,
  getPlantingStaff,
  createPlantingStaff,
  getMyTasks,
  getAllTasks,
  createTask,
  updateTaskStatus
};
