# D21 Voting Frontend

A React/Next.js frontend application for the D21 voting Solana program. This application allows users to create polls, add candidates, and cast votes using their Solana wallet.

## 🚀 Live Demo

**Try it out:** [https://d21voting.vercel.app/](https://d21voting.vercel.app/)

## Features

- 🔐 Solana wallet integration (Phantom, Solflare, Backpack)
- 📊 Create and manage voting polls
- 👥 Add candidates to polls
- 🗳️ Cast multiple votes (D21 voting system)
- 📱 Responsive design with Tailwind CSS
- ⚡ Real-time updates and notifications

## Prerequisites

- Node.js 18+
- Solana CLI tools
- A Solana wallet (Phantom, Solflare, or Backpack)
- Solana devnet SOL for testing

## Setup

### Option 1: Use the Live Version

The easiest way to try the application is to visit the [live demo](https://d21voting.vercel.app/) and connect your Solana wallet.

### Option 2: Run Locally

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Environment Configuration:**
   The app is configured to use Solana devnet by default. You can change this in `lib/solana.ts`:

   ```typescript
   export const NETWORK = clusterApiUrl("devnet"); // Change to 'mainnet-beta' for production
   ```

3. **Program ID:**
   The program ID is configured in `lib/solana.ts`. Make sure it matches your deployed program:
   ```typescript
   export const PROGRAM_ID = "2CNQMKvkPPfgiZFKJar6gyWc6bquTV2jW7NEHMfynLBs";
   ```

## Development

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Connect your wallet:**
   Click the "Connect Wallet" button and select your preferred Solana wallet

## Usage

### Creating a Poll

1. Connect your wallet
2. Click "Create New Poll"
3. Fill in the poll details:
   - Poll ID (unique identifier)
   - Title
   - Maximum number of candidates
   - Maximum votes per voter
4. Submit the transaction

### Adding Candidates

1. Navigate to a poll you created
2. Use the "Add Candidate" function (authority only)
3. Provide candidate name and index

### Voting

1. Select a poll to vote in
2. Choose your preferred candidates
3. Cast your votes (up to the maximum allowed)
4. Confirm the transaction

## Architecture

- **`lib/solana.ts`** - Solana connection and program setup
- **`lib/idl/d21voting.ts`** - TypeScript types from the program IDL
- **`lib/program-utils.ts`** - Utility functions for program interactions
- **`components/`** - React components for the UI
- **`WalletContextProvider.tsx`** - Solana wallet integration
- **`VotingInterface.tsx`** - Main voting interface
- **`CreatePollForm.tsx`** - Poll creation form
- **`PollList.tsx`** - Display and manage polls

## Supported Wallets

- Phantom
- Solflare
- Backpack

## Network Support

- Devnet (default)
- Testnet
- Mainnet-beta

## Troubleshooting

### Common Issues

1. **Wallet not connecting:**
   - Ensure you have a Solana wallet extension installed
   - Check that you're on the correct network (devnet/testnet/mainnet)

2. **Transaction failures:**
   - Verify you have sufficient SOL for transaction fees
   - Check the browser console for detailed error messages
   - Ensure the program is deployed to the correct network

3. **Program not found:**
   - Verify the PROGRAM_ID matches your deployed program
   - Check that the program is deployed to the current network

### Debug Mode

Enable debug logging by checking the browser console for detailed transaction and program interaction logs.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
