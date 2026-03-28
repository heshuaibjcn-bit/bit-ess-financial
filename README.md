# ESS Financial

工商业储能投资分析系统 / C&I Energy Storage Investment Analysis System

A comprehensive investment analysis calculator for commercial and industrial (C&I) energy storage projects. Now with **local project management** - no cloud setup required!

## Features

### Core Calculator
- **Multi-step Workflow**: Owner info → Tariff details → Technical assessment → Financial model → Report output
- **Financial Metrics**: IRR, NPV, Payback period, LCOE
- **Advanced Analysis**: Sensitivity analysis, scenario comparison, benchmarking
- **PDF Reports**: Professional investment assessment reports with charts and tables

### Local Project Management (NEW!)
- **User Authentication**: Secure email/password authentication with local storage
- **Project CRUD**: Create, read, update, and delete projects
- **Real-time Sync**: Changes sync across browser tabs automatically
- **Advanced Filtering**: Filter by status, collaboration model, date range
- **Auto-save**: Projects are saved automatically as you work
- **Data Persistence**: All data stored locally in your browser

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ess_financial
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

That's it! No cloud setup required.

## Project Structure

```
ess_financial/
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── form-steps/    # Calculator form steps
│   │   ├── charts/        # Chart components
│   │   ├── AuthPage.tsx   # Login/Register page
│   │   ├── ProjectListPage.tsx  # Project list/dashboard
│   │   └── ProjectDetailPage.tsx # Project editor
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx       # Authentication context
│   ├── domain/            # Domain models and schemas
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   │   └── localStorage.ts        # Local storage service
│   ├── stores/            # State management (Zustand)
│   │   └── cloudProjectStore.ts  # Project store
│   └── App.tsx            # Main app with routing
├── public/                # Static assets
└── README.md              # This file
```

## Usage

### Demo Mode (No Authentication)
Visit `http://localhost:5173/demo` to try the calculator without signing up.

### Full Features (With Authentication)
1. Sign up for a new account at `/register` or click "Sign Up"
2. Fill in your information and create your account
3. Create your first project from the dashboard
4. Fill in the multi-step form:
   - **Owner Info**: Company details, collaboration model, facility information
   - **Tariff Details**: Local electricity pricing information
   - **Technical Assessment**: AI-recommended system configuration
   - **Financial Model**: Investment returns and cash flow analysis
   - **Report Output**: Generate and export professional reports

### Project Management
- **Create**: Click "新建项目" button
- **Edit**: Click on any project card to open the editor
- **Duplicate**: Click the duplicate icon on project cards
- **Delete**: Click the delete icon (with confirmation)
- **Filter**: Use the filter bar to search and filter projects
- **View Modes**: Switch between card and list views

### Data Storage
All data is stored locally in your browser:
- **User accounts**: Encrypted in localStorage
- **Projects**: Stored in localStorage with auto-save
- **Cross-tab sync**: Changes sync across browser tabs automatically

**Note**: Since data is stored locally, clearing your browser data will remove all projects. Consider exporting important projects as PDFs for backup.

## Key Technologies

- **Frontend**: React 18, TypeScript, Vite
- **State Management**: Zustand
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Charts**: ECharts, Recharts
- **Authentication**: Local storage-based auth
- **Database**: localStorage + IndexedDB (for future enhancement)
- **PDF**: @react-pdf/renderer
- **Styling**: Tailwind CSS 4
- **i18n**: i18next

## Development

### Available Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Type checking
npm run type-check

# Linting
npm run lint

# E2E tests
npm run test:e2e
```

### Architecture

The application follows a clean architecture with clear separation of concerns:

- **Presentation Layer**: React components with TypeScript
- **Domain Layer**: Business logic and schemas
- **Data Layer**: Local storage service and Zustand stores
- **Infrastructure**: Routing, authentication, i18n

## Data Backup

Since all data is stored locally, consider these backup options:

1. **Export to PDF**: Use the built-in PDF export feature
2. **Browser DevTools**: Export localStorage data from Application tab
3. **Future Enhancement**: Cloud sync option (Supabase integration available but requires setup)

## Cloud Setup (Optional)

If you want to enable cloud sync for multi-device access:

1. Create a free Supabase account at [supabase.com](https://supabase.com)
2. Follow the setup guide in `CLOUD_SETUP.md`
3. Configure environment variables

**Note**: The app works perfectly without cloud setup. Cloud is optional for users who want multi-device sync.

## Deployment

### Vercel
1. Push your code to GitHub
2. Import project in Vercel
3. Deploy!

### Other Platforms
The app can be deployed to any platform that supports Vite:
- Netlify
- Cloudflare Pages
- AWS Amplify
- Railway
- Render

Since the app uses local storage, users will have separate accounts and projects on each device.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests if applicable
5. Submit a pull request

## License

[Your License Here]

## Support

For issues or questions:
- Open a GitHub issue
- Check existing documentation

## Acknowledgments

- The React community for amazing libraries and tools
- All contributors to the open-source projects used in this app

## Roadmap

- [x] Local project management
- [x] User authentication
- [x] Real-time cross-tab sync
- [ ] Data export/import (JSON)
- [ ] Optional cloud sync (Supabase)
- [ ] Project templates
- [ ] Advanced analytics dashboard
- [ ] Mobile apps (iOS/Android)
