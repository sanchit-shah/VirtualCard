# Ghost Card

<p align="center">
  <img src="./ghost-card-app/public/assets/GhostCard_Logo.png" alt="GhostCard Logo" width="140"/>
</p>

A comprehensive virtual card management system built with Next.js frontend and Express.js backend, integrated with Stripe Issuing API for virtual card creation and transaction processing.

## Features

- **Virtual Card Creation**: Create virtual cards with customizable spending limits ($0 - $1000)
- **Transaction Management**: Real-time transaction processing with intelligent rules engine
- **Single-Use Cards**: Special handling for one-time use cards with auto-deactivation
- **Zero Dollar Cards**: Support for $0 cards without Stripe spending limit conflicts
- **Real-time Updates**: Live transaction monitoring and card status updates
- **Secure Authentication**: User authentication and session management

## Technology Stack

### Backend
- **Express.js**: REST API server
- **Stripe Issuing API**: Virtual card creation and management
- **Firebase/Firestore**: Database for transaction logging and card management
- **Node.js**: Runtime environment

### Frontend
- **Next.js**: React framework with server-side rendering
- **React**: Component-based UI library
- **CSS Modules**: Styled components and responsive design

## Project Structure

```
VirtualCard/
├── Backend/
│   ├── index.js                 # Express server entry point
│   ├── controllers/
│   │   └── controller.js        # Card and transaction controllers
│   ├── routes/
│   │   └── routes.js           # API route definitions
│   └── services/
│       └── rulesEngine.js      # Transaction processing logic
└── ghost-card-app/
    ├── src/app/
    │   ├── components/          # React components
    │   ├── dashboard/           # Dashboard pages
    │   ├── login/              # Authentication pages
    │   └── utils/              # Utility functions
    └── public/                 # Static assets
```

## Setup and Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Stripe account with Issuing enabled
- Firebase project with Firestore enabled

### Backend Setup

1. Navigate to the Backend directory:
```powershell
cd Backend
```

2. Install dependencies:
```powershell
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Stripe API keys and Firebase configuration

4. Start the backend server:
```powershell
npm start
```

The backend will run on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
```powershell
cd ghost-card-app
```

2. Install dependencies:
```powershell
npm install
```

3. Start the development server:
```powershell
npm run dev
```

The frontend will run on `http://localhost:3000`

## Configuration

### Environment Variables

Create a `.env` file in the Backend directory with the following variables:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Server Configuration
PORT=8080

# Firebase Configuration
# Download your Firebase service account key and place it in config/serviceAccountKey.json
FIREBASE_PROJECT_ID=your_firebase_project_id
```

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Generate a service account key
4. Place the service account key file in `Backend/config/serviceAccountKey.json`

### Stripe Setup

1. Create a Stripe account and enable Stripe Issuing
2. Get your API keys from the Stripe dashboard
3. Add the keys to your `.env` file

## API Endpoints

### Cards
- `POST /api/cards` - Create a new virtual card
- `GET /api/cards/:userId` - Get user's cards
- `PUT /api/cards/:cardId/deactivate` - Deactivate a card

### Transactions
- `GET /api/transactions/:userId` - Get user's transaction history
- `POST /api/transactions/process` - Process a transaction (webhook)

## Key Features Explained

### Smart $0 Card Handling
The system intelligently handles $0 cards by creating them without Stripe spending limits, avoiding API conflicts while maintaining full functionality.

### Single-Use Card Logic
Single-use cards have special transaction processing logic that prioritizes merchant validation and automatically deactivates the card after the first approved transaction.

### Transaction Rules Engine
The rules engine evaluates transactions based on:
- Card status and type
- Merchant validation
- Available balance
- Card-specific spending rules

### Firebase Optimization
Transaction queries are optimized to avoid composite index requirements by using in-memory sorting instead of Firestore `orderBy` operations.

## Security Considerations

- All sensitive configuration is stored in environment variables
- Firebase service account keys are excluded from version control
- Stripe webhooks should be configured with proper endpoint security
- User authentication is implemented for all protected routes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the GitHub repository.
