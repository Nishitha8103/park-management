const mongoose = require('mongoose');

const floraTaskSchema = new mongoose.Schema({
  park: { type: mongoose.Schema.Types.ObjectId, ref: 'Park', required: true },
  flora: { type: mongoose.Schema.Types.ObjectId, ref: 'Flora' }, // Optional: If the task is specific to a plant
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The Planting Staff
  taskType: { 
    type: String, 
    required: true,
    enum: ['Watering', 'Pruning', 'Fertilizing', 'Pest Control', 'Inspection', 'Planting', 'Other']
  },
  description: { type: String },
  dueDate: { type: Date, required: true },
  status: { 
    type: String, 
    default: 'Pending',
    enum: ['Pending', 'In Progress', 'Completed']
  },
  completionNotes: { type: String },
  completedAt: { type: Date }
}, { timestamps: true });

const FloraTask = mongoose.model('FloraTask', floraTaskSchema);

module.exports = FloraTask;
