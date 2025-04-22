// backend/routes/workstations.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Create database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inventory_system',
  waitForConnections: true,
  connectionLimit: 10
});

// Get all workstations with status info
router.get('/workstations', async (req, res) => {
  try {
    // SQL query to get all workstations with needed status info
    const [rows] = await pool.query(`
      SELECT 
        w.workStationID, 
        w.modelName, 
        w.empID, 
        COUNT(a.assetID) as assetCount
      FROM 
        workstations w
      LEFT JOIN 
        assets a ON w.workStationID = a.workStationID
      GROUP BY 
        w.workStationID
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching workstations:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get workstation details by ID
router.get('/workstations/:id', async (req, res) => {
  try {
    const workstationId = req.params.id;
    
    // Get workstation info
    const [workstation] = await pool.query(`
      SELECT 
        w.*, 
        e.empFirstName, 
        e.empLastName, 
        e.empDept
      FROM 
        workstations w
      LEFT JOIN 
        employees e ON w.empID = e.empID
      WHERE 
        w.workStationID = ?
    `, [workstationId]);
    
    // Get assets for this workstation
    const [assets] = await pool.query(`
      SELECT 
        a.*, 
        c.categoryName, 
        m.modelName, 
        mf.manufName
      FROM 
        assets a
      LEFT JOIN 
        categories c ON a.categoryID = c.categoryID
      LEFT JOIN 
        models m ON a.modelID = m.modelID
      LEFT JOIN 
        manufacturers mf ON m.manufID = mf.manufID
      WHERE 
        a.workStationID = ?
    `, [workstationId]);
    
    // Combine data
    const result = {
      ...workstation[0],
      assets: assets
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching workstation details:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;

/* 
Add this to your server.js file:

const workstationRoutes = require('./routes/workstations');
app.use('/api', workstationRoutes);
*/