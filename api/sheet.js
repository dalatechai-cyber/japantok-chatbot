export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle Pre-flight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL;
    
    if (!GOOGLE_SHEET_URL) {
        console.error("❌ GOOGLE_SHEET_URL not configured");
        return res.status(500).json({ error: 'Server Error: Google Sheet URL not configured.' });
    }

    try {
        console.log("📥 Fetching Google Sheet data...");
        const sheetResponse = await fetch(GOOGLE_SHEET_URL, {
            method: 'GET',
            headers: { 'Accept': 'text/csv' }
        });

        if (!sheetResponse.ok) {
            console.error(`❌ Failed to fetch sheet: ${sheetResponse.status}`);
            return res.status(sheetResponse.status).json({ 
                error: 'Failed to fetch Google Sheet data' 
            });
        }

        const csvData = await sheetResponse.text();

        if (!csvData || csvData.length < 50) {
            console.error("❌ Google Sheet returned empty or insufficient data");
            return res.status(400).json({ error: 'Google Sheet data is empty or invalid' });
        }

        console.log(`✅ Google Sheet data fetched successfully (${csvData.length} bytes)`);

        // Set cache headers to reduce API calls (cache for 1 hour)
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.status(200).json({ data: csvData });

    } catch (error) {
        console.error("❌ Server Error fetching sheet:", error.message);
        res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
}
