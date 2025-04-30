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
{/** 
// ================== EMPLOYEE MANAGEMENT ROUTES ==================

// Get all employees
app.get('/api/employees', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM employees
      ORDER BY empID DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get employee by ID
app.get('/api/employees/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM employees
      WHERE empID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Create new employee
app.post('/api/employees', async (req, res) => {
  try {
    const { 
      empFirstName, 
      empLastName, 
      empUserName, 
      empDept,
      employeeCount,
      employeeStatus,
      created_at,
      updated_at
    } = req.body;
    
    // Check if username already exists
    const [existingEmps] = await db.query(`
      SELECT * FROM employees WHERE empUserName = ?
    `, [empUserName]);
    
    if (existingEmps.length > 0) {
      return res.status(400).json({ 
        errors: { empUserName: 'Username already exists' }
      });
    }
    
    // Insert new employee
    const [result] = await db.query(`
      INSERT INTO employees (
        empFirstName, 
        empLastName, 
        empUserName, 
        empDept,
        employeeCount,
        employeeStatus,
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      empFirstName, 
      empLastName, 
      empUserName, 
      empDept,
      employeeCount || 0,
      employeeStatus || 'active'
    ]);
    
    // Get the newly created employee
    const [newEmployee] = await db.query(`
      SELECT * FROM employees
      WHERE empID = ?
    `, [result.insertId]);
    
    res.status(201).json(newEmployee[0]);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// Update employee
app.put('/api/employees/:id', async (req, res) => {
  try {
    const { 
      empFirstName, 
      empLastName, 
      empUserName, 
      empDept,
      employeeCount,
      employeeStatus
    } = req.body;
    
    // Check if username already exists (excluding current employee)
    if (empUserName) {
      const [existingEmps] = await db.query(`
        SELECT * FROM employees 
        WHERE empUserName = ? AND empID != ?
      `, [empUserName, req.params.id]);
      
      if (existingEmps.length > 0) {
        return res.status(400).json({ 
          errors: { empUserName: 'Username already exists' }
        });
      }
    }
    
    // Build dynamic update SQL
    const updateFields = [];
    const updateValues = [];
    
    if (empFirstName !== undefined) {
      updateFields.push('empFirstName = ?');
      updateValues.push(empFirstName);
    }
    
    if (empLastName !== undefined) {
      updateFields.push('empLastName = ?');
      updateValues.push(empLastName);
    }
    
    if (empUserName !== undefined) {
      updateFields.push('empUserName = ?');
      updateValues.push(empUserName);
    }
    
    if (empDept !== undefined) {
      updateFields.push('empDept = ?');
      updateValues.push(empDept);
    }
    
    if (employeeCount !== undefined) {
      updateFields.push('employeeCount = ?');
      updateValues.push(employeeCount);
    }
    
    if (employeeStatus !== undefined) {
      updateFields.push('employeeStatus = ?');
      updateValues.push(employeeStatus);
    }
    
    updateFields.push('updated_at = NOW()');
    
    // Add the ID to the update values
    updateValues.push(req.params.id);
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Update the employee
    await db.query(`
      UPDATE employees SET ${updateFields.join(', ')} WHERE empID = ?
    `, updateValues);
    
    // Get the updated employee
    const [updatedEmployee] = await db.query(`
      SELECT * FROM employees
      WHERE empID = ?
    `, [req.params.id]);
    
    if (updatedEmployee.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(updatedEmployee[0]);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
  try {
    // Check if employee exists
    const [employee] = await db.query(`
      SELECT * FROM employees WHERE empID = ?
    `, [req.params.id]);
    
    if (employee.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Delete the employee
    await db.query(`
      DELETE FROM employees WHERE empID = ?
    `, [req.params.id]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// Get all departments (for dropdown)
app.get('/api/departments', async (req, res) => {
  try {
    // If you have a departments table, query it
    // If not, send dummy data
    try {
      const [departments] = await db.query('SELECT * FROM departments');
      res.json(departments);
    } catch (err) {
      // Fallback if the table doesn't exist
      res.json([
        { deptID: 1, deptName: 'IT' },
        { deptID: 2, deptName: 'HR' },
        { deptID: 3, deptName: 'Finance' },
        { deptID: 4, deptName: 'Marketing' },
        { deptID: 5, deptName: 'Operations' },
        { deptID: 6, deptName: 'Alliance IT Department - Intern' }
      ]);
    }
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Keep track of deleted employee IDs
app.get('/api/employees/next-available-id', async (req, res) => {
  try {
    // First, check if there are any gaps in the ID sequence
    const [result] = await db.query(`
      SELECT empID + 1 as next_id
      FROM employees e1
      WHERE NOT EXISTS (
        SELECT 1 FROM employees e2 WHERE e2.empID = e1.empID + 1
      )
      ORDER BY empID
      LIMIT 1
    `);

    // If there's a gap, return the first available ID
    if (result.length > 0) {
      return res.json({ nextId: result[0].next_id });
    }

    // If no gaps, get the maximum ID and return the next one
    const [maxResult] = await db.query(`
      SELECT IFNULL(MAX(empID), 0) + 1 as next_id
      FROM employees
    `);

    res.json({ nextId: maxResult[0].next_id });
  } catch (error) {
    console.error('Error finding next available ID:', error);
    res.status(500).json({ error: 'Failed to determine next available ID' });
  }
}); */}

// ================== EMPLOYEE MANAGEMENT ROUTES ==================

// Get all employees
app.get('/api/employees', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM employees
      ORDER BY empID DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get employee by ID
app.get('/api/employees/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM employees
      WHERE empID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Create new employee
app.post('/api/employees', async (req, res) => {
  try {
    const { 
      empFirstName, 
      empLastName, 
      empUserName, 
      empDept,
      employeeCount,
      employeeStatus
    } = req.body;
    
    // Check if username already exists
    const [existingEmps] = await db.query(`
      SELECT * FROM employees WHERE empUserName = ?
    `, [empUserName]);
    
    if (existingEmps.length > 0) {
      return res.status(400).json({ 
        errors: { empUserName: 'Username already exists' }
      });
    }
    
    // Insert new employee
    const [result] = await db.query(`
      INSERT INTO employees (
        empFirstName, 
        empLastName, 
        empUserName, 
        empDept,
        employeeCount,
        employeeStatus,
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      empFirstName, 
      empLastName, 
      empUserName, 
      empDept,
      employeeCount || 0,
      employeeStatus || 'active'
    ]);
    
    // Get the newly created employee
    const [newEmployee] = await db.query(`
      SELECT * FROM employees
      WHERE empID = ?
    `, [result.insertId]);
    
    res.status(201).json(newEmployee[0]);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ 
      error: 'Failed to create employee',
      message: error.message
    });
  }
});

// Update employee
app.put('/api/employees/:id', async (req, res) => {
  try {
    const { 
      empFirstName, 
      empLastName, 
      empUserName, 
      empDept,
      employeeCount,
      employeeStatus
    } = req.body;
    
    // Check if username already exists (excluding current employee)
    if (empUserName) {
      const [existingEmps] = await db.query(`
        SELECT * FROM employees 
        WHERE empUserName = ? AND empID != ?
      `, [empUserName, req.params.id]);
      
      if (existingEmps.length > 0) {
        return res.status(400).json({ 
          errors: { empUserName: 'Username already exists' }
        });
      }
    }
    
    // Build dynamic update SQL
    const updateFields = [];
    const updateValues = [];
    
    if (empFirstName !== undefined) {
      updateFields.push('empFirstName = ?');
      updateValues.push(empFirstName);
    }
    
    if (empLastName !== undefined) {
      updateFields.push('empLastName = ?');
      updateValues.push(empLastName);
    }
    
    if (empUserName !== undefined) {
      updateFields.push('empUserName = ?');
      updateValues.push(empUserName);
    }
    
    if (empDept !== undefined) {
      updateFields.push('empDept = ?');
      updateValues.push(empDept);
    }
    
    if (employeeCount !== undefined) {
      updateFields.push('employeeCount = ?');
      updateValues.push(employeeCount);
    }
    
    if (employeeStatus !== undefined) {
      updateFields.push('employeeStatus = ?');
      updateValues.push(employeeStatus);
    }
    
    // Always update the updated_at timestamp
    updateFields.push('updated_at = NOW()');
    
    // Add the ID to the update values
    updateValues.push(req.params.id);
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Update the employee
    await db.query(`
      UPDATE employees SET ${updateFields.join(', ')} WHERE empID = ?
    `, updateValues);
    
    // Get the updated employee
    const [updatedEmployee] = await db.query(`
      SELECT * FROM employees
      WHERE empID = ?
    `, [req.params.id]);
    
    if (updatedEmployee.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(updatedEmployee[0]);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
  try {
    // Check if employee exists
    const [employee] = await db.query(`
      SELECT * FROM employees WHERE empID = ?
    `, [req.params.id]);
    
    if (employee.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Delete the employee
    await db.query(`
      DELETE FROM employees WHERE empID = ?
    `, [req.params.id]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// Get all departments (for dropdown)
app.get('/api/departments', async (req, res) => {
  try {
    // If you have a departments table, query it
    // If not, send dummy data
    try {
      const [departments] = await db.query('SELECT * FROM departments');
      if (departments.length > 0) {
        res.json(departments);
      } else {
        throw new Error('No departments found');
      }
    } catch (err) {
      // Fallback if the table doesn't exist or is empty
      res.json([
        { deptID: 1, deptName: 'IT' },
        { deptID: 2, deptName: 'HR' },
        { deptID: 3, deptName: 'Finance' },
        { deptID: 4, deptName: 'Marketing' },
        { deptID: 5, deptName: 'Operations' },
        { deptID: 6, deptName: 'Alliance IT Department - Intern' },
        { deptID: 7, deptName: 'Accounting' },
        { deptID: 8, deptName: 'Broker Experience' },
        { deptID: 9, deptName: 'Escalation' },
        { deptID: 10, deptName: 'AU Accounts' },
        { deptID: 11, deptName: 'PHD' },
        { deptID: 12, deptName: 'Source' },
        { deptID: 13, deptName: 'Data Entry' },
        { deptID: 14, deptName: 'QA Packaging' },
        { deptID: 15, deptName: 'Credit' },
        { deptID: 16, deptName: 'Client Care' },
        { deptID: 17, deptName: 'Admin' },
        { deptID: 18, deptName: 'Training' }
      ]);
    }
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});


// ================== CATEGORY MANAGEMENT ROUTES ==================

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM categories
      ORDER BY categoryID DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get category by ID
app.get('/api/categories/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM categories
      WHERE categoryID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create new category
app.post('/api/categories', async (req, res) => {
  try {
    const { 
      categoryName, 
      categoryType,
      categoryCount
    } = req.body;
    
    // Check if category already exists
    const [existingCats] = await db.query(`
      SELECT * FROM categories WHERE categoryName = ? AND categoryType = ?
    `, [categoryName, categoryType]);
    
    if (existingCats.length > 0) {
      return res.status(400).json({ 
        errors: { categoryName: 'Category with this name and type already exists' }
      });
    }
    
    // Insert new category
    const [result] = await db.query(`
      INSERT INTO categories (
        categoryName, 
        categoryType, 
        categoryCount, 
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, NOW(), NOW())
    `, [
      categoryName, 
      categoryType, 
      categoryCount || 0
    ]);
    
    // Get the newly created category
    const [newCategory] = await db.query(`
      SELECT * FROM categories
      WHERE categoryID = ?
    `, [result.insertId]);
    
    res.status(201).json(newCategory[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ 
      error: 'Failed to create category',
      message: error.message
    });
  }
});

// Update category
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { 
      categoryName, 
      categoryType
    } = req.body;
    
    // Check if category already exists (excluding current category)
    if (categoryName && categoryType) {
      const [existingCats] = await db.query(`
        SELECT * FROM categories 
        WHERE categoryName = ? AND categoryType = ? AND categoryID != ?
      `, [categoryName, categoryType, req.params.id]);
      
      if (existingCats.length > 0) {
        return res.status(400).json({ 
          errors: { categoryName: 'Category with this name and type already exists' }
        });
      }
    }
    
    // Build dynamic update SQL
    const updateFields = [];
    const updateValues = [];
    
    if (categoryName !== undefined) {
      updateFields.push('categoryName = ?');
      updateValues.push(categoryName);
    }
    
    if (categoryType !== undefined) {
      updateFields.push('categoryType = ?');
      updateValues.push(categoryType);
    }
    
    // Always update the updated_at timestamp
    updateFields.push('updated_at = NOW()');
    
    // Add the ID to the update values
    updateValues.push(req.params.id);
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Update the category
    await db.query(`
      UPDATE categories SET ${updateFields.join(', ')} WHERE categoryID = ?
    `, updateValues);
    
    // Get the updated category
    const [updatedCategory] = await db.query(`
      SELECT * FROM categories
      WHERE categoryID = ?
    `, [req.params.id]);
    
    if (updatedCategory.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(updatedCategory[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
app.delete('/api/categories/:id', async (req, res) => {
  try {
    // Check if category exists
    const [category] = await db.query(`
      SELECT * FROM categories WHERE categoryID = ?
    `, [req.params.id]);
    
    if (category.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Delete the category
    await db.query(`
      DELETE FROM categories WHERE categoryID = ?
    `, [req.params.id]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Update category count (for when assets get assigned to a category)
app.patch('/api/categories/:id/count', async (req, res) => {
  try {
    const { count } = req.body;
    
    if (count === undefined) {
      return res.status(400).json({ error: 'Count is required' });
    }
    
    // Update the category count
    await db.query(`
      UPDATE categories 
      SET categoryCount = ?, 
          updated_at = NOW() 
      WHERE categoryID = ?
    `, [count, req.params.id]);
    
    // Get the updated category
    const [updatedCategory] = await db.query(`
      SELECT * FROM categories
      WHERE categoryID = ?
    `, [req.params.id]);
    
    if (updatedCategory.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(updatedCategory[0]);
  } catch (error) {
    console.error('Error updating category count:', error);
    res.status(500).json({ error: 'Failed to update category count' });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});