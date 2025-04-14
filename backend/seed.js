const bcrypt = require('bcryptjs');
const db = require('./db');

async function createAdminUser() {
  const username = 'admin2';
  const plainPassword = 'admin123'; // You can change this
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  try {
    await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    console.log('✅ Admin user created successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Error creating admin user:', err);
    process.exit(1);
  }
}

createAdminUser();