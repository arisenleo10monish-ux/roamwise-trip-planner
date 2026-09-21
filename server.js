const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const OpenAI = require('openai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const aiProvider = process.env.GROQ_API_KEY ? 'groq' : 'openai';
const aiApiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
const aiBaseURL = process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : undefined;
const aiModel = process.env.AI_MODEL || (aiProvider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');

app.use(express.json());
app.use(express.static(path.join(__dirname)));

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
}

function summarizeTrip(trip = {}) {
  return {
    destination: String(trip.destination || ''),
    startDate: String(trip.startDate || ''),
    endDate: String(trip.endDate || ''),
    travelers: Number(trip.travelers || 0),
    budget: Number(trip.budget || 0),
    style: String(trip.style || '')
  };
}

function tripDayCount(startDate, endDate) {
  if (!startDate || !endDate) return 3;
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const days = Math.round((end - start) / 86400000) + 1;
  return Number.isFinite(days) && days > 0 ? Math.min(days, 14) : 3;
}

const famousPlaces = {
  paris: 'Paris starter route: spend day one around the Seine, Ile de la Cite, and Le Marais; reserve day two for the Louvre and a slow Montmartre evening; finish with a bakery breakfast and a sunset walk near the Eiffel Tower. Keep one neighborhood per half-day so the city stays leisurely.',
  tokyo: 'Tokyo starter route: begin with Asakusa and Ueno, move through Shibuya and Harajuku, then give yourself a quieter day in Yanaka or Kiyosumi-Shirakawa. Group each day by neighborhood to avoid crossing the city repeatedly.',
  rome: 'Rome starter route: pair the Colosseum, Roman Forum, and Monti on day one; explore the Pantheon, Piazza Navona, and Trastevere next; save an early Vatican visit and a long riverside dinner for the final day.',
  bali: 'Bali starter route: split the trip between Ubud for rice terraces, temples, and food, then a slower coast stay for beach mornings and sunset walks. Leave transfer days light because the roads can be much slower than the map suggests.',
  london: 'London starter route: combine Westminster and the South Bank, spend another day around the British Museum and Covent Garden, then choose a neighborhood day in Notting Hill, Shoreditch, or Hampstead.',
  'new york': 'New York starter route: walk Lower Manhattan and the waterfront first, explore Greenwich Village and Chelsea next, then give Central Park and a museum their own unhurried day. Pick one skyline view and one live show.',
  dubai: 'Dubai starter route: pair Old Dubai, the creek, and the souks with a modern Marina and Downtown day; reserve a cooler morning for desert landscapes and keep afternoons flexible for heat.',
  sydney: 'Sydney starter route: walk the Opera House, Circular Quay, and The Rocks, then follow the Bondi to Coogee coastal path at an easy pace. Add a harbor ferry and a Blue Mountains day trip.'
};

function generateLocalResponse(message, trip) {
  const text = (message || '').trim().toLowerCase();
  const details = summarizeTrip(trip);
  const place = details.destination || 'your destination';

  if (!text) return 'Tell me your destination, dates, budget, or interests and I will shape them into a practical travel plan.';
  if (text.includes('hello') || text.includes('hi') || text.includes('hey')) return 'Hi! I am Roamwise, your travel planning assistant. Share a destination and I will help shape your itinerary.';
  if (text.includes('summary') || text.includes('status') || text.includes('overview')) {
    if (!details.destination) return 'Your trip brief is empty. Add a destination, dates, travelers, and style so I can start planning.';
    return `Your ${place} trip runs from ${details.startDate || 'now'} to ${details.endDate || 'your return date'} for ${details.travelers || 'your group'} traveler(s). Your style is ${details.style || 'open-ended'}${details.budget ? ` with a budget of ${formatCurrency(details.budget)}` : ''}.`;
  }
  const featuredPlace = Object.keys(famousPlaces).find((name) => text.includes(name));
  if (featuredPlace && (text.includes('plan') || text.includes('itinerary') || text.includes('route') || text.includes('trip'))) {
    return `${famousPlaces[featuredPlace]}\n\nFor your ${tripDayCount(details.startDate, details.endDate)}-day trip, use this as the framework and leave the final afternoon flexible for weather, energy, and discoveries.`;
  }
  if (text.includes('itinerary') || text.includes('plan') || text.includes('schedule')) {
    const days = tripDayCount(details.startDate, details.endDate);
    const lines = [`A practical ${days}-day ${place} itinerary:`];
    for (let day = 1; day <= days; day += 1) {
      const focus = day === 1 ? 'arrival, neighborhood walk, and a relaxed local dinner' : day === days ? 'a flexible final morning, souvenirs, and departure preparation' : 'one signature sight, a local food stop, and an unhurried evening';
      lines.push(`Day ${day}: ${focus}.`);
    }
    lines.push(`Keep the route flexible and group nearby places together. ${details.budget ? `Keep the total trip spend near ${formatCurrency(details.budget)}.` : 'Add a budget and travel style for a more precise schedule.'}`);
    return lines.join('\n');
  }
  if (text.includes('pack')) return `For ${place}, pack comfortable walking shoes, a light layer, a reusable water bottle, a universal adapter, and one smart-casual outfit.`;
  if (text.includes('food') || text.includes('eat')) return `For food in ${place}, combine one market breakfast, one neighborhood lunch, and a dinner reservation. Ask locals for the daily special.`;
  if (text.includes('hidden') || text.includes('gem')) return `For hidden gems in ${place}, explore one neighborhood away from the main landmark and choose a local market or viewpoint at sunset.`;
  if (text.includes('thanks') || text.includes('thank you')) return 'You are welcome. Update the trip brief anytime and I will keep the itinerary aligned with your dates, pace, and interests.';
  return 'I can build itineraries, suggest food spots, recommend packing lists, find hidden gems, and adapt plans to your budget and travel style.';
}

app.post('/api/chat', async (req, res) => {
  const message = req.body?.message || '';
  const trip = summarizeTrip(req.body?.trip);
  const history = Array.isArray(req.body?.history) ? req.body.history
    .filter((item) => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
    .slice(-8) : [];
  if (!message.trim()) return res.status(400).json({ error: 'Message is required.' });

  const prompt = `You are Roamwise, a practical travel itinerary assistant. Use the trip brief and the user's message to give concise, specific, realistic travel guidance. Recommend routes that group nearby places, include food and local experiences, respect the budget and dates, and never invent bookings or live availability.\n\nUser message: ${message}\nTrip brief: destination=${trip.destination || 'not set'}, dates=${trip.startDate || 'not set'} to ${trip.endDate || 'not set'}, travelers=${trip.travelers || 'not set'}, budget=${trip.budget ? formatCurrency(trip.budget) : 'not set'}, travel style=${trip.style || 'not set'}.`;

  if (aiApiKey) {
    try {
      const openai = new OpenAI({ apiKey: aiApiKey, baseURL: aiBaseURL });
      const completion = await openai.chat.completions.create({
        model: aiModel,
        messages: [
          {
            role: 'system',
            content: 'You are Roamwise, a curious and practical travel assistant. Use the trip brief and recent conversation. Give specific, realistic itinerary guidance with clear daily plans, local food ideas, pacing, and budget awareness. Ask one focused follow-up when a missing detail materially changes the plan.'
          },
          ...history,
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 350
      });
      const reply = completion.choices?.[0]?.message?.content?.trim();
      if (reply) return res.json({ reply, source: 'openai' });
    } catch (error) {
      console.error('OpenAI call failed:', error.message);
      return res.status(503).json({
        error: 'The AI planner is unavailable. Check the OpenAI key, account credits, and model access, then try again.',
        source: 'unavailable'
      });
    }
  }

  return res.json({
    reply: generateLocalResponse(message, trip),
    source: 'fallback',
    warning: 'AI is not configured. This is a limited local planning response.'
  });
});

app.get('/api/health', (req, res) => res.json({
  ok: true,
  service: 'studywise-ai-planner',
  aiConfigured: Boolean(aiApiKey),
  aiProvider: aiApiKey ? aiProvider : null,
  aiModel: aiApiKey ? aiModel : null
}));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.listen(PORT, () => console.log(`Roamwise running at http://localhost:${PORT}`));
