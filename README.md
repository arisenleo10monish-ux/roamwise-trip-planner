# Roamwise AI

A personal trip-planning chatbot that turns destinations, dates, interests, and travel pace into thoughtful itineraries.

## Persona: Roamwise

Roamwise is the assistant personality for this product. It is:

- curious and thoughtful
- practical about routes, timing, and pacing
- focused on local flavor without overstuffing the day
- helpful with food, stays, activities, and hidden gems
- designed to sound like a personal travel companion rather than a generic bot

## What it works for

- building day-by-day itineraries
- balancing must-see sights with open time
- suggesting food, neighborhoods, stays, and activities
- adapting plans to budget, group size, and travel style
- offering practical recommendations based on the user's trip brief

## Features

- Save a trip brief with destination, dates, travelers, budget, and style
- Live trip snapshot and planning progress
- AI-powered chat assistance
- Fallback offline travel advice when no API key is configured

## Local development

1. Install dependencies:
   npm install
2. Copy the environment template to a file named `.env` in the `chatbot` folder:
   cp .env.example .env
3. Open `chatbot/.env` and replace `your_api_key_here`:
   `OPENAI_API_KEY=your_real_openai_key_here`
4. Keep this key in `.env` only. Do not paste it into `index.html` or `script.js`.
5. Start the app:
   npm start
6. Open http://localhost:3000

## How to use

1. Enter your destination, dates, traveler count, budget, and travel style.
2. Save the trip brief to update the live trip snapshot.
3. Ask questions in natural language, such as:
   - Can you plan my itinerary?
   - Where should I eat?
   - Make it more relaxed.
   - Show me hidden gems.
4. The assistant uses your trip brief to give practical guidance.

## GitHub push

Initialize a repo and push to your remote if desired:

```bash
git init
git add .
   git commit -m "Initial trip planner app"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Notes

The app works locally without an API key, and it will automatically use OpenAI when `OPENAI_API_KEY` is present.
