// backend/routes/workstations.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const dbConfig = require('../dbjs');

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


// Get all assets
router.get('/assets', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT a.*, c.categoryName, m.modelName, 
             e.empFirstName, e.empLastName, e.empUserName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      LEFT JOIN workstations w ON a.workStationID = w.workStationID
      LEFT JOIN employees e ON w.empID = e.empID
    `);
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// Get asset by ID
router.get('/assets/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT a.*, c.categoryName, m.modelName,
             e.empFirstName, e.empLastName, e.empUserName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      LEFT JOIN workstations w ON a.workStationID = w.workStationID
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE a.assetID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    
    await connection.end();
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// Create new asset
router.post('/assets', async (req, res) => {
  try {
    const { 
      assetName, assetTag, modelID, categoryID, assetStatus, 
      serialNo, workStationID, imagePath, isBorrowed, 
      borrowStartDate, borrowEndDate 
    } = req.body;
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Check if serial number or asset tag already exists
    const [existingAssets] = await connection.execute(`
      SELECT * FROM assets WHERE serialNo = ? OR assetTag = ?
    `, [serialNo, assetTag]);
    
    if (existingAssets.length > 0) {
      await connection.end();
      return res.status(400).json({ 
        error: 'Serial number or asset tag already exists' 
      });
    }
    
    // Insert new asset
    const [result] = await connection.execute(`
      INSERT INTO assets (
        assetName, assetTag, modelID, categoryID, assetStatus, 
        serialNo, workStationID, imagePath, isBorrowed, 
        borrowStartDate, borrowEndDate, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      assetName, assetTag, modelID, categoryID, assetStatus, 
      serialNo, workStationID || null, imagePath || null, 
      isBorrowed ? 1 : 0, borrowStartDate || null, borrowEndDate || null
    ]);
    
    // Get the newly created asset
    const [newAsset] = await connection.execute(`
      SELECT a.*, c.categoryName, m.modelName,
             e.empFirstName, e.empLastName, e.empUserName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      LEFT JOIN workstations w ON a.workStationID = w.workStationID
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE a.assetID = ?
    `, [result.insertId]);
    
    await connection.end();
    res.status(201).json(newAsset[0]);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

// Update asset
router.put('/assets/:id', async (req, res) => {
  try {
    const { 
      assetName, assetTag, modelID, categoryID, assetStatus, 
      serialNo, workStationID, imagePath, isBorrowed, 
      borrowStartDate, borrowEndDate 
    } = req.body;
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Check if serial number or asset tag already exists (excluding current asset)
    if (serialNo || assetTag) {
      const [existingAssets] = await connection.execute(`
        SELECT * FROM assets 
        WHERE (serialNo = ? OR assetTag = ?) AND assetID != ?
      `, [serialNo, assetTag, req.params.id]);
      
      if (existingAssets.length > 0) {
        await connection.end();
        return res.status(400).json({ 
          error: 'Serial number or asset tag already exists' 
        });
      }
    }
    
    // Build dynamic update SQL
    const updateFields = [];
    const updateValues = [];
    
    if (assetName !== undefined) {
      updateFields.push('assetName = ?');
      updateValues.push(assetName);
    }
    
    if (assetTag !== undefined) {
      updateFields.push('assetTag = ?');
      updateValues.push(assetTag);
    }
    
    if (modelID !== undefined) {
      updateFields.push('modelID = ?');
      updateValues.push(modelID);
    }
    
    if (categoryID !== undefined) {
      updateFields.push('categoryID = ?');
      updateValues.push(categoryID);
    }
    
    if (assetStatus !== undefined) {
      updateFields.push('assetStatus = ?');
      updateValues.push(assetStatus);
    }
    
    if (serialNo !== undefined) {
      updateFields.push('serialNo = ?');
      updateValues.push(serialNo);
    }
    
    if (workStationID !== undefined) {
      updateFields.push('workStationID = ?');
      updateValues.push(workStationID || null);
    }
    
    if (imagePath !== undefined) {
      updateFields.push('imagePath = ?');
      updateValues.push(imagePath || null);
    }
    
    if (isBorrowed !== undefined) {
      updateFields.push('isBorrowed = ?');
      updateValues.push(isBorrowed ? 1 : 0);
    }
    
    if (borrowStartDate !== undefined) {
      updateFields.push('borrowStartDate = ?');
      updateValues.push(borrowStartDate || null);
    }
    
    if (borrowEndDate !== undefined) {
      updateFields.push('borrowEndDate = ?');
      updateValues.push(borrowEndDate || null);
    }
    
    updateFields.push('updated_at = NOW()');
    
    // Add the ID to the update values
    updateValues.push(req.params.id);
    
    if (updateFields.length === 0) {
      await connection.end();
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Update the asset
    await connection.execute(`
      UPDATE assets SET ${updateFields.join(', ')} WHERE assetID = ?
    `, updateValues);
    
    // Get the updated asset
    const [updatedAsset] = await connection.execute(`
      SELECT a.*, c.categoryName, m.modelName,
             e.empFirstName, e.empLastName, e.empUserName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      LEFT JOIN workstations w ON a.workStationID = w.workStationID
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE a.assetID = ?
    `, [req.params.id]);
    
    if (updatedAsset.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    await connection.end();
    res.json(updatedAsset[0]);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// Delete asset
router.delete('/assets/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Check if asset exists
    const [asset] = await connection.execute(`
      SELECT * FROM assets WHERE assetID = ?
    `, [req.params.id]);
    
    if (asset.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Delete the asset
    await connection.execute(`
      DELETE FROM assets WHERE assetID = ?
    `, [req.params.id]);
    
    await connection.end();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// Upload image endpoint
router.post('/assets/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  
  const imagePath = req.file.path.replace('public/', '');
  res.json({
    path: imagePath,
    url: `${req.protocol}://${req.get('host')}/${imagePath}`
  });
});

module.exports = router;

/* 
Add this to your server.js file:

const workstationRoutes = require('./routes/workstations');
app.use('/api', workstationRoutes);
*/