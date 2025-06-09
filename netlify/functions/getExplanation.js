exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { concepts } = JSON.parse(event.body);

    if (!concepts || concepts.length < 2) {
      return { statusCode: 400, body: 'Bad Request: Please provide at least two concepts.' };
    }

    // This key is stored securely in Netlify's settings, not in the code.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: 'Server error: API key not configured.' };
    }

    const prompt = `Explain the connections between these concepts: ${concepts.join(', ')}. Provide the output as a JSON object with one key "connections", which is an array of objects. Each object must have "from", "to", and a "label". The "label" should be a concise, one-sentence explanation of the link between the two concepts. IMPORTANT: Treat each pair of concepts as a single, unique connection. Do not provide two separate explanations for the same pair (e.g., explaining 'Concept A to Concept B' and also 'Concept B to Concept A'). Only one connection per pair is needed.`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { statusCode: response.status, body: `API error: ${response.statusText}` };
    }

    const result = await response.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };

  } catch (error) {
    return { statusCode: 500, body: `Server error: ${error.message}` };
  }
};