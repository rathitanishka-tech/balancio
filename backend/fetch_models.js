const https = require('https');

const options = {
  hostname: 'api.groq.com',
  path: '/openai/v1/models',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.data) {
        console.log("Total models:", parsed.data.length);
        console.log(parsed.data.map(m => m.id));
      } else {
        console.log("Response:", parsed);
      }
    } catch(e) {
      console.error("Parse error:", e);
      console.log("Raw data:", data);
    }
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.end();
