import { PublicKey, Transaction } from "@solana/web3.js";

export interface Wallet {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  payer: PublicKey;
}

export interface Program {
  programId: string;
  provider: {
    publicKey: any;
    signTransaction: any;
  };
  client: any;
  methods: {
    create_poll: (...args: unknown[]) => {
      accounts: (accounts: any) => {
        rpc: () => Promise<{ signature: string }>;
      };
    };
    [key: string]: (...args: unknown[]) => any;
  };
  account?: {
    poll: {
      all: () => Promise<any[]>;
    };
  };
  candidates?: {
    fetch: (pollAddress: string) => Promise<any[]>;
  };
  voteRecord?: {
    fetch: (address: string) => Promise<any>;
  };
}

export interface PollAccount {
  title: string;
  candidateCount: number;
  voteCounts: number[];
  isOpen: boolean;
  maxVotesPerVoter: number;
  maxCandidates: number;
  authority: PublicKey | string;
  pollId: string | number;
}

export interface Candidate {
  publicKey: string;
  account: {
    name: string;
    index: number;
  };
}

export interface Poll {
  publicKey: string;
  account: PollAccount;
  candidates: Candidate[];
}

export interface PollData {
  publicKey: string;
  account: {
    authority: string;
    pollId: string;
    isOpen: boolean;
    maxVotesPerVoter: number;
    maxCandidates: number;
    candidateCount: number;
    title: string;
    voteCounts: any[];
  };
  candidates: any[];
}

export interface CreatePollFormProps {
  onPollCreated: (pollData?: PollData) => void;
}

export interface DashboardStatsProps {
  polls: Poll[];
  className?: string;
}

export interface SearchAndFilterProps {
  polls: Poll[];
  onFilterChange: (filtered: Poll[]) => void;
  className?: string;
}
