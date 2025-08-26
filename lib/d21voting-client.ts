import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { IDL } from "./idl/d21voting";

// Anchor instruction discriminators (8-byte hashes of instruction names)
const INSTRUCTION_DISCRIMINATORS = {
  create_poll: Buffer.from([0xb6, 0xab, 0x70, 0xee, 0x06, 0xdb, 0x0e, 0x6e]),
  add_candidate: Buffer.from([0xac, 0x22, 0x1e, 0xf7, 0xa5, 0xd2, 0xe0, 0xa4]),
  cast_votes: Buffer.from([0xec, 0x8b, 0x05, 0x04, 0x22, 0x21, 0xaf, 0x5c]),
  init_vote_record: Buffer.from([
    0x32, 0xa7, 0x2f, 0xa1, 0xd8, 0x90, 0x20, 0x55,
  ]),
  close_poll: Buffer.from([0x8b, 0xd5, 0xa2, 0x41, 0xac, 0x96, 0x7b, 0x43]),
};

export class D21VotingClient {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection: Connection, programId: string) {
    this.connection = connection;
    this.programId = new PublicKey(programId);
  }

  // Create a new poll
  async createPoll(
    authority: PublicKey,
    poll: PublicKey,
    pollId: bigint,
    title: string,
    maxCandidates: number,
    maxVotesPerVoter: number,
    maxTitleBytes: number
  ): Promise<TransactionInstruction> {
    // Create the instruction data
    const data = Buffer.alloc(8 + 8 + 4 + title.length + 2 + 2 + 4);
    let offset = 0;

    // Instruction discriminator (8 bytes for Anchor)
    data.set(INSTRUCTION_DISCRIMINATORS.create_poll, offset);
    offset += 8;

    // poll_id (u64)
    data.writeBigUInt64LE(pollId, offset);
    offset += 8;

    // title length (u32)
    data.writeUint32LE(title.length, offset);
    offset += 4;

    // title string
    data.write(title, offset);
    offset += title.length;

    // max_candidates (u16)
    data.writeUint16LE(maxCandidates, offset);
    offset += 2;

    // max_votes_per_voter (u16)
    data.writeUint16LE(maxVotesPerVoter, offset);
    offset += 2;

    // max_title_bytes (u32)
    data.writeUint32LE(maxTitleBytes, offset);

    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: poll, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });
  }

  // Add a candidate to a poll
  async addCandidate(
    poll: PublicKey,
    candidate: PublicKey,
    authority: PublicKey,
    index: number,
    name: string,
    maxNameBytes: number
  ): Promise<TransactionInstruction> {
    // Create the instruction data
    const data = Buffer.alloc(8 + 2 + 4 + name.length + 4);
    let offset = 0;

    // Instruction discriminator (8 bytes for Anchor)
    data.set(INSTRUCTION_DISCRIMINATORS.add_candidate, offset);
    offset += 8;

    // index (u16)
    data.writeUint16LE(index, offset);
    offset += 2;

    // name length (u32)
    data.writeUint32LE(name.length, offset);
    offset += 4;

    // name string
    data.write(name, offset);
    offset += name.length;

    // max_name_bytes (u32)
    data.writeUint32LE(maxNameBytes, offset);

    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: poll, isSigner: false, isWritable: true },
        { pubkey: candidate, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });
  }

  // Cast votes in a poll
  async castVotes(
    voter: PublicKey,
    poll: PublicKey,
    voteRecord: PublicKey,
    indices: number[]
  ): Promise<TransactionInstruction> {
    // Create the instruction data
    const data = Buffer.alloc(8 + 4 + indices.length * 2);
    let offset = 0;

    // Instruction discriminator (8 bytes for Anchor)
    data.set(INSTRUCTION_DISCRIMINATORS.cast_votes, offset);
    offset += 8;

    // indices length (u32)
    data.writeUint32LE(indices.length, offset);
    offset += 4;

    // indices array (u16[])
    for (const index of indices) {
      data.writeUint16LE(index, offset);
      offset += 2;
    }

    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: voter, isSigner: true, isWritable: true },
        { pubkey: poll, isSigner: false, isWritable: true },
        { pubkey: voteRecord, isSigner: false, isWritable: true },
      ],
      data,
    });
  }

  // Initialize a vote record
  async initVoteRecord(
    voter: PublicKey,
    poll: PublicKey,
    voteRecord: PublicKey
  ): Promise<TransactionInstruction> {
    // Create the instruction data
    const data = Buffer.alloc(8);

    // Instruction discriminator (8 bytes for Anchor)
    data.set(INSTRUCTION_DISCRIMINATORS.init_vote_record, 0);

    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: voter, isSigner: true, isWritable: true },
        { pubkey: poll, isSigner: false, isWritable: true },
        { pubkey: voteRecord, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });
  }

  // Close a poll
  async closePoll(
    authority: PublicKey,
    poll: PublicKey
  ): Promise<TransactionInstruction> {
    // Create the instruction data
    const data = Buffer.alloc(8);

    // Instruction discriminator (8 bytes for Anchor)
    data.set(INSTRUCTION_DISCRIMINATORS.close_poll, 0);

    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: poll, isSigner: false, isWritable: true },
      ],
      data,
    });
  }

  // Get account info
  async getAccountInfo<T>(address: PublicKey): Promise<T | null> {
    try {
      const accountInfo = await this.connection.getAccountInfo(address);
      if (!accountInfo) return null;

      // For now, return the raw data - you can add deserialization logic here
      return accountInfo.data as unknown as T;
    } catch (error) {
      console.error("Error fetching account info:", error);
      return null;
    }
  }

  // Get program accounts
  async getProgramAccounts(): Promise<{ pubkey: PublicKey; account: any }[]> {
    try {
      const accounts = await this.connection.getProgramAccounts(this.programId);
      return accounts.map(({ pubkey, account }) => ({
        pubkey,
        account: account.data,
      }));
    } catch (error) {
      console.error("Error fetching program accounts:", error);
      return [];
    }
  }
}

// Factory function to create the client
export function createD21VotingClient(
  connection: Connection,
  programId: string = IDL.metadata.address
): D21VotingClient {
  return new D21VotingClient(connection, programId);
}
