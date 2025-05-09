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
// If your images are in /backend/public/uploads/assets
app.use(express.static(path.join(__dirname, 'public')));


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
// Upload image endpoint
app.post('/api/assets/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  
  // Extract just the filename and folder structure without the full path
  const relativePath = req.file.path.substring(req.file.path.indexOf('uploads'));
  
  res.json({
    path: relativePath,
    url: `${req.protocol}://${req.get('host')}/${relativePath}`
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

// ================== MANUFACTURER MANAGEMENT ROUTES ==================

// Add these routes to your server.js file

// Get all manufacturers
app.get('/api/manufacturers', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM manufacturers
      ORDER BY manufID DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    res.status(500).json({ error: 'Failed to fetch manufacturers' });
  }
});

// Get manufacturer by ID
app.get('/api/manufacturers/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM manufacturers
      WHERE manufID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      res.status(404).json({ error: 'Manufacturer not found' });
      return;
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching manufacturer:', error);
    res.status(500).json({ error: 'Failed to fetch manufacturer' });
  }
});

// Create new manufacturer
app.post('/api/manufacturers', async (req, res) => {
  try {
    const { 
      manufName, 
      manufacturerCount
    } = req.body;
    
    // Check if manufacturer already exists
    const [existingManuf] = await db.query(`
      SELECT * FROM manufacturers WHERE manufName = ?
    `, [manufName]);
    
    if (existingManuf.length > 0) {
      return res.status(400).json({ 
        errors: { manufName: 'Manufacturer with this name already exists' }
      });
    }
    
    // Insert new manufacturer
    const [result] = await db.query(`
      INSERT INTO manufacturers (
        manufName, 
        manufacturerCount,
        created_at, 
        updated_at
      ) VALUES (?, ?, NOW(), NOW())
    `, [
      manufName, 
      manufacturerCount || 0
    ]);
    
    // Get the newly created manufacturer
    const [newManufacturer] = await db.query(`
      SELECT * FROM manufacturers
      WHERE manufID = ?
    `, [result.insertId]);
    
    res.status(201).json(newManufacturer[0]);
  } catch (error) {
    console.error('Error creating manufacturer:', error);
    res.status(500).json({ 
      error: 'Failed to create manufacturer',
      message: error.message
    });
  }
});

// Update manufacturer
app.put('/api/manufacturers/:id', async (req, res) => {
  try {
    const { 
      manufName, 
      manufacturerCount
    } = req.body;
    
    // Check if manufacturer already exists (excluding current manufacturer)
    if (manufName) {
      const [existingManuf] = await db.query(`
        SELECT * FROM manufacturers 
        WHERE manufName = ? AND manufID != ?
      `, [manufName, req.params.id]);
      
      if (existingManuf.length > 0) {
        return res.status(400).json({ 
          errors: { manufName: 'Manufacturer with this name already exists' }
        });
      }
    }
    
    // Build dynamic update SQL
    const updateFields = [];
    const updateValues = [];
    
    if (manufName !== undefined) {
      updateFields.push('manufName = ?');
      updateValues.push(manufName);
    }
    
    if (manufacturerCount !== undefined) {
      updateFields.push('manufacturerCount = ?');
      updateValues.push(manufacturerCount);
    }
    
    // Always update the updated_at timestamp
    updateFields.push('updated_at = NOW()');
    
    // Add the ID to the update values
    updateValues.push(req.params.id);
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Update the manufacturer
    await db.query(`
      UPDATE manufacturers SET ${updateFields.join(', ')} WHERE manufID = ?
    `, updateValues);
    
    // Get the updated manufacturer
    const [updatedManufacturer] = await db.query(`
      SELECT * FROM manufacturers
      WHERE manufID = ?
    `, [req.params.id]);
    
    if (updatedManufacturer.length === 0) {
      return res.status(404).json({ error: 'Manufacturer not found' });
    }
    
    res.json(updatedManufacturer[0]);
  } catch (error) {
    console.error('Error updating manufacturer:', error);
    res.status(500).json({ error: 'Failed to update manufacturer' });
  }
});

// Delete manufacturer
app.delete('/api/manufacturers/:id', async (req, res) => {
  try {
    // Check if manufacturer exists
    const [manufacturer] = await db.query(`
      SELECT * FROM manufacturers WHERE manufID = ?
    `, [req.params.id]);
    
    if (manufacturer.length === 0) {
      return res.status(404).json({ error: 'Manufacturer not found' });
    }
    
    // Check if manufacturer is referenced by any models
    const [models] = await db.query(`
      SELECT COUNT(*) as count FROM models WHERE manufID = ?
    `, [req.params.id]);
    
    if (models[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete manufacturer because it is referenced by one or more models'
      });
    }
    
    // Delete the manufacturer
    await db.query(`
      DELETE FROM manufacturers WHERE manufID = ?
    `, [req.params.id]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting manufacturer:', error);
    res.status(500).json({ error: 'Failed to delete manufacturer' });
  }
});

// Update manufacturer count (for when models get assigned to a manufacturer)
app.patch('/api/manufacturers/:id/count', async (req, res) => {
  try {
    const { count } = req.body;
    
    if (count === undefined) {
      return res.status(400).json({ error: 'Count is required' });
    }
    
    // Update the manufacturer count
    await db.query(`
      UPDATE manufacturers 
      SET manufacturerCount = ?, 
          updated_at = NOW() 
      WHERE manufID = ?
    `, [count, req.params.id]);
    
    // Get the updated manufacturer
    const [updatedManufacturer] = await db.query(`
      SELECT * FROM manufacturers
      WHERE manufID = ?
    `, [req.params.id]);
    
    if (updatedManufacturer.length === 0) {
      return res.status(404).json({ error: 'Manufacturer not found' });
    }
    
    res.json(updatedManufacturer[0]);
  } catch (error) {
    console.error('Error updating manufacturer count:', error);
    res.status(500).json({ error: 'Failed to update manufacturer count' });
  }
});

// ================== MODEL MANAGEMENT ROUTES ==================

// Add these routes to your server.js file

// Get all models
app.get('/api/models', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, c.categoryName, mf.manufName
      FROM models m
      LEFT JOIN categories c ON m.categoryID = c.categoryID
      LEFT JOIN manufacturers mf ON m.manufID = mf.manufID
      ORDER BY m.modelID DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// Get model by ID
app.get('/api/models/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.*, c.categoryName, mf.manufName
      FROM models m
      LEFT JOIN categories c ON m.categoryID = c.categoryID
      LEFT JOIN manufacturers mf ON m.manufID = mf.manufID
      WHERE m.modelID = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      res.status(404).json({ error: 'Model not found' });
      return;
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching model:', error);
    res.status(500).json({ error: 'Failed to fetch model' });
  }
});

// Create new model
app.post('/api/models', async (req, res) => {
  try {
    const { 
      modelName, 
      manufID,
      categoryID,
      modelCount
    } = req.body;
    
    // Validate required fields
    if (!modelName) {
      return res.status(400).json({ errors: { modelName: 'Model name is required' } });
    }
    if (!manufID) {
      return res.status(400).json({ errors: { manufID: 'Manufacturer ID is required' } });
    }
    if (!categoryID) {
      return res.status(400).json({ errors: { categoryID: 'Category ID is required' } });
    }
    
    // Check if model already exists
    const [existingModels] = await db.query(`
      SELECT * FROM models 
      WHERE modelName = ? AND manufID = ? AND categoryID = ?
    `, [modelName, manufID, categoryID]);
    
    if (existingModels.length > 0) {
      return res.status(400).json({ 
        errors: { modelName: 'Model with this name, manufacturer and category already exists' }
      });
    }
    
    // Insert new model
    const [result] = await db.query(`
      INSERT INTO models (
        modelName, 
        manufID,
        categoryID,
        modelCount,
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [
      modelName, 
      manufID,
      categoryID,
      modelCount || 0
    ]);
    
    // Update manufacturer count
    await updateManufacturerCount(manufID);
    
    // Update category count
    await updateCategoryCount(categoryID);
    
    // Get the newly created model with related data
    const [newModel] = await db.query(`
      SELECT m.*, c.categoryName, mf.manufName
      FROM models m
      LEFT JOIN categories c ON m.categoryID = c.categoryID
      LEFT JOIN manufacturers mf ON m.manufID = mf.manufID
      WHERE m.modelID = ?
    `, [result.insertId]);
    
    res.status(201).json(newModel[0]);
  } catch (error) {
    console.error('Error creating model:', error);
    res.status(500).json({ 
      error: 'Failed to create model',
      message: error.message
    });
  }
});

// Update model
app.put('/api/models/:id', async (req, res) => {
  try {
    const { 
      modelName, 
      manufID,
      categoryID,
      modelCount
    } = req.body;
    
    // Get original model data for comparison
    const [originalModel] = await db.query(`
      SELECT * FROM models WHERE modelID = ?
    `, [req.params.id]);
    
    if (originalModel.length === 0) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    const oldManufID = originalModel[0].manufID;
    const oldCategoryID = originalModel[0].categoryID;
    
    // Check if model already exists (excluding current model)
    if (modelName && manufID && categoryID) {
      const [existingModels] = await db.query(`
        SELECT * FROM models 
        WHERE modelName = ? AND manufID = ? AND categoryID = ? AND modelID != ?
      `, [modelName, manufID, categoryID, req.params.id]);
      
      if (existingModels.length > 0) {
        return res.status(400).json({ 
          errors: { modelName: 'Model with this name, manufacturer and category already exists' }
        });
      }
    }
    
    // Build dynamic update SQL
    const updateFields = [];
    const updateValues = [];
    
    if (modelName !== undefined) {
      updateFields.push('modelName = ?');
      updateValues.push(modelName);
    }
    
    if (manufID !== undefined) {
      updateFields.push('manufID = ?');
      updateValues.push(manufID);
    }
    
    if (categoryID !== undefined) {
      updateFields.push('categoryID = ?');
      updateValues.push(categoryID);
    }
    
    if (modelCount !== undefined) {
      updateFields.push('modelCount = ?');
      updateValues.push(modelCount);
    }
    
    // Always update the updated_at timestamp
    updateFields.push('updated_at = NOW()');
    
    // Add the ID to the update values
    updateValues.push(req.params.id);
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Update the model
    await db.query(`
      UPDATE models SET ${updateFields.join(', ')} WHERE modelID = ?
    `, updateValues);
    
    // If manufacturer changed, update counts for both old and new manufacturers
    if (manufID !== undefined && manufID !== oldManufID) {
      await updateManufacturerCount(manufID);
      await updateManufacturerCount(oldManufID);
    }
    
    // If category changed, update counts for both old and new categories
    if (categoryID !== undefined && categoryID !== oldCategoryID) {
      await updateCategoryCount(categoryID);
      await updateCategoryCount(oldCategoryID);
    }
    
    // Get the updated model with related data
    const [updatedModel] = await db.query(`
      SELECT m.*, c.categoryName, mf.manufName
      FROM models m
      LEFT JOIN categories c ON m.categoryID = c.categoryID
      LEFT JOIN manufacturers mf ON m.manufID = mf.manufID
      WHERE m.modelID = ?
    `, [req.params.id]);
    
    if (updatedModel.length === 0) {
      return res.status(404).json({ error: 'Model not found after update' });
    }
    
    res.json(updatedModel[0]);
  } catch (error) {
    console.error('Error updating model:', error);
    res.status(500).json({ error: 'Failed to update model' });
  }
});

// Delete model
app.delete('/api/models/:id', async (req, res) => {
  try {
    // Check if model exists
    const [model] = await db.query(`
      SELECT * FROM models WHERE modelID = ?
    `, [req.params.id]);
    
    if (model.length === 0) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    const modelData = model[0];
    
    // Check if model is referenced by any assets
    const [assets] = await db.query(`
      SELECT COUNT(*) as count FROM assets WHERE modelID = ?
    `, [req.params.id]);
    
    if (assets[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete model because it is referenced by one or more assets'
      });
    }
    
    // Delete the model
    await db.query(`
      DELETE FROM models WHERE modelID = ?
    `, [req.params.id]);
    
    // Update manufacturer count
    await updateManufacturerCount(modelData.manufID);
    
    // Update category count
    await updateCategoryCount(modelData.categoryID);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({ error: 'Failed to delete model' });
  }
});

// Helper function to update manufacturer model count
async function updateManufacturerCount(manufID) {
  try {
    // Count models with this manufacturer
    const [result] = await db.query(`
      SELECT COUNT(*) as count FROM models WHERE manufID = ?
    `, [manufID]);
    
    // Update manufacturer count
    await db.query(`
      UPDATE manufacturers 
      SET manufacturerCount = ?, updated_at = NOW() 
      WHERE manufID = ?
    `, [result[0].count, manufID]);
  } catch (error) {
    console.error('Error updating manufacturer count:', error);
  }
}

// Helper function to update category model count
async function updateCategoryCount(categoryID) {
  try {
    // Count models with this category
    const [result] = await db.query(`
      SELECT COUNT(*) as count FROM models WHERE categoryID = ?
    `, [categoryID]);
    
    // Update category count
    await db.query(`
      UPDATE categories 
      SET categoryCount = ?, updated_at = NOW() 
      WHERE categoryID = ?
    `, [result[0].count, categoryID]);
  } catch (error) {
    console.error('Error updating category count:', error);
  }
}

// Get assets assigned to an employee
app.get('/api/employees/:id/assets', async (req, res) => {
  try {
    const empId = req.params.id;
    
    // Find all workstations for the employee
    const [workstations] = await db.query(`
      SELECT workStationID FROM workstations WHERE empID = ?
    `, [empId]);
    
    if (workstations.length === 0) {
      // If no workstations, return empty array
      return res.json([]);
    }
    
    // Get IDs of all workstations
    const workstationIds = workstations.map(ws => ws.workStationID);
    
    // Find all assets assigned to any of the employee's workstations
    const [assets] = await db.query(`
      SELECT a.*, c.categoryName, m.modelName, 
             e.empFirstName, e.empLastName, e.empUserName,
             w.modelName as workstationName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      LEFT JOIN workstations w ON a.workStationID = w.workStationID
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE a.workStationID IN (?)
    `, [workstationIds]);
    
    res.json(assets);
  } catch (error) {
    console.error('Error fetching employee assets:', error);
    res.status(500).json({ error: 'Failed to fetch employee assets' });
  }
});

// Bulk update assets (for assigning/unassigning multiple assets at once)
app.post('/api/assets/bulk-update', async (req, res) => {
  try {
    const { assetIds, updates } = req.body;
    
    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return res.status(400).json({ error: 'Asset IDs are required' });
    }
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Updates object is required' });
    }
    
    // Build dynamic update SQL
    const updateFields = [];
    const updateValues = [];
    
    if (updates.workStationID !== undefined) {
      updateFields.push('workStationID = ?');
      updateValues.push(updates.workStationID || null);
    }
    
    if (updates.assetStatus !== undefined) {
      updateFields.push('assetStatus = ?');
      updateValues.push(updates.assetStatus);
    }
    
    if (updates.isBorrowed !== undefined) {
      updateFields.push('isBorrowed = ?');
      updateValues.push(updates.isBorrowed ? 1 : 0);
    }
    
    // Always update the updated_at timestamp
    updateFields.push('updated_at = NOW()');
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Update all assets in the list
    await db.query(`
      UPDATE assets 
      SET ${updateFields.join(', ')} 
      WHERE assetID IN (?)
    `, [...updateValues, assetIds]);
    
    // Get the updated assets
    const [updatedAssets] = await db.query(`
      SELECT a.*, c.categoryName, m.modelName,
             e.empFirstName, e.empLastName, e.empUserName,
             w.modelName as workstationName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      LEFT JOIN workstations w ON a.workStationID = w.workStationID
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE a.assetID IN (?)
    `, [assetIds]);
    
    res.json(updatedAssets);
  } catch (error) {
    console.error('Error updating assets in bulk:', error);
    res.status(500).json({ error: 'Failed to update assets in bulk' });
  }
});

// Unassign assets (remove them from a workstation)
app.post('/api/assets/unassign', async (req, res) => {
  try {
    const { assetIds } = req.body;
    
    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return res.status(400).json({ error: 'Asset IDs are required' });
    }
    
    // Update all assets in the list to remove workstation assignment
    await db.query(`
      UPDATE assets 
      SET workStationID = NULL, 
          assetStatus = 'Ready to Deploy',
          updated_at = NOW() 
      WHERE assetID IN (?)
    `, [assetIds]);
    
    // Get the updated assets
    const [updatedAssets] = await db.query(`
      SELECT a.*, c.categoryName, m.modelName,
             e.empFirstName, e.empLastName, e.empUserName,
             w.modelName as workstationName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      LEFT JOIN workstations w ON a.workStationID = w.workStationID
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE a.assetID IN (?)
    `, [assetIds]);
    
    res.json(updatedAssets);
  } catch (error) {
    console.error('Error unassigning assets:', error);
    res.status(500).json({ error: 'Failed to unassign assets' });
  }
});

// Get all available (unassigned) assets
app.get('/api/assets/available', async (req, res) => {
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
      WHERE a.workStationID IS NULL
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching available assets:', error);
    res.status(500).json({ error: 'Failed to fetch available assets' });
  }
});

// Transfer assets between workstations
app.post('/api/assets/transfer', async (req, res) => {
  try {
    const { assetIds, fromWorkstationId, toWorkstationId, assetStatus } = req.body;
    
    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return res.status(400).json({ error: 'Asset IDs are required' });
    }
    
    if (!toWorkstationId) {
      return res.status(400).json({ error: 'Destination workstation ID is required' });
    }
    
    // Verify all assets are currently in the fromWorkstationId (if provided)
    if (fromWorkstationId) {
      const [assetsCheck] = await db.query(`
        SELECT COUNT(*) as count
        FROM assets 
        WHERE assetID IN (?) AND workStationID = ?
      `, [assetIds, fromWorkstationId]);
      
      if (assetsCheck[0].count !== assetIds.length) {
        return res.status(400).json({ 
          error: 'Some assets are not assigned to the specified source workstation'
        });
      }
    }
    
    // Update all assets in the list to transfer to the new workstation
    await db.query(`
      UPDATE assets 
      SET workStationID = ?, 
          assetStatus = ?,
          updated_at = NOW() 
      WHERE assetID IN (?)
    `, [toWorkstationId, assetStatus || 'Onsite', assetIds]);
    
    // Get the updated assets
    const [updatedAssets] = await db.query(`
      SELECT a.*, c.categoryName, m.modelName,
             e.empFirstName, e.empLastName, e.empUserName,
             w.modelName as workstationName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      LEFT JOIN workstations w ON a.workStationID = w.workStationID
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE a.assetID IN (?)
    `, [assetIds]);
    
    res.json(updatedAssets);
  } catch (error) {
    console.error('Error transferring assets:', error);
    res.status(500).json({ error: 'Failed to transfer assets' });
  }
});

// Add these routes to your existing server.js file

// Assign assets to a workstation
app.post('/api/assets/assign', async (req, res) => {
  try {
    const { assetIds, workStationID, assetStatus } = req.body;
    
    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return res.status(400).json({ error: 'Asset IDs are required' });
    }
    
    if (!workStationID) {
      return res.status(400).json({ error: 'Workstation ID is required' });
    }
    
    // Check if the workstation exists
    const [workstation] = await db.query(
      'SELECT * FROM workstations WHERE workStationID = ?',
      [workStationID]
    );
    
    if (workstation.length === 0) {
      return res.status(404).json({ error: 'Workstation not found' });
    }
    
    // Check if any assets are already assigned
    const [assignedAssets] = await db.query(
      'SELECT * FROM assets WHERE assetID IN (?) AND workStationID IS NOT NULL',
      [assetIds]
    );
    
    if (assignedAssets.length > 0) {
      return res.status(400).json({ 
        error: 'Some assets are already assigned to other workstations',
        assignedAssets: assignedAssets
      });
    }
    
    // Assign assets to the workstation
    await db.query(
      'UPDATE assets SET workStationID = ?, assetStatus = ?, updated_at = NOW() WHERE assetID IN (?)',
      [workStationID, assetStatus || 'Onsite', assetIds]
    );
    
    // Get the updated assets
    const [updatedAssets] = await db.query(`
      SELECT a.*, c.categoryName, m.modelName,
             e.empFirstName, e.empLastName, e.empUserName,
             w.modelName as workstationName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      LEFT JOIN workstations w ON a.workStationID = w.workStationID
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE a.assetID IN (?)
    `, [assetIds]);
    
    res.json(updatedAssets);
  } catch (error) {
    console.error('Error assigning assets:', error);
    res.status(500).json({ error: 'Failed to assign assets' });
  }
});

// Unassign assets from their workstations
app.post('/api/assets/unassign', async (req, res) => {
  try {
    const { assetIds } = req.body;
    
    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return res.status(400).json({ error: 'Asset IDs are required' });
    }
    
    // Unassign assets
    await db.query(
      'UPDATE assets SET workStationID = NULL, assetStatus = "Ready to Deploy", updated_at = NOW() WHERE assetID IN (?)',
      [assetIds]
    );
    
    // Get the updated assets
    const [updatedAssets] = await db.query(`
      SELECT a.*, c.categoryName, m.modelName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      WHERE a.assetID IN (?)
    `, [assetIds]);
    
    res.json(updatedAssets);
  } catch (error) {
    console.error('Error unassigning assets:', error);
    res.status(500).json({ error: 'Failed to unassign assets' });
  }
});

// Get workstations for an employee
app.get('/api/employees/:id/workstations', async (req, res) => {
  try {
    const [workstations] = await db.query(
      'SELECT * FROM workstations WHERE empID = ?',
      [req.params.id]
    );
    
    res.json(workstations);
  } catch (error) {
    console.error('Error fetching workstations:', error);
    res.status(500).json({ error: 'Failed to fetch workstations' });
  }
});

// Create a workstation
app.post('/api/workstations', async (req, res) => {
  try {
    const { modelName, empID } = req.body;
    
    if (!modelName) {
      return res.status(400).json({ error: 'Workstation name is required' });
    }
    
    if (!empID) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }
    
    // Check if employee exists
    const [employee] = await db.query(
      'SELECT * FROM employees WHERE empID = ?',
      [empID]
    );
    
    if (employee.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Create workstation
    const [result] = await db.query(
      'INSERT INTO workstations (modelName, empID, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [modelName, empID]
    );
    
    // Get the created workstation
    const [workstation] = await db.query(
      'SELECT * FROM workstations WHERE workStationID = ?',
      [result.insertId]
    );
    
    res.status(201).json(workstation[0]);
  } catch (error) {
    console.error('Error creating workstation:', error);
    res.status(500).json({ error: 'Failed to create workstation' });
  }
});

// =================== WORKSTATION MANAGEMENT ROUTES ===================

// Get all workstations with related data
app.get('/api/workstations', async (req, res) => {
  try {
    const [workstations] = await db.query(`
      SELECT w.*, 
             e.empFirstName, e.empLastName, e.empUserName, e.empDept,
             (SELECT COUNT(*) FROM assets a WHERE a.workStationID = w.workStationID) as assetCount
      FROM workstations w
      LEFT JOIN employees e ON w.empID = e.empID
      ORDER BY w.created_at DESC
    `);
    
    res.json(workstations);
  } catch (error) {
    console.error('Error fetching workstations:', error);
    res.status(500).json({ error: 'Failed to fetch workstations' });
  }
});

// Get specific workstation by ID
app.get('/api/workstations/:id', async (req, res) => {
  try {
    const [workstations] = await db.query(`
      SELECT w.*, 
             e.empFirstName, e.empLastName, e.empUserName, e.empDept,
             (SELECT COUNT(*) FROM assets a WHERE a.workStationID = w.workStationID) as assetCount
      FROM workstations w
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE w.workStationID = ?
    `, [req.params.id]);
    
    if (workstations.length === 0) {
      return res.status(404).json({ error: 'Workstation not found' });
    }
    
    res.json(workstations[0]);
  } catch (error) {
    console.error('Error fetching workstation:', error);
    res.status(500).json({ error: 'Failed to fetch workstation' });
  }
});

// Get assets assigned to a workstation
app.get('/api/workstations/:id/assets', async (req, res) => {
  try {
    const [assets] = await db.query(`
      SELECT a.*, c.categoryName, m.modelName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      WHERE a.workStationID = ?
    `, [req.params.id]);
    
    res.json(assets);
  } catch (error) {
    console.error('Error fetching workstation assets:', error);
    res.status(500).json({ error: 'Failed to fetch workstation assets' });
  }
});

// Create a new workstation
app.post('/api/workstations', async (req, res) => {
  try {
    const { modelName, empID } = req.body;
    
    // Validate required fields
    if (!modelName) {
      return res.status(400).json({ error: 'Workstation name is required' });
    }
    
    if (!empID) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }
    
    // Check if employee exists
    const [employees] = await db.query('SELECT * FROM employees WHERE empID = ?', [empID]);
    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Insert workstation
    const [result] = await db.query(`
      INSERT INTO workstations (modelName, empID, created_at, updated_at)
      VALUES (?, ?, NOW(), NOW())
    `, [modelName, empID]);
    
    // Get created workstation with related data
    const [workstation] = await db.query(`
      SELECT w.*, 
             e.empFirstName, e.empLastName, e.empUserName, e.empDept,
             0 as assetCount
      FROM workstations w
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE w.workStationID = ?
    `, [result.insertId]);
    
    res.status(201).json(workstation[0]);
  } catch (error) {
    console.error('Error creating workstation:', error);
    res.status(500).json({ error: 'Failed to create workstation' });
  }
});

// Update a workstation
app.put('/api/workstations/:id', async (req, res) => {
  try {
    const { modelName, empID } = req.body;
    const workstationId = req.params.id;
    
    // Validate required fields
    if (!modelName) {
      return res.status(400).json({ error: 'Workstation name is required' });
    }
    
    if (!empID) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }
    
    // Check if workstation exists
    const [workstations] = await db.query('SELECT * FROM workstations WHERE workStationID = ?', [workstationId]);
    if (workstations.length === 0) {
      return res.status(404).json({ error: 'Workstation not found' });
    }
    
    const currentWorkstation = workstations[0];
    
    // Check if employee exists
    const [employees] = await db.query('SELECT * FROM employees WHERE empID = ?', [empID]);
    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Update workstation
    await db.query(`
      UPDATE workstations
      SET modelName = ?, empID = ?, updated_at = NOW()
      WHERE workStationID = ?
    `, [modelName, empID, workstationId]);
    
    // Get updated workstation with related data
    const [updatedWorkstation] = await db.query(`
      SELECT w.*, 
             e.empFirstName, e.empLastName, e.empUserName, e.empDept,
             (SELECT COUNT(*) FROM assets a WHERE a.workStationID = w.workStationID) as assetCount
      FROM workstations w
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE w.workStationID = ?
    `, [workstationId]);
    
    res.json(updatedWorkstation[0]);
  } catch (error) {
    console.error('Error updating workstation:', error);
    res.status(500).json({ error: 'Failed to update workstation' });
  }
});

// Delete a workstation
app.delete('/api/workstations/:id', async (req, res) => {
  try {
    const workstationId = req.params.id;
    
    // Check if workstation exists
    const [workstations] = await db.query('SELECT * FROM workstations WHERE workStationID = ?', [workstationId]);
    if (workstations.length === 0) {
      return res.status(404).json({ error: 'Workstation not found' });
    }
    
    // Check if workstation has assigned assets
    const [assetCount] = await db.query('SELECT COUNT(*) as count FROM assets WHERE workStationID = ?', [workstationId]);
    if (assetCount[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete workstation with assigned assets. Please unassign all assets first.'
      });
    }
    
    // Delete workstation
    await db.query('DELETE FROM workstations WHERE workStationID = ?', [workstationId]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting workstation:', error);
    res.status(500).json({ error: 'Failed to delete workstation' });
  }
});

// Transfer assets between workstations
app.post('/api/workstations/transfer-assets', async (req, res) => {
  try {
    const { assetIds, fromWorkstationId, toWorkstationId, assetStatus } = req.body;
    
    // Validate required fields
    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return res.status(400).json({ error: 'Asset IDs are required' });
    }
    
    if (!toWorkstationId) {
      return res.status(400).json({ error: 'Destination workstation ID is required' });
    }
    
    // Check if destination workstation exists
    const [toWorkstations] = await db.query('SELECT * FROM workstations WHERE workStationID = ?', [toWorkstationId]);
    if (toWorkstations.length === 0) {
      return res.status(404).json({ error: 'Destination workstation not found' });
    }
    
    // If fromWorkstationId is provided, verify all assets are from that workstation
    if (fromWorkstationId) {
      const [assetCount] = await db.query(`
        SELECT COUNT(*) as count
        FROM assets
        WHERE assetID IN (?) AND workStationID = ?
      `, [assetIds, fromWorkstationId]);
      
      if (assetCount[0].count !== assetIds.length) {
        return res.status(400).json({ 
          error: 'Some assets are not assigned to the source workstation'
        });
      }
    }
    
    // Update assets to new workstation
    await db.query(`
      UPDATE assets
      SET workStationID = ?, 
          assetStatus = ?,
          updated_at = NOW()
      WHERE assetID IN (?)
    `, [toWorkstationId, assetStatus || 'Onsite', assetIds]);
    
    // Get updated assets
    const [updatedAssets] = await db.query(`
      SELECT a.*, c.categoryName, m.modelName,
             e.empFirstName, e.empLastName, e.empUserName,
             w.modelName as workstationName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      LEFT JOIN workstations w ON a.workStationID = w.workStationID
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE a.assetID IN (?)
    `, [assetIds]);
    
    res.json(updatedAssets);
  } catch (error) {
    console.error('Error transferring assets:', error);
    res.status(500).json({ error: 'Failed to transfer assets' });
  }
});


// =================== WORKSTATION MANAGEMENT ROUTES ===================

// Get all workstations with related data
app.get('/api/workstations', async (req, res) => {
  try {
    const [workstations] = await db.query(`
      SELECT w.*, 
             e.empFirstName, e.empLastName, e.empUserName, e.empDept,
             (SELECT COUNT(*) FROM assets a WHERE a.workStationID = w.workStationID) as assetCount
      FROM workstations w
      LEFT JOIN employees e ON w.empID = e.empID
      ORDER BY w.created_at DESC
    `);
    
    res.json(workstations);
  } catch (error) {
    console.error('Error fetching workstations:', error);
    res.status(500).json({ error: 'Failed to fetch workstations' });
  }
});

// Get specific workstation by ID
app.get('/api/workstations/:id', async (req, res) => {
  try {
    const [workstations] = await db.query(`
      SELECT w.*, 
             e.empFirstName, e.empLastName, e.empUserName, e.empDept,
             (SELECT COUNT(*) FROM assets a WHERE a.workStationID = w.workStationID) as assetCount
      FROM workstations w
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE w.workStationID = ?
    `, [req.params.id]);
    
    if (workstations.length === 0) {
      return res.status(404).json({ error: 'Workstation not found' });
    }
    
    res.json(workstations[0]);
  } catch (error) {
    console.error('Error fetching workstation:', error);
    res.status(500).json({ error: 'Failed to fetch workstation' });
  }
});

// Get assets assigned to a workstation
app.get('/api/workstations/:id/assets', async (req, res) => {
  try {
    const [assets] = await db.query(`
      SELECT a.*, c.categoryName, m.modelName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      WHERE a.workStationID = ?
    `, [req.params.id]);
    
    res.json(assets);
  } catch (error) {
    console.error('Error fetching workstation assets:', error);
    res.status(500).json({ error: 'Failed to fetch workstation assets' });
  }
});

// Create a new workstation
app.post('/api/workstations', async (req, res) => {
  try {
    const { modelName, empID } = req.body;
    
    // Validate required fields
    if (!modelName) {
      return res.status(400).json({ error: 'Workstation name is required' });
    }
    
    if (!empID) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }
    
    // Check if employee exists
    const [employees] = await db.query('SELECT * FROM employees WHERE empID = ?', [empID]);
    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Insert workstation
    const [result] = await db.query(`
      INSERT INTO workstations (modelName, empID, created_at, updated_at)
      VALUES (?, ?, NOW(), NOW())
    `, [modelName, empID]);
    
    // Get created workstation with related data
    const [workstation] = await db.query(`
      SELECT w.*, 
             e.empFirstName, e.empLastName, e.empUserName, e.empDept,
             0 as assetCount
      FROM workstations w
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE w.workStationID = ?
    `, [result.insertId]);
    
    res.status(201).json(workstation[0]);
  } catch (error) {
    console.error('Error creating workstation:', error);
    res.status(500).json({ error: 'Failed to create workstation' });
  }
});

// Update a workstation
app.put('/api/workstations/:id', async (req, res) => {
  try {
    const { modelName, empID } = req.body;
    const workstationId = req.params.id;
    
    // Validate required fields
    if (!modelName) {
      return res.status(400).json({ error: 'Workstation name is required' });
    }
    
    if (!empID) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }
    
    // Check if workstation exists
    const [workstations] = await db.query('SELECT * FROM workstations WHERE workStationID = ?', [workstationId]);
    if (workstations.length === 0) {
      return res.status(404).json({ error: 'Workstation not found' });
    }
    
    const currentWorkstation = workstations[0];
    
    // Check if employee exists
    const [employees] = await db.query('SELECT * FROM employees WHERE empID = ?', [empID]);
    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Update workstation
    await db.query(`
      UPDATE workstations
      SET modelName = ?, empID = ?, updated_at = NOW()
      WHERE workStationID = ?
    `, [modelName, empID, workstationId]);
    
    // Get updated workstation with related data
    const [updatedWorkstation] = await db.query(`
      SELECT w.*, 
             e.empFirstName, e.empLastName, e.empUserName, e.empDept,
             (SELECT COUNT(*) FROM assets a WHERE a.workStationID = w.workStationID) as assetCount
      FROM workstations w
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE w.workStationID = ?
    `, [workstationId]);
    
    res.json(updatedWorkstation[0]);
  } catch (error) {
    console.error('Error updating workstation:', error);
    res.status(500).json({ error: 'Failed to update workstation' });
  }
});

// Delete a workstation
app.delete('/api/workstations/:id', async (req, res) => {
  try {
    const workstationId = req.params.id;
    
    // Check if workstation exists
    const [workstations] = await db.query('SELECT * FROM workstations WHERE workStationID = ?', [workstationId]);
    if (workstations.length === 0) {
      return res.status(404).json({ error: 'Workstation not found' });
    }
    
    // Check if workstation has assigned assets
    const [assetCount] = await db.query('SELECT COUNT(*) as count FROM assets WHERE workStationID = ?', [workstationId]);
    if (assetCount[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete workstation with assigned assets. Please unassign all assets first.'
      });
    }
    
    // Delete workstation
    await db.query('DELETE FROM workstations WHERE workStationID = ?', [workstationId]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting workstation:', error);
    res.status(500).json({ error: 'Failed to delete workstation' });
  }
});

// Transfer assets between workstations
app.post('/api/workstations/transfer-assets', async (req, res) => {
  try {
    const { assetIds, fromWorkstationId, toWorkstationId, assetStatus } = req.body;
    
    // Validate required fields
    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return res.status(400).json({ error: 'Asset IDs are required' });
    }
    
    if (!toWorkstationId) {
      return res.status(400).json({ error: 'Destination workstation ID is required' });
    }
    
    // Check if destination workstation exists
    const [toWorkstations] = await db.query('SELECT * FROM workstations WHERE workStationID = ?', [toWorkstationId]);
    if (toWorkstations.length === 0) {
      return res.status(404).json({ error: 'Destination workstation not found' });
    }
    
    // If fromWorkstationId is provided, verify all assets are from that workstation
    if (fromWorkstationId) {
      const [assetCount] = await db.query(`
        SELECT COUNT(*) as count
        FROM assets
        WHERE assetID IN (?) AND workStationID = ?
      `, [assetIds, fromWorkstationId]);
      
      if (assetCount[0].count !== assetIds.length) {
        return res.status(400).json({ 
          error: 'Some assets are not assigned to the source workstation'
        });
      }
    }
    
    // Update assets to new workstation
    await db.query(`
      UPDATE assets
      SET workStationID = ?, 
          assetStatus = ?,
          updated_at = NOW()
      WHERE assetID IN (?)
    `, [toWorkstationId, assetStatus || 'Onsite', assetIds]);
    
    // Get updated assets
    const [updatedAssets] = await db.query(`
      SELECT a.*, c.categoryName, m.modelName,
             e.empFirstName, e.empLastName, e.empUserName,
             w.modelName as workstationName
      FROM assets a
      LEFT JOIN categories c ON a.categoryID = c.categoryID
      LEFT JOIN models m ON a.modelID = m.modelID
      LEFT JOIN workstations w ON a.workStationID = w.workStationID
      LEFT JOIN employees e ON w.empID = e.empID
      WHERE a.assetID IN (?)
    `, [assetIds]);
    
    res.json(updatedAssets);
  } catch (error) {
    console.error('Error transferring assets:', error);
    res.status(500).json({ error: 'Failed to transfer assets' });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});