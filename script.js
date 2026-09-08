const messagesEl = document.getElementById('messages');
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const quickButtons = document.querySelectorAll('.chip');
const tripForm = document.getElementById('trip-form');
const resetButton = document.getElementById('reset-trip');

const state = {
  trip: { destination: '', startDate: '', endDate: '', travelers: 0, budget: 0, style: '' },
  history: []
};
const savedTrip = localStorage.getItem('roamwise-trip');
if (savedTrip) {
  try {
    state.trip = { ...state.trip, ...JSON.parse(savedTrip) };
  } catch (error) {
    localStorage.removeItem('roamwise-trip');
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

async function handleSubmit(event) {
  event.preventDefault();
  const value = input.value.trim();
  if (!value) return;
  addMessage(value, 'user');
  input.value = '';
  const sendButton = document.getElementById('send-button');
  sendButton.disabled = true;
  sendButton.textContent = 'Thinking...';
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: value, trip: state.trip, history: state.history.slice(0, -1) })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'The AI service did not respond successfully.');
    }
    addMessage(data.reply || 'I could not generate a response right now.', 'assistant');
  } catch (error) {
    const message = error.message.startsWith('The AI planner is unavailable.')
      ? error.message
      : `The AI planner is unavailable. ${error.message}`;
    addMessage(`${message} Your trip brief is still saved.`, 'assistant');
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = 'Plan';
  }
}

async function updateApiStatus() {
  const status = document.getElementById('api-status');
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    status.textContent = data.aiConfigured ? 'AI configured' : 'Fallback mode';
    status.classList.toggle('connected', Boolean(data.aiConfigured));
    status.title = data.aiConfigured
      ? 'An OpenAI key is configured. Account credits and model access are checked when you send a message.'
      : 'No OpenAI key configured. Replies use limited local planning logic.';
  } catch (error) {
    status.textContent = 'Offline mode';
    status.title = 'The server is unavailable. Built-in routes are still available.';
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
  localStorage.setItem('roamwise-trip', JSON.stringify(state.trip));
  calculateSummary();
  addMessage(`Trip brief saved for ${destination}. I am ready to shape your itinerary.`, 'assistant');
}

function resetTrip() {
  state.trip = { destination: '', startDate: '', endDate: '', travelers: 0, budget: 0, style: '' };
  localStorage.removeItem('roamwise-trip');
  tripForm.reset();
  calculateSummary();
  addMessage('Your trip brief has been reset. Add a new destination whenever you are ready.', 'assistant');
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
addMessage('I am Roamwise, your personal trip planner. Start with your destination and dates, then ask me anything about the journey.', 'assistant');
calculateSummary();
updateApiStatus();
