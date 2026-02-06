# AlertLens — Integration Runbook Copilot

<div align="center">

**AI-Powered Runbook Automation for MuleSoft Environments**

*SnapLogic, Boomi & other iPaaS platforms coming soon.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.5-646cff.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

---

## 🎯 Overview

**AlertLens** eliminates alert fatigue for integration teams by automatically analyzing, prioritizing, and guiding resolution of MuleSoft production issues using AI.

### The Problem in Real-World MuleSoft Environments

- **Alert Overload**: Mailboxes get flooded with alerts from multiple APIs
- **Priority Confusion**: Developers struggle to identify which issue is truly critical
- **Delayed Response**: Many alerts are ignored or addressed late
- **Time-Consuming Analysis**: Root cause analysis requires manual correlation across logs, health checks, and deployments
- **Unused Runbooks**: Documentation exists, but nobody has time to read it during outages

### The AlertLens Solution

AlertLens acts as an **Integration Runbook Copilot** that:

✅ **Reads and analyzes** latest MuleSoft alerts from your mailbox  
✅ **Correlates** API health, network status, and telemetry data  
✅ **Detects** deployment gaps and smoke test failures  
✅ **Assigns** operational severity (P1/P2/P3/P4)  
✅ **Generates** a clear operational verdict with AI-powered insights  
✅ **Guides** developers to the most critical issue first  

---

## ✨ Key Features

### 🤖 AI-Powered Alert Analysis
- Automated parsing and classification of MuleSoft email alerts
- Intelligent severity assessment using **Google Gemini 2.0 Flash**
- Root cause analysis with suggested remediation steps
- Natural language summaries of complex technical issues

### 📊 Real-Time Observability Integration
- Live API health status monitoring
- Deployment history tracking (version, timestamp, deployer)
- Smoke test validation results
- CORS-safe integration via Supabase Edge Functions

### 🎨 Intelligent Alert Dashboard
- **Grid View**: Visual card-based layout for quick scanning
- **Detail View**: Comprehensive incident analysis with AI health intelligence
- **Smart Filtering**: Multi-dimensional filters (API, environment, severity, timestamp)
- **Mobile Responsive**: Optimized for all screen sizes

### 🔍 Incident Prioritization
- AI-recommended severity levels (P1-P4)
- Contextual importance based on error type, deployment status, and health checks
- Automatic identification of the top critical incident
- Historical timestamp tracking

### 🚀 Modern Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS with custom design system
- **AI**: Google Gemini 2.0 Flash for fast, accurate analysis
- **APIs**: Axios with intelligent CORS handling
- **Deployment**: Docker-ready with multi-stage builds

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AlertLens Frontend                       │
│                 (React + TypeScript + Vite)                  │
└─────────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
┌─────────────────┐ ┌──────────────┐ ┌────────────────┐
│  MuleSoft API   │ │ Observability│ │  Google Gemini │
│  (Alerts)       │ │  API         │ │  (AI Analysis) │
└─────────────────┘ └──────────────┘ └────────────────┘
          │                │
          └────────────────┘
                  │
                  ▼
        ┌──────────────────────┐
        │ Supabase Edge Functions│
        │  (CORS Bypass)         │
        └──────────────────────┘
```

### Core Components

- **`App.tsx`**: Main application orchestrator with state management
- **`IncidentGrid.tsx`**: Card-based grid view for browsing alerts
- **`IncidentDetail.tsx`**: Comprehensive detail view with AI insights
- **`IncidentList.tsx`**: Filter panel with multi-select capabilities
- **`AnalysisDialog.tsx`**: Configuration modal for alert analysis
- **`Header.tsx`**: Navigation and branding

### API Modules

- **`client.ts`**: Unified API client with CORS handling and retry logic
- **`gemini.ts`**: Google Gemini AI integration for alert and observability analysis
- **`supabase-client.ts`**: Edge function client for CORS-safe API calls

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **npm** or **yarn**
- **Google Gemini API Key** ([Get one here](https://ai.google.dev/))
- **MuleSoft Alert API** (configured in environment variables)
- **Observability API** (optional, for health checks)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Integration-Runbook-Copilot.git
   cd Integration-Runbook-Copilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   # AI Configuration
   VITE_GEMINI_API_KEY=your_gemini_api_key_here

   # MuleSoft Alert API
   VITE_MULE_API_BASE_URL=https://your-mulesoft-api.com
   
   # Observability API (optional)
   VITE_OBSERVABILITY_API_BASE_URL=https://your-observability-api.com
   VITE_ENABLE_OBSERVABILITY=true
   
   # Edge Functions (recommended for CORS bypass)
   VITE_USE_EDGE_FUNCTION=true
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

### Docker Deployment

Build and run with Docker:

```bash
# Build the image
docker build -t alertlens .

# Run the container
docker run -p 3000:3000 --env-file .env alertlens
```

Access the application at `http://localhost:3000`

---

## 📖 Usage Guide

### 1. Analyze Alerts

Click **"Analyze Alerts"** to fetch and process MuleSoft alerts:
- Specify the number of alerts to fetch
- Set a date range (optional)
- AI will automatically categorize and prioritize incidents

### 2. Filter Incidents

Use the left sidebar to filter by:
- **Applications**: Specific MuleSoft APIs
- **Messages**: Alert types or services
- **Environments**: Production, Staging, Development
- **Importance**: P1 (Critical) to P4 (Low)
- **Timestamps**: Date-based filtering

### 3. View Incident Details

Click on any alert card to see:
- **AI Health Intelligence**: Real-time status, deployment history, smoke test results
- **Operational Verdict**: AI-recommended severity and action plan
- **Original Content**: Full alert details with HTML rendering

### 4. Take Action

Each incident provides:
- **Suggested Actions**: AI-generated remediation steps
- **Root Cause Analysis**: Technical summary with specific error details
- **Priority Guidance**: Focus on P1 incidents first

---

## 🔧 Configuration

### Feature Flags

Control features via environment variables:

```env
# Disable observability integration
VITE_ENABLE_OBSERVABILITY=false

# Use direct API calls instead of edge functions
VITE_USE_EDGE_FUNCTION=false
```

### API Proxy (Development)

For local development, configure proxy in `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api-mule': {
        target: 'https://your-mulesoft-api.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-mule/, ''),
      },
    },
  },
});
```

---

## 🧪 Testing

```bash
# Run linter
npm run lint

# Run observability API tests
npm run test:observability

# Run edge function tests
npm run test:edge-function
```

---

## 📂 Project Structure

```
integration-runbook-copilot/
├── src/
│   ├── api/                  # API clients and integrations
│   │   ├── client.ts         # Main API orchestrator
│   │   ├── gemini.ts         # Google Gemini AI integration
│   │   ├── supabase-client.ts # Edge function client
│   │   └── mockData.ts       # Sample data for testing
│   ├── components/           # React components
│   │   ├── Header.tsx
│   │   ├── IncidentGrid.tsx
│   │   ├── IncidentDetail.tsx
│   │   ├── IncidentList.tsx
│   │   ├── AnalysisDialog.tsx
│   │   └── UserProfile.tsx
│   ├── types/                # TypeScript definitions
│   │   └── index.ts
│   ├── utils/                # Utility functions
│   │   ├── severity.ts       # Severity classification
│   │   ├── textFormat.tsx    # Text rendering helpers
│   │   └── user.ts           # User management
│   ├── App.tsx               # Main application
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── public/                   # Static assets
├── supabase/                 # Supabase edge functions
│   └── functions/
│       └── gemini3/
├── Dockerfile                # Multi-stage Docker build
├── server.js                 # Production Express server
├── vite.config.ts            # Vite configuration
├── tailwind.config.ts        # TailwindCSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

---

## 🎨 Design Principles

### 1. **Network Efficiency**
- Batch API calls with `Promise.all()`
- Intelligent caching and retry logic
- Edge functions to bypass CORS without proxy overhead

### 2. **Mobile-First Responsive**
- Grid layout adapts: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)
- Touch-friendly card interactions
- Optimized font sizes and spacing

### 3. **Performance Optimization**
- Lazy loading of incident details
- Efficient filtering with memoization
- Minimal re-renders with proper state management
- Code splitting with Vite

---

## 🔐 Security Considerations

- API keys stored in environment variables (never committed)
- CORS-safe requests via Supabase Edge Functions
- No sensitive data in localStorage
- Secure authentication hooks ready for integration

---

## 🛣️ Roadmap

### Current Support
- ✅ **MuleSoft** (Production-ready)

### Coming Soon
- 🚧 **SnapLogic** (Q2 2026)
- 🚧 **Boomi** (Q3 2026)
- 🚧 **Dell Boomi** (Q3 2026)
- 🚧 **Workato** (Q4 2026)
- 🚧 **Zapier Enterprise** (2027)

### Future Enhancements
- Slack/Teams integration for real-time alerts
- Historical trend analysis
- Custom runbook creation
- Multi-tenant support
- Advanced RBAC (Role-Based Access Control)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use TailwindCSS utility classes (avoid custom CSS)
- Optimize network calls (batch requests, reduce redundancy)
- Ensure mobile responsiveness for all features
- Add JSDoc comments for complex functions

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini** for powerful AI-driven alert analysis
- **MuleSoft Community** for integration best practices
- **React** and **Vite** teams for amazing developer experience

---

## 📧 Support

For questions or support:
- 📧 Email: support@alertlens.io
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/Integration-Runbook-Copilot/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/Integration-Runbook-Copilot/discussions)

---

<div align="center">

**Built with ❤️ for Integration Engineers**

*Stop drowning in alerts. Start resolving with intelligence.*

</div>
