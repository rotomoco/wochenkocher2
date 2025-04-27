import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db('mongodb');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

export async function closeDB() {
  try {
    await client.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    throw error;
  }
}