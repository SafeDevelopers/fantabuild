// Quick script to make a user admin
// Usage: node test-admin.js your-email@example.com

import pool from './server/db.js';

const email = process.argv[2];

if (!email) {
  console.error('Usage: node test-admin.js your-email@example.com');
  process.exit(1);
}

async function makeAdmin() {
  try {
    // First, add role column if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'role'
          ) THEN
              ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));
          END IF;
      END $$;
    `);

    // Update user to admin
    const result = await pool.query(
      `UPDATE users SET role = 'admin' WHERE email = $1 RETURNING email, role`,
      [email]
    );

    if (result.rows.length === 0) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`✅ Successfully updated user to admin:`);
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Role: ${result.rows[0].role}`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Sign out and sign in again in the app`);
    console.log(`   2. You should see "Admin" button in top right`);
    console.log(`   3. Go to http://localhost:3000/admin`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

makeAdmin();
