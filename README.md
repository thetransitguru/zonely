# NYC Zoning & Transit Opportunity Report Generator

A comprehensive web application that generates detailed reports on New York City property zoning, transit access, and development potential.

## Features

- 🏢 Property zoning information from NYC PLUTO dataset
- 🚇 Transit access analysis using MTA GTFS data
- 🗺️ Interactive map interface with Leaflet.js
- 📄 Professional PDF report generation
- 💳 Secure payment processing with Stripe

## Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Mapping**: Leaflet.js & React-Leaflet
- **Backend**: Serverless functions (Vercel/Netlify)
- **PDF Generation**: Puppeteer
- **Payments**: Stripe API

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd zonely
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Project Structure

```
zonely/
├── src/
│   ├── components/     # React components
│   ├── App.jsx         # Main application component
│   ├── main.jsx        # Application entry point
│   └── index.css       # Global styles with Tailwind
├── public/             # Static assets
├── api/                # Serverless functions
└── index.html          # HTML template
```

## Development Roadmap

- [x] Step 1: Project setup with React, Vite, Tailwind CSS
- [ ] Step 2: Build frontend interface
- [ ] Step 3: Integrate map and data fetching
- [ ] Step 4: Display basic results
- [ ] Step 5: Build PDF report backend
- [ ] Step 6: Integrate Stripe payments

## License

See LICENSE file for details.
