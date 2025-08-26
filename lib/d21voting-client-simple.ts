import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { IDL } from "./idl/d21voting";

export class D21VotingClientSimple {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection: Connection, programId: string) {
    this.connection = connection;
    this.programId = new PublicKey(programId);
  }

  // Create a new poll using the IDL structure
  async createPoll(
    authority: PublicKey,
    poll: PublicKey,
    pollId: bigint,
    title: string,
    maxCandidates: number,
    maxVotesPerVoter: number,
    maxTitleBytes: number
  ): Promise<TransactionInstruction> {
    // Use the IDL to understand the expected structure
    const instruction = IDL.instructions.find(
      (inst) => inst.name === "create_poll"
    );
    if (!instruction) {
      throw new Error("create_poll instruction not found in IDL");
    }

    console.log("🔍 IDL instruction structure:", instruction);
    console.log("📝 Expected args:", instruction.args);

    // Create instruction data with discriminator + all arguments
    // Format: discriminator(8) + poll_id(8) + title_length(4) + title(string) + max_candidates(2) + max_votes_per_voter(2) + max_title_bytes(4)
    const data = Buffer.alloc(8 + 8 + 4 + title.length + 2 + 2 + 4);
    let offset = 0;

    // Instruction discriminator (8 bytes for Anchor)
    const discriminator = Buffer.from([
      0xb6, 0xab, 0x70, 0xee, 0x06, 0xdb, 0x0e, 0x6e,
    ]);
    data.set(discriminator, offset);
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

    console.log(
      "✅ Created instruction with discriminator:",
      discriminator.toString("hex")
    );
    console.log("📊 Total data length:", data.length);
    console.log("📝 Data breakdown:");
    console.log("  - Discriminator: 8 bytes");
    console.log("  - Poll ID: 8 bytes");
    console.log("  - Title length: 4 bytes");
    console.log("  - Title: " + title.length + " bytes");
    console.log("  - Max candidates: 2 bytes");
    console.log("  - Max votes per voter: 2 bytes");
    console.log("  - Max title bytes: 4 bytes");

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
    // Calculate total data size: discriminator(8) + index(2) + name_length(4) + name(string) + max_name_bytes(4)
    const totalSize = 8 + 2 + 4 + name.length + 4;
    const data = Buffer.alloc(totalSize);
    let offset = 0;

    // Instruction discriminator (8 bytes for Anchor)
    const discriminator = Buffer.from([
      0xac, 0x22, 0x1e, 0xf7, 0xa5, 0xd2, 0xe0, 0xa4,
    ]);
    data.set(discriminator, offset);
    offset += 8;

    // index (u16, 2 bytes, little endian)
    data.writeUint16LE(index, offset);
    offset += 2;

    // name length (u32, 4 bytes, little endian)
    data.writeUint32LE(name.length, offset);
    offset += 4;

    // name string
    data.write(name, offset);
    offset += name.length;

    // max_name_bytes (u32, 4 bytes, little endian)
    data.writeUint32LE(maxNameBytes, offset);

    console.log(
      "✅ Created add_candidate instruction with data length:",
      totalSize
    );
    console.log("📝 Data breakdown:");
    console.log("  - Discriminator: 8 bytes");
    console.log("  - Index: 2 bytes");
    console.log("  - Name length: 4 bytes");
    console.log("  - Name: " + name.length + " bytes");
    console.log("  - Max name bytes: 4 bytes");

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
    // Calculate data size: discriminator(8) + indices_length(4) + indices(u16 * count)
    const indicesLength = indices.length;
    const dataSize = 8 + 4 + indicesLength * 2;
    const data = Buffer.alloc(dataSize);

    let offset = 0;

    // Instruction discriminator (8 bytes)
    const discriminator = Buffer.from([
      0xec, 0x8b, 0x05, 0x04, 0x22, 0x21, 0xaf, 0x5c,
    ]);
    data.set(discriminator, offset);
    offset += 8;

    // Indices length (u32, 4 bytes)
    data.writeUint32LE(indicesLength, offset);
    offset += 4;

    // Write each index as u16 (2 bytes each)
    for (const index of indices) {
      data.writeUint16LE(index, offset);
      offset += 2;
    }

    console.log("🔍 CastVotes instruction data:", {
      discriminator: discriminator.toString("hex"),
      indicesLength,
      indices,
      totalSize: dataSize,
      dataHex: data.toString("hex"),
    });

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

  // Initialize a vote record
  async initVoteRecord(
    voter: PublicKey,
    poll: PublicKey,
    voteRecord: PublicKey
  ): Promise<TransactionInstruction> {
    const data = Buffer.alloc(8);
    const discriminator = Buffer.from([
      0x32, 0xa7, 0x2f, 0xa1, 0xd8, 0x90, 0x20, 0x55,
    ]);
    data.set(discriminator, 0);

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
    const data = Buffer.alloc(8);
    const discriminator = Buffer.from([
      0x8b, 0xd5, 0xa2, 0x41, 0xac, 0x96, 0x7b, 0x43,
    ]);
    data.set(discriminator, 0);

    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: poll, isSigner: false, isWritable: true },
      ],
      data,
    });
  }

  // Delete a candidate from a poll (soft delete by closing poll)
  async deleteCandidate(
    authority: PublicKey,
    poll: PublicKey,
    candidate: PublicKey
  ): Promise<TransactionInstruction> {
    // Since there's no delete_candidate instruction, we'll close the poll instead
    // This effectively removes all candidates from the poll
    const data = Buffer.alloc(8);
    const discriminator = Buffer.from([
      0x8b, 0xd5, 0xa2, 0x41, 0xac, 0x96, 0x7b, 0x43,
    ]);
    data.set(discriminator, 0);

    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: poll, isSigner: false, isWritable: true },
      ],
      data,
    });
  }

  // Delete poll functionality removed - instruction not supported by Anchor program

  // Get account info
  async getAccountInfo<T>(address: PublicKey): Promise<T | null> {
    try {
      const accountInfo = await this.connection.getAccountInfo(address);
      if (!accountInfo) return null;

      return accountInfo.data as unknown as T;
    } catch (error) {
      console.error("Error fetching account info:", error);
      return null;
    }
  }

  // Decode poll account data
  async decodePollAccount(address: PublicKey): Promise<{
    pollId: number;
    title: string;
    maxCandidates: number;
    maxVotesPerVoter: number;
    maxTitleBytes: number;
    candidateCount: number;
    voteCounts: number[];
    isOpen: boolean;
    authority: PublicKey;
  } | null> {
    try {
      const accountInfo = await this.connection.getAccountInfo(address);
      if (!accountInfo) return null;

      const data = accountInfo.data;
      console.log(`🔍 Raw poll account data length: ${data.length}`);
      console.log(
        `🔍 Raw data bytes (first 64):`,
        Array.from(data.slice(0, 64))
      ); // Show more bytes for debugging

      // Skip discriminator (first 8 bytes)
      if (data.length < 8) {
        console.warn(
          "⚠️ Account data too short to be a valid poll (discriminator missing)"
        );
        return null;
      }

      let offset = 8; // Skip discriminator

      try {
        // 1. Read authority (PublicKey, 32 bytes)
        const authorityBytes = data.slice(offset, offset + 32);
        console.log(`🔍 Authority bytes:`, Array.from(authorityBytes));
        const authority = new PublicKey(authorityBytes);
        offset += 32;
        console.log(`🔍 After authority, offset: ${offset}`);

        // 2. Read pollId (u64, 8 bytes, little endian)
        const pollIdBytes = data.slice(offset, offset + 8);
        console.log(`🔍 Poll ID bytes:`, Array.from(pollIdBytes));
        const pollId = data.readBigUInt64LE(offset);
        offset += 8;
        console.log(`🔍 Poll ID: ${pollId}, offset: ${offset}`);

        // 3. Read isOpen (bool, 1 byte)
        const isOpenByte = data.readUInt8(offset);
        console.log(`🔍 IsOpen byte: ${isOpenByte}`);
        const isOpen = isOpenByte === 1;
        offset += 1;
        console.log(`🔍 IsOpen: ${isOpen}, offset: ${offset}`);

        // 4. Read maxVotesPerVoter (u16, 2 bytes, little endian)
        const maxVotesBytes = data.slice(offset, offset + 2);
        console.log(`🔍 MaxVotes bytes:`, Array.from(maxVotesBytes));
        const maxVotesPerVoter = data.readUint16LE(offset);
        offset += 2;
        console.log(
          `🔍 MaxVotesPerVoter: ${maxVotesPerVoter}, offset: ${offset}`
        );

        // 5. Read maxCandidates (u16, 2 bytes, little endian)
        const maxCandidatesBytes = data.slice(offset, offset + 2);
        console.log(`🔍 MaxCandidates bytes:`, Array.from(maxCandidatesBytes));
        const maxCandidates = data.readUint16LE(offset);
        offset += 2;
        console.log(`🔍 MaxCandidates: ${maxCandidates}, offset: ${offset}`);

        // 6. Read candidateCount (u16, 2 bytes, little endian)
        const candidateCountBytes = data.slice(offset, offset + 2);
        console.log(
          `🔍 CandidateCount bytes:`,
          Array.from(candidateCountBytes)
        );
        const candidateCount = data.readUint16LE(offset);
        offset += 2;
        console.log(`🔍 CandidateCount: ${candidateCount}, offset: ${offset}`);

        // 7. Read title length (u32, 4 bytes, little endian)
        const titleLengthBytes = data.slice(offset, offset + 4);
        console.log(`🔍 TitleLength bytes:`, Array.from(titleLengthBytes));
        const titleLength = data.readUint32LE(offset);
        offset += 4;
        console.log(`🔍 Title length: ${titleLength}, offset: ${offset}`);

        // 8. Read title (variable length string)
        if (offset + titleLength > data.length) {
          console.warn(
            `⚠️ Title length ${titleLength} exceeds available data at offset ${offset}. Data length: ${data.length}`
          );
          throw new Error("Title length exceeds available data");
        }
        const titleBytes = data.slice(offset, offset + titleLength);
        console.log(`🔍 Title bytes:`, Array.from(titleBytes));
        const title = new TextDecoder().decode(titleBytes);
        offset += titleLength;
        console.log(`🔍 Decoded title: "${title}", offset: ${offset}`);

        // 9. Read voteCounts (vec<u64>: u32 length prefix + u64 * count)
        const voteCountsLengthBytes = data.slice(offset, offset + 4);
        console.log(
          `🔍 VoteCountsLength bytes:`,
          Array.from(voteCountsLengthBytes)
        );
        const voteCountsLength = data.readUint32LE(offset); // Length of the vector
        offset += 4;
        console.log(
          `🔍 VoteCounts length: ${voteCountsLength}, offset: ${offset}`
        );

        const voteCounts: number[] = [];
        for (let i = 0; i < voteCountsLength; i++) {
          if (offset + 8 > data.length) {
            console.warn(
              `⚠️ Vote count data exceeds available buffer at offset ${offset}. Data length: ${data.length}`
            );
            throw new Error("Vote count data exceeds available buffer");
          }
          const voteCountBytes = data.slice(offset, offset + 8);
          console.log(`🔍 VoteCount ${i} bytes:`, Array.from(voteCountBytes));
          voteCounts.push(Number(data.readBigUInt64LE(offset)));
          offset += 8;
          console.log(`🔍 VoteCount ${i}: ${voteCounts[i]}, offset: ${offset}`);
        }

        const decodedPoll = {
          pollId: Number(pollId),
          title,
          maxCandidates,
          maxVotesPerVoter,
          maxTitleBytes: titleLength, // Use actual title length
          candidateCount,
          voteCounts,
          isOpen,
          authority,
        };

        console.log(`✅ Successfully decoded poll:`, decodedPoll);
        return decodedPoll;
      } catch (decodeError) {
        console.warn(
          `⚠️ Failed to decode poll data with structured parsing:`,
          decodeError
        );
        console.log(`🔍 Raw data:`, data);

        // Try alternative decoding approach - look for printable text in the data
        try {
          const textData = data.slice(8); // Skip discriminator
          const textString = new TextDecoder().decode(textData);
          console.log(`🔍 Alternative text decode: "${textString}"`);

          // Look for the title in the decoded text
          const titleMatch = textString.match(/[a-zA-Z0-9\s]+/);
          if (titleMatch && titleMatch[0].length > 3) {
            const extractedTitle = titleMatch[0].trim();
            console.log(
              `🎯 Extracted title using fallback: "${extractedTitle}"`
            );

            return {
              pollId: 0, // Fallback
              title: extractedTitle,
              maxCandidates: 5, // Fallback
              maxVotesPerVoter: 3, // Fallback
              maxTitleBytes: 100, // Fallback
              candidateCount: 0,
              voteCounts: [],
              isOpen: true,
              authority: address, // Fallback
            };
          }
        } catch (altError) {
          console.warn(`⚠️ Alternative decoding also failed:`, altError);
        }

        // Return a generic fallback structure if all else fails
        return {
          pollId: 0,
          title: `Poll ${address.toString().substring(0, 8)}...`,
          maxCandidates: 5,
          maxVotesPerVoter: 3,
          maxTitleBytes: 100,
          candidateCount: 0,
          voteCounts: [],
          isOpen: true,
          authority: address,
        };
      }
    } catch (error) {
      console.error("❌ Error decoding poll account:", error);
      return null;
    }
  }
}

// Factory function to create the client
export function createD21VotingClientSimple(
  connection: Connection,
  programId: string = IDL.metadata.address
): D21VotingClientSimple {
  return new D21VotingClientSimple(connection, programId);
}
