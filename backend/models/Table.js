import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available'
  },
  section: {
    type: String,
    enum: ['indoor', 'outdoor', 'balcony', 'private', 'rooftop'],
    default: 'indoor'
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  currentGuests: {
    type: Number,
    default: 0,
    min: 0
  },
  assignedWaiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  qrCode: {
    type: String,  // URL or base64 string of QR code
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    lastOrderTime: Date,
    totalOrdersToday: {
      type: Number,
      default: 0
    },
    averageOccupancyTime: {
      type: Number,  // in minutes
      default: 0
    }
  },
  features: {
    hasCharger: {
      type: Boolean,
      default: false
    },
    isWheelchairAccessible: {
      type: Boolean,
      default: false
    },
    hasAirConditioner: {
      type: Boolean,
      default: true
    }
  },
  reservations: [{
    date: Date,
    startTime: Date,
    endTime: Date,
    customerName: String,
    customerPhone: String,
    customerEmail: String,
    guestCount: Number,
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'cancelled', 'completed'],
      default: 'pending'
    },
    specialRequests: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  maintenanceLog: [{
    issue: String,
    reportedDate: Date,
    resolvedDate: Date,
    status: {
      type: String,
      enum: ['reported', 'in-progress', 'resolved'],
      default: 'reported'
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
tableSchema.index({ tableNumber: 1 });
tableSchema.index({ status: 1 });
tableSchema.index({ section: 1 });
tableSchema.index({ 'reservations.date': 1 });

// Virtual for current reservation
tableSchema.virtual('currentReservation').get(function() {
  const now = new Date();
  return this.reservations.find(res => 
    res.status === 'confirmed' && 
    res.startTime <= now && 
    res.endTime >= now
  );
});

// Method to check table availability
tableSchema.methods.isAvailableAt = function(date, startTime, endTime) {
  const conflictingReservation = this.reservations.find(res => 
    res.status === 'confirmed' && 
    res.date.toDateString() === date.toDateString() &&
    ((startTime >= res.startTime && startTime < res.endTime) ||
     (endTime > res.startTime && endTime <= res.endTime) ||
     (startTime <= res.startTime && endTime >= res.endTime))
  );
  
  return !conflictingReservation && this.status !== 'maintenance';
};

// Method to clear table
tableSchema.methods.clearTable = async function() {
  this.status = 'available';
  this.currentOrder = null;
  this.currentGuests = 0;
  this.metadata.lastOrderTime = new Date();
  this.metadata.totalOrdersToday += 1;
  
  await this.save();
  return this;
};

// Method to assign waiter
tableSchema.methods.assignWaiter = async function(waiterId) {
  this.assignedWaiter = waiterId;
  await this.save();
  return this;
};

// Method to report maintenance issue
tableSchema.methods.reportIssue = async function(issue, userId) {
  this.maintenanceLog.push({
    issue,
    reportedDate: new Date(),
    reportedBy: userId
  });
  
  this.status = 'maintenance';
  await this.save();
  return this;
};

// Pre-save middleware to validate guest count
tableSchema.pre('save', function(next) {
  if (this.currentGuests > this.capacity) {
    next(new Error('Current guests cannot exceed table capacity'));
  }
  next();
});

// Method to get daily statistics
tableSchema.statics.getDailyStats = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.aggregate([
    {
      $match: {
        'metadata.lastOrderTime': { $gte: today }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: '$metadata.totalOrdersToday' },
        averageOccupancy: { $avg: '$metadata.averageOccupancyTime' },
        busyTables: {
          $sum: {
            $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

export default mongoose.model('Table', tableSchema);
