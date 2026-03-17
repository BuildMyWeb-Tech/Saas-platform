// config/db.js
// ─────────────────────────────────────────────
//  MongoDB Atlas Connection via Mongoose
// ─────────────────────────────────────────────

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
   const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅  MongoDB Connected: ${conn.connection.host}`);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error(`❌  MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️   MongoDB disconnected. Attempting reconnect...');
    });

  } catch (error) {
    console.error(`❌  MongoDB initial connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
