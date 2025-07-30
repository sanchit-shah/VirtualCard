# VirtualCard Backend

This is the Express backend for the VirtualCard hackathon project. It provides API endpoints for managing virtual cards with custom rules and restrictions.

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

### Installation
1. Open a terminal and navigate to the `Backend` folder:
   ```powershell
   cd Backend
   ```
2. Install dependencies:
   ```powershell
   npm install express cors
   npm install --save-dev nodemon
   ```

### Running the Server
- To start the server:
  ```powershell
  node index.js
  ```
- For development (auto-restart on changes):
  ```powershell
  npx nodemon index.js
  ```

## API Endpoints
- `GET /cards/about` — Returns info about the API
- More endpoints coming soon!

## Notes
- Make sure to keep your `node_modules` out of version control (see `.gitignore`).
- For questions or issues, open an issue on GitHub.
