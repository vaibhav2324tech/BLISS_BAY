import express from 'express';
import QRCode from 'qrcode';
import Table from '../models/Table.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Generate QR code for a table
async function generateTableQR(tableNumber, baseUrl) {
  try {
    const qrData = `${baseUrl}/menu?table=${tableNumber}`;
    return await QRCode.toDataURL(qrData);
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
}

/* ========= STATS (must be above :id route) ========= */
router.get(
  '/stats/daily',
  authenticateToken,
  authorize('superadmin', 'admin', 'manager'),
  async (req, res) => {
    try {
      const stats = await Table.getDailyStats();
      res.json({
        success: true,
        data: stats[0] || {
          totalOrders: 0,
          averageOccupancy: 0,
          busyTables: 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching statistics',
        error: error.message
      });
    }
  }
);

/* ========= GET ALL TABLES ========= */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tables = await Table.find()
      .populate('assignedWaiter', 'username firstName lastName')
      .populate('currentOrder');
    res.json({ success: true, data: tables });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tables',
      error: error.message
    });
  }
});

/* ========= GET SINGLE TABLE ========= */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
      .populate('assignedWaiter', 'username firstName lastName')
      .populate('currentOrder');
    
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }
    
    res.json({ success: true, data: table });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching table',
      error: error.message
    });
  }
});

/* ========= CREATE TABLE ========= */
router.post(
  '/',
  authenticateToken,
  authorize('superadmin', 'admin', 'manager'),
  async (req, res) => {
    try {
      const table = new Table(req.body);
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      table.qrCode = await generateTableQR(table.tableNumber, baseUrl);

      await table.save();

      // Notify admins
      if (req.io) req.io.to('admin').emit('table-created', table);

      res.status(201).json({
        success: true,
        message: 'Table created successfully',
        data: table
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creating table',
        error: error.message
      });
    }
  }
);

/* ========= UPDATE TABLE ========= */
router.put('/:id', authenticateToken, authorize('superadmin', 'admin', 'manager'), async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    // If table number changes, regenerate QR code
    if (req.body.tableNumber && req.body.tableNumber !== table.tableNumber) {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      req.body.qrCode = await generateTableQR(req.body.tableNumber, baseUrl);
    }

    const updatedTable = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedWaiter', 'username firstName lastName');

    if (req.io) req.io.to('admin').emit('table-updated', updatedTable);

    res.json({
      success: true,
      message: 'Table updated successfully',
      data: updatedTable
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating table',
      error: error.message
    });
  }
});

/* ========= DELETE TABLE ========= */
router.delete('/:id', authenticateToken, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    if (table.status === 'occupied') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an occupied table'
      });
    }

    await table.deleteOne();

    if (req.io) req.io.to('admin').emit('table-deleted', { tableId: req.params.id });

    res.json({ success: true, message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting table',
      error: error.message
    });
  }
});

/* ========= ASSIGN WAITER ========= */
router.post('/:id/assign-waiter', authenticateToken, authorize('superadmin', 'admin', 'manager'), async (req, res) => {
  try {
    const { waiterId } = req.body;
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const updatedTable = await table.assignWaiter(waiterId);
    await updatedTable.populate('assignedWaiter', 'username firstName lastName');

    if (req.io) req.io.to('waiter').emit('waiter-assigned', updatedTable);

    res.json({
      success: true,
      message: 'Waiter assigned successfully',
      data: updatedTable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning waiter',
      error: error.message
    });
  }
});

/* ========= REPORT ISSUE ========= */
router.post('/:id/report-issue', authenticateToken, async (req, res) => {
  try {
    const { issue } = req.body;
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    await table.reportIssue(issue, req.user._id);

    if (req.io) {
      req.io.to('admin').emit('table-issue', {
        tableNumber: table.tableNumber,
        issue,
        reportedBy: req.user.username
      });
    }

    res.json({
      success: true,
      message: 'Issue reported successfully',
      data: table
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reporting issue',
      error: error.message
    });
  }
});

export default router;
