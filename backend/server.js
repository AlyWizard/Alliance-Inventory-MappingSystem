// In backend/server.js
const express = require('express');
const cors = require('cors');
const db = require('./db'); // Updated to match your file name
require('dotenv').config();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, 'public/uploads/assets');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'asset-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
});

app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

app.get('/', (req, res) => {
  res.send('Backend is running! API is available at /api');
});

// Existing user routes
app.get('/api/users', async (req, res) => {
  try {
    const [users] = await db.query('SELECT userID AS id, username, created_at, updated_at FROM users');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, password, created_at, updated_at } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, password, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, created_at, updated_at]
    );
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, updated_at } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'UPDATE users SET username = ?, password = ?, updated_at = ? WHERE userID = ?',
      [username, hashedPassword, updated_at, id]
    );
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.headers['current-user-id'];

  if (parseInt(currentUserId) === parseInt(id)) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }

  try {
    await db.query('DELETE FROM users WHERE userID = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.userID,
        username: user.username
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ================== ASSET MANAGEMENT ROUTES ==================

// Get all assets
app.get('/api/assets', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, c.categoryName, m.modelName, 
             e.empFirstName, e.empLastName, e.empUserName,
             w.modelName as workstationName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      LEFT JOIN workstations w ON a.workStationID = w.workStationID
      LEFT JOIN employees e ON w.empID = e.empID
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// Get asset by ID
app.get('/api/assets/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, c.categoryName, m.modelName,
             e.empFirstName, e.empLastName, e.empUserName,
             w.modelName as workstationName
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
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// Create new asset
app.post('/api/assets', async (req, res) => {
  try {
    const { 
      assetName, assetTag, modelID, categoryID, assetStatus, 
      serialNo, workStationID, imagePath, isBorrowed, 
      borrowStartDate, borrowEndDate 
    } = req.body;
    
    // Check if serial number or asset tag already exists
    const [existingAssets] = await db.query(`
      SELECT * FROM assets WHERE serialNo = ? OR assetTag = ?
    `, [serialNo, assetTag]);
    
    if (existingAssets.length > 0) {
      return res.status(400).json({ 
        error: 'Serial number or asset tag already exists' 
      });
    }
    
    // Insert new asset
    const [result] = await db.query(`
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
    const [newAsset] = await db.query(`
      SELECT a.*, c.categoryName, m.modelName,
             e.empFirstName, e.empLastName, e.empUserName,
             w.modelName as workstationName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      LEFT JOIN workstations w ON a.workStationID = w.workStationID
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE a.assetID = ?
    `, [result.insertId]);
    
    res.status(201).json(newAsset[0]);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

// Update asset
app.put('/api/assets/:id', async (req, res) => {
  try {
    const { 
      assetName, assetTag, modelID, categoryID, assetStatus, 
      serialNo, workStationID, imagePath, isBorrowed, 
      borrowStartDate, borrowEndDate 
    } = req.body;
    
    // Check if serial number or asset tag already exists (excluding current asset)
    if (serialNo || assetTag) {
      const [existingAssets] = await db.query(`
        SELECT * FROM assets 
        WHERE (serialNo = ? OR assetTag = ?) AND assetID != ?
      `, [serialNo, assetTag, req.params.id]);
      
      if (existingAssets.length > 0) {
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
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Update the asset
    await db.query(`
      UPDATE assets SET ${updateFields.join(', ')} WHERE assetID = ?
    `, updateValues);
    
    // Get the updated asset
    const [updatedAsset] = await db.query(`
      SELECT a.*, c.categoryName, m.modelName,
             e.empFirstName, e.empLastName, e.empUserName,
             w.modelName as workstationName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      LEFT JOIN workstations w ON a.workStationID = w.workStationID
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE a.assetID = ?
    `, [req.params.id]);
    
    if (updatedAsset.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(updatedAsset[0]);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// Delete asset
app.delete('/api/assets/:id', async (req, res) => {
  try {
    // Check if asset exists
    const [asset] = await db.query(`
      SELECT * FROM assets WHERE assetID = ?
    `, [req.params.id]);
    
    if (asset.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Delete the asset
    await db.query(`
      DELETE FROM assets WHERE assetID = ?
    `, [req.params.id]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// Upload image endpoint
app.post('/api/assets/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  
  const imagePath = req.file.path.replace('public/', '');
  res.json({
    path: imagePath,
    url: `${req.protocol}://${req.get('host')}/${imagePath}`
  });
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get all models
app.get('/api/models', async (req, res) => {
  try {
    const [models] = await db.query(`
      SELECT m.*, mf.manufName
      FROM models m
      LEFT JOIN manufacturers mf ON m.manufID = mf.manufID
    `);
    res.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// Get all employees
app.get('/api/employees', async (req, res) => {
  try {
    const [employees] = await db.query('SELECT * FROM employees');
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get workstations for an employee
app.get('/api/employees/:id/workstations', async (req, res) => {
  try {
    const [workstations] = await db.query(`
      SELECT * FROM workstations WHERE empID = ?
    `, [req.params.id]);
    res.json(workstations);
  } catch (error) {
    console.error('Error fetching workstations:', error);
    res.status(500).json({ error: 'Failed to fetch workstations' });
  }
});

// Create workstation
app.post('/api/workstations', async (req, res) => {
  try {
    const { modelName, empID } = req.body;
    
    const [result] = await db.query(`
      INSERT INTO workstations (
        modelName, empID, created_at, updated_at
      ) VALUES (?, ?, NOW(), NOW())
    `, [modelName, empID]);
    
    const [newWorkstation] = await db.query(`
      SELECT * FROM workstations WHERE workStationID = ?
    `, [result.insertId]);
    
    res.status(201).json(newWorkstation[0]);
  } catch (error) {
    console.error('Error creating workstation:', error);
    res.status(500).json({ error: 'Failed to create workstation' });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});