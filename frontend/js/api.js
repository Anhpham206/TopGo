const API_BASE = 'http://localhost:8000';

async function fetchCities() {
    const res = await fetch(`${API_BASE}/api/cities`);
    return res.json();
}

async function fetchPlaces() {
    const res = await fetch(`${API_BASE}/api/places`);
    return res.json();
}

async function generateItinerary(payload) {
    const res = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return res.json();
}

async function sendFeedback(feedback) {
    const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
    });
    return res.json();
}
