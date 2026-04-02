# Trading Backtest Journal

A comprehensive trading backtesting journal application built with Next.js 13+, MongoDB, and TypeScript. Track, analyze, and visualize your trading performance with professional-grade analytics.

## Features

- **Complete Trade Management**: Add, view, edit, and delete backtest trades
- **Advanced Analytics**: Win rate, P&L analysis, drawdown calculations, equity curves
- **Interactive Charts**: Monthly performance, strategy comparison, equity curve visualization
- **Filtering & Sorting**: Organize trades by asset, strategy, date, and custom tags
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Updates**: Instant data synchronization with React Query
- **Form Validation**: Robust input validation with Zod schemas

## Tech Stack

- **Framework**: Next.js 13+ (App Router)
- **Database**: MongoDB
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data Fetching**: React Query (TanStack Query)
- **Charts**: Recharts
- **Validation**: Zod
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database (local or cloud)
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd trading-backtest-journal
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
Create a `.env.local` file in the root directory:
\`\`\`env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
\`\`\`

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── add/               # Add trade page
│   ├── analytics/         # Analytics page
│   ├── trades/            # Trade list and detail pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── backtest-form.tsx # Trade entry form
│   ├── backtest-table.tsx# Trade list table
│   └── analytics-charts.tsx# Chart components
├── lib/                   # Utility functions
│   ├── mongodb.ts        # Database connection
│   ├── validations/      # Zod schemas
│   └── utils/            # Helper functions
└── types/                # TypeScript type definitions
\`\`\`

## API Endpoints

### Backtests
- `GET /api/backtests` - Fetch all backtests with optional filtering
- `POST /api/backtests` - Create a new backtest
- `GET /api/backtests/[id]` - Fetch a specific backtest
- `PUT /api/backtests/[id]` - Update a backtest
- `DELETE /api/backtests/[id]` - Delete a backtest

### Analytics
- `GET /api/analytics` - Fetch comprehensive analytics data

## Data Model

### Backtest Schema
\`\`\`typescript
interface Backtest {
  _id?: string
  tradeId: string          // Unique identifier
  date: Date              // Trade execution date
  asset: string           // Traded instrument
  strategy: string        // Trading strategy used
  entry: number           // Entry price
  exit: number            // Exit price
  positionSize: number    // Trade size
  profitLoss: number      // Calculated P&L
  notes?: string          // Optional notes
  screenshots?: string[]  // Optional trade screenshots
  tags: string[]          // Categorization tags
  createdAt?: Date
  updatedAt?: Date
}
\`\`\`

## Key Features

### Dashboard
- Overview of key trading metrics
- Recent trades summary
- Performance indicators

### Trade Entry
- Comprehensive form with validation
- Automatic P&L calculation
- Tag-based categorization
- Notes and screenshot support

### Analytics
- Win rate and trade statistics
- Equity curve visualization
- Monthly performance breakdown
- Strategy comparison charts
- Maximum drawdown analysis

### Trade Management
- Sortable and filterable trade list
- Individual trade detail views
- Bulk operations support

## Performance Optimizations

- Server-side rendering with Next.js App Router
- Efficient data fetching with React Query
- Optimized MongoDB queries
- Responsive image handling
- Client-side caching

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
