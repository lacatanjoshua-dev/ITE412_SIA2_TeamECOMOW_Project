export default async function handler(req, res) {
  const targetUrl = `http://mowerapp.infinityfreeapp.com/mowerapp_api/api.php${req.url}`;
  
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });
    
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy failed: ' + error.message });
  }
}