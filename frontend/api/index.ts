import { app } from '../../backend/src/app';
import { connectDatabase } from '../../backend/src/config/database';
import serverless from 'serverless-http';

// Ensure the database connects when the serverless function cold starts
connectDatabase().catch(console.error);

// Wrap the Express app in a serverless handler for Vercel
export default serverless(app);
