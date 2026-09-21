const messagesEl = document.getElementById('messages');
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const quickButtons = document.querySelectorAll('.chip');
const tripForm = document.getElementById('trip-form');
const resetButton = document.getElementById('reset-trip');

const state = {
  trip: { destination: 'Lisbon, Portugal', startDate: '2026-10-10', endDate: '2026-10-13', travelers: 2, budget: 1500, style: 'Food and culture' },
  history: []
};
const savedTrip = localStorage.getItem('roamwise-brief');
if (savedTrip) {
  try {
    state.trip = { ...state.trip, ...JSON.parse(savedTrip) };
  } catch (error) {
    localStorage.removeItem('roamwise-brief');
  }
}

const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0
}).format(value || 0);

function addMessage(text, sender = 'assistant') {
  const row = document.createElement('div');
  row.className = `message-row ${sender}`;
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  if (sender === 'user' || sender === 'assistant') {
    state.history.push({ role: sender, content: text });
    state.history = state.history.slice(-8);
  }
}

function formatDate(value) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function calculateSummary() {
  const { destination, startDate, endDate, travelers, budget, style } = state.trip;
  const progress = [destination, startDate, endDate, travelers, style].filter(Boolean).length * 20;
  document.getElementById('trip-destination').textContent = destination || 'Not set';
  document.getElementById('trip-dates').textContent = startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : 'Not set';
  document.getElementById('trip-progress').textContent = `${progress}%`;
  document.getElementById('trip-meter').style.width = `${progress}%`;
  document.getElementById('traveler-count').textContent = travelers || '0';
  document.getElementById('trip-budget').textContent = budget ? formatCurrency(budget) : 'Not set';
  document.getElementById('trip-style').textContent = style || 'Not set';
}

function getStaticReply(value) {
  const prompt = value.toLowerCase();
  const destination = state.trip.destination || 'Lisbon';
  if (prompt.includes('pack')) {
    return `For ${destination}, pack comfortable walking shoes, a light rain layer, a reusable water bottle, universal adapter, and one smart-casual outfit. Keep valuables in a small crossbody bag.`;
  }
  if (prompt.includes('food') || prompt.includes('eat')) {
    return `A great food route in ${destination}: start with a local market breakfast, book one neighborhood restaurant for dinner, and leave lunch flexible for a small cafe or street-food stop. Ask locals for the daily special.`;
  }
  if (prompt.includes('hidden') || prompt.includes('gem')) {
    return `Try a quiet morning away from the main sights, a neighborhood walking tour, and one viewpoint at sunset. The best hidden gems are usually two streets beyond the busiest landmark.`;
  }
  return `Here is a relaxed plan for ${destination}: Day 1, arrive and explore the historic center; Day 2, visit the signature landmark and take a local food break; Day 3, choose a nearby neighborhood or day trip and finish with sunset views. I can make it more adventurous, cultural, or budget-friendly.`;
}

async function handleSubmit(event) {
  event.preventDefault();
  const value = input.value.trim();
  if (!value) return;
  addMessage(value, 'user');
  input.value = '';
  const sendButton = document.getElementById('send-button');
  sendButton.disabled = true;
  sendButton.textContent = 'Replying...';
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: value, trip: state.trip, history: state.history.slice(0, -1) })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The travel API did not respond.');
    addMessage(data.reply || getStaticReply(value), 'assistant');
  } catch (error) {
    addMessage(`${getStaticReply(value)}\n\n(Demo fallback: ${error.message})`, 'assistant');
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = 'Send';
  }
}

function handleTripSubmit(event) {
  event.preventDefault();
  const destination = document.getElementById('destination').value.trim();
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  const travelers = Number(document.getElementById('travelers').value);
  const budget = Number(document.getElementById('trip-budget-input').value) || 0;
  const style = document.getElementById('trip-style-input').value.trim();
  if (!destination || !startDate || !endDate || !travelers || travelers <= 0 || endDate < startDate) return;
  state.trip = { destination, startDate, endDate, travelers, budget, style };
  localStorage.setItem('roamwise-brief', JSON.stringify(state.trip));
  calculateSummary();
  addMessage(`Trip brief saved for ${destination}. I am ready to map out your adventure.`, 'assistant');
}

function resetTrip() {
  state.trip = { destination: '', startDate: '', endDate: '', travelers: 0, budget: 0, style: '' };
  localStorage.removeItem('roamwise-brief');
  tripForm.reset();
  calculateSummary();
  addMessage('Your trip brief has been reset. Add a destination whenever you are ready.', 'assistant');
}

quickButtons.forEach((button) => {
  button.addEventListener('click', () => {
    input.value = button.textContent.trim();
    input.focus();
    form.requestSubmit();
  });
});

form.addEventListener('submit', handleSubmit);
tripForm.addEventListener('submit', handleTripSubmit);
resetButton.addEventListener('click', resetTrip);
addMessage('Hi, I am Roamwise. Add a destination and dates, then ask me for an itinerary, local food, packing tips, or hidden gems.', 'assistant');
calculateSummary();
