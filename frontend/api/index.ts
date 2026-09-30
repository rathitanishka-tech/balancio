import { app } from '../../backend/src/app';
import { connectDatabase } from '../../backend/src/config/database';
import serverless from 'serverless-http';

const handler = serverless(app);

export default async function(req: any, res: any) {
  try {
    await connectDatabase();
  } catch (error) {
    console.error("FATAL ERROR: Could not connect to MongoDB. Check your MONGO_URL and Atlas IP Whitelist.");
    console.error(error);
    
    // If the database fails to connect, we must fail fast rather than hanging!
    if (res && typeof res.status === 'function') {
      return res.status(500).json({ 
        success: false, 
        error: { 
          code: "DB_CONNECTION_FAILED", 
          message: "Could not connect to the database. Check Vercel environment variables and MongoDB IP whitelist." 
        } 
      });
    }
  }
  
  return handler(req, res);
}
