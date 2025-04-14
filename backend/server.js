const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running! API is available at /api');
});

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});