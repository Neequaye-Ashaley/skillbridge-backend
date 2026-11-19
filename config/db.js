const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!rawUri) {
      throw new Error('Neither MONGODB_URI nor MONGO_URI is defined in your environment variables.');
    }
    // Remove any accidental spaces in the URI string
    const uri = rawUri.replace(/\s+/g, '');
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
