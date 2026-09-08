from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime
import os

output = 'Roamwise-Guide.pdf'

c = canvas.Canvas(output, pagesize=letter)
c.setTitle('Roamwise AI Guide')
c.setAuthor('Roamwise Team')

c.setFont('Helvetica-Bold', 22)
c.drawString(72, 740, 'Roamwise AI Guide')

c.setFont('Helvetica', 12)
c.drawString(72, 710, 'Generated: ' + datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

lines = [
    'Overview',
    'Roamwise is a personal trip-planning assistant that helps users turn destinations, dates, interests, and travel style into practical itineraries.',
    '',
    'Persona: Roamwise',
    'Roamwise is curious, thoughtful, practical, and locally minded. It speaks like a trusted travel companion rather than a generic chatbot.',
    '',
    'What it works for',
    '- Day-by-day itinerary planning',
    '- Food and neighborhood suggestions',
    '- Relaxed route and pacing guidance',
    '- Hidden gem discovery',
    '- Budget-aware travel ideas',
    '',
    'How to use',
    '1. Add your destination, dates, and traveler count.',
    '2. Add your budget and travel style.',
    '3. Review your live trip snapshot.',
    '4. Ask questions like: Can you plan my itinerary? Where should I eat?',
    '5. Use the ideas to shape a better journey.',
    '',
    'Real AI mode',
    'The app is built to call OpenAI when an API key is configured in the .env file.',
    'If no key is present, the app falls back to local travel-planning logic.',
    '',
    'Important',
    'Travel details should be verified before booking, especially prices, opening hours, and availability.'
]

y = 680
for line in lines:
    if line == '':
        y -= 14
        continue
    if line in ['Overview', 'Persona: Roamwise', 'What it works for', 'How to use', 'Real AI mode', 'Important']:
        c.setFont('Helvetica-Bold', 14)
        c.drawString(72, y, line)
    elif line.startswith('- '):
        c.setFont('Helvetica', 12)
        c.drawString(90, y, line)
    else:
        c.setFont('Helvetica', 12)
        c.drawString(72, y, line)
    y -= 18

c.save()
print(f'PDF_CREATED {output}')
print('EXISTS', os.path.exists(output))
