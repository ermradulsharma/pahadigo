const mongoose = require('mongoose');

// Hardcoded for dev environment
const MONGO_URI = 'mongodb://127.0.0.1:27017/travels_db'; 

async function dropIndexes() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    // We can access the collection directly without the Model definition if we know the name
    // Collection name for 'User' model is usually 'users'
    const collection = mongoose.connection.collection('users');

    try {
        await collection.dropIndex('email_1');
        console.log('Dropped email_1');
    } catch(e) { console.log('email_1: ' + e.message); }
    
    try {
        await collection.dropIndex('phone_1');
        console.log('Dropped phone_1');
    } catch(e) { console.log('phone_1: ' + e.message); }

    console.log('Done dropping indexes');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

dropIndexes();
