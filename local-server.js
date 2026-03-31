import app from './api/index.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 Local server started at http://localhost:${PORT}`);
  console.log(`\n🔗 Frontend: http://localhost:5173`);
  console.log(`\n💻 API endpoint: http://localhost:${PORT}/api/health\n`);
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌  ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env\n');
  } else {
    console.log('✅  Supabase environment variables loaded successfully.\n');
  }
});
