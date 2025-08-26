import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { BN } from "bn.js";
import { D21Voting } from "./idl/d21voting";
import { PROGRAM_ID } from "./solana";
import { createSolanaClient } from "gill";

export interface PollAccount {
  publicKey: string;
  account: {
    authority: string;
    pollId: any;
    isOpen: boolean;
    maxVotesPerVoter: number;
    maxCandidates: number;
    candidateCount: number;
    title: string;
    voteCounts: any[];
    candidates?: CandidateAccount[]; // Add candidates to the poll account
  };
}

export interface CandidateAccount {
  publicKey: string;
  account: {
    poll: string;
    index: number;
    name: string;
  };
}

export interface VoteRecordAccount {
  publicKey: string;
  account: {
    poll: string;
    voter: string;
    usedVotes: number;
    votedBitmap: Buffer;
  };
}

export class ProgramUtils {
  constructor(private program: any, private connection: Connection) {}

  // Fetch all polls
  async fetchPolls(): Promise<PollAccount[]> {
    try {
      // Try to fetch using program methods first
      try {
        const polls = await this.program.account.poll.all();
        console.log("Fetched polls using program:", polls);

        // For each poll, fetch its candidates
        const pollsWithCandidates = await Promise.all(
          polls.map(async (poll: any) => {
            try {
              // Fetch candidates for this poll
              const candidates = await this.fetchCandidates(
                new PublicKey(poll.publicKey)
              );

              return {
                publicKey: poll.publicKey.toString(),
                account: {
                  ...poll.account,
                  voteCounts: poll.account.voteCounts.map((vc: any) =>
                    vc.toNumber()
                  ),
                  candidates: candidates, // Add candidates to the poll
                },
              };
            } catch (candidateError) {
              console.warn(
                `Failed to fetch candidates for poll ${poll.publicKey}:`,
                candidateError
              );
              // Return poll without candidates if fetching fails
              return {
                publicKey: poll.publicKey.toString(),
                account: {
                  ...poll.account,
                  voteCounts: poll.account.voteCounts.map((vc: any) =>
                    vc.toNumber()
                  ),
                  candidates: [], // Empty candidates array
                },
              };
            }
          })
        );

        console.log("Polls with candidates:", pollsWithCandidates);
        return pollsWithCandidates;
      } catch (programError) {
        console.warn(
          "Failed to fetch polls using program, trying direct connection:",
          programError
        );

        // Fallback: Try to fetch using connection directly
        try {
          const programId = new PublicKey(PROGRAM_ID);
          console.log(
            "Attempting to fetch accounts for program:",
            programId.toString()
          );

          const accounts = await this.connection.getProgramAccounts(programId, {
            filters: [
              {
                memcmp: {
                  offset: 0,
                  bytes: "poll", // Filter for poll accounts
                },
              },
            ],
          });

          console.log("Fetched poll accounts directly:", accounts);

          // Parse the accounts manually (this is a simplified approach)
          return accounts.map((account) => ({
            publicKey: account.pubkey.toString(),
            account: {
              authority: "Unknown", // We'd need to deserialize this properly
              pollId: "Unknown",
              isOpen: true,
              maxVotesPerVoter: 0,
              maxCandidates: 0,
              candidateCount: 0,
              title: "Unknown Poll",
              voteCounts: [],
              candidates: [], // Empty candidates array for fallback
            },
          }));
        } catch (connectionError) {
          console.warn("Failed to fetch accounts directly:", connectionError);
          return [];
        }
      }
    } catch (error) {
      console.error("Error fetching polls:", error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  // Fetch candidates for a specific poll
  async fetchCandidates(pollPublicKey: PublicKey): Promise<CandidateAccount[]> {
    try {
      console.log(
        `🔍 Fetching candidates for poll: ${pollPublicKey.toString()} from Solana devnet`
      );

      // Use Gill's RPC to get all program accounts from the blockchain
      const { rpc } = createSolanaClient({ urlOrMoniker: "devnet" });

      // Get all accounts owned by our program from the blockchain
      const allAccounts = await rpc
        .getProgramAccounts(PROGRAM_ID as any)
        .send();

      console.log("🔍 Blockchain accounts found:", allAccounts.length);
      console.log("🔍 Program ID:", PROGRAM_ID);

      // Log the first few accounts to see their structure
      if (allAccounts.length > 0) {
        console.log("🔍 First blockchain account structure:", {
          pubkey: allAccounts[0].pubkey,
          dataLength: allAccounts[0].account.data.length,
          dataPreview: Array.from(allAccounts[0].account.data.slice(0, 32))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" "),
        });
      }

      // Filter accounts that contain the poll public key (potential candidates)
      const potentialCandidates = allAccounts.filter((account: any) => {
        try {
          // Log each account's data structure to understand what we're working with
          console.log(`🔍 Blockchain account ${account.pubkey.toString()}:`, {
            dataLength: account.account.data.length,
            dataPreview: Array.from(account.account.data.slice(0, 32))
              .map((b) => b.toString(16).padStart(2, "0"))
              .join(" "),
          });

          // Check if this account contains the poll public key anywhere
          const pollKeyBuffer = pollPublicKey.toBuffer();
          const pollKeyHex = pollKeyBuffer.toString("hex");

          // Convert account data to hex string for searching
          const accountDataHex = Array.from(account.account.data)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          if (accountDataHex.includes(pollKeyHex)) {
            console.log(
              `✅ Found blockchain account containing poll key: ${account.pubkey.toString()}`
            );
            return true;
          }

          return false;
        } catch (filterError) {
          console.log(`⚠️ Error filtering blockchain account:`, filterError);
          return false;
        }
      });

      console.log(
        `🔍 Found ${
          potentialCandidates.length
        } potential candidate accounts on blockchain for poll ${pollPublicKey.toString()}`
      );

      // Parse the candidate data from blockchain accounts
      const candidates = potentialCandidates
        .map((account: any, index: number) => {
          try {
            const data = account.account.data;
            console.log(
              `🔍 Parsing blockchain candidate data for account ${account.pubkey.toString()}:`,
              {
                dataLength: data.length,
                fullDataHex: Array.from(data)
                  .map((b) => b.toString(16).padStart(2, "0"))
                  .join(" "),
              }
            );

            // Try to find the poll key and extract data after it
            const pollKeyBuffer = pollPublicKey.toBuffer();
            const pollKeyStart = data.indexOf(pollKeyBuffer);

            if (pollKeyStart !== -1 && pollKeyStart + 32 < data.length) {
              console.log(
                `✅ Found poll key at offset ${pollKeyStart} in blockchain data`
              );

              // Try to read index and name after the poll key
              const dataAfterPoll = data.slice(pollKeyStart + 32);

              if (dataAfterPoll.length >= 3) {
                // Try to read index (2 bytes) and name length (1 byte)
                try {
                  const candidateIndex = dataAfterPoll.readUInt16LE(0);
                  const nameLength = dataAfterPoll.readUInt8(2);

                  if (dataAfterPoll.length >= 3 + nameLength) {
                    const nameBytes = dataAfterPoll.slice(3, 3 + nameLength);
                    const candidateName = nameBytes.toString("utf8");

                    console.log(
                      `📝 Successfully parsed blockchain candidate: index=${candidateIndex}, name="${candidateName}"`
                    );

                    return {
                      publicKey: account.pubkey.toString(),
                      account: {
                        poll: pollPublicKey.toString(),
                        index: candidateIndex,
                        name: candidateName,
                      },
                    };
                  }
                } catch (parseError) {
                  console.log(
                    `⚠️ Error parsing structured blockchain data:`,
                    parseError
                  );
                }
              }
            }

            // If structured parsing fails, try to extract any readable text from blockchain data
            const readableText = data
              .toString("utf8")
              .replace(/[^\x20-\x7E]/g, "");
            if (readableText.length > 0) {
              console.log(
                `📝 Found readable text in blockchain data: "${readableText}"`
              );
              const candidateName = readableText.substring(0, 20); // Take first 20 chars

              return {
                publicKey: account.pubkey.toString(),
                account: {
                  poll: pollPublicKey.toString(),
                  index: index,
                  name: candidateName,
                },
              };
            }

            console.log(
              `⚠️ Could not parse candidate data from blockchain account ${account.pubkey.toString()}`
            );
            return null;
          } catch (parseError) {
            console.log(
              `❌ Error parsing blockchain candidate data:`,
              parseError
            );
            return null;
          }
        })
        .filter(Boolean); // Remove any null entries

      console.log(
        `✅ Successfully parsed ${candidates.length} candidates from Solana devnet blockchain`
      );

      // Return only blockchain data - no local storage fallback
      return candidates;
    } catch (error) {
      console.error(
        `❌ Error fetching candidates from Solana devnet for poll ${pollPublicKey.toString()}:`,
        error
      );

      // Return empty array if blockchain fetch fails - no fallback to local storage
      console.log(
        "❌ No candidates found on blockchain - returning empty array"
      );
      return [];
    }
  }

  // Fetch vote record for a specific voter and poll
  async fetchVoteRecord(
    pollPublicKey: PublicKey,
    voterPublicKey: PublicKey
  ): Promise<VoteRecordAccount | null> {
    try {
      const [voteRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          pollPublicKey.toBuffer(),
          voterPublicKey.toBuffer(),
        ],
        new PublicKey(PROGRAM_ID)
      );

      const voteRecord = await this.program.account.voteRecord.fetch(
        voteRecordPda
      );
      return {
        publicKey: voteRecordPda.toString(),
        account: voteRecord,
      };
    } catch (error) {
      // Vote record might not exist yet
      return null;
    }
  }

  // Add a candidate to a poll
  async addCandidate(
    pollPublicKey: PublicKey,
    index: number,
    name: string,
    maxNameBytes: number
  ) {
    try {
      const [candidatePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("candidate"),
          pollPublicKey.toBuffer(),
          new BN(index).toArrayLike(Buffer, "le", 2),
        ],
        new PublicKey(PROGRAM_ID)
      );

      const tx = await this.program.methods
        .add_candidate(index, name, maxNameBytes)
        .accounts({
          poll: pollPublicKey,
          candidate: candidatePda,
          authority: this.program.provider.publicKey!,
          systemProgram: new PublicKey("11111111111111111111111111111111"),
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error("Error adding candidate:", error);
      throw error;
    }
  }

  // Cast votes for candidates
  async castVotes(
    pollPublicKey: PublicKey,
    voterPublicKey: PublicKey,
    candidateIndices: number[]
  ) {
    try {
      const [voteRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          pollPublicKey.toBuffer(),
          voterPublicKey.toBuffer(),
        ],
        new PublicKey(PROGRAM_ID)
      );

      const tx = await this.program.methods
        .cast_votes(candidateIndices)
        .accounts({
          voter: voterPublicKey,
          poll: pollPublicKey,
          voteRecord: voteRecordPda,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error("Error casting votes:", error);
      throw error;
    }
  }

  // Initialize vote record for a voter
  async initVoteRecord(pollPublicKey: PublicKey, voterPublicKey: PublicKey) {
    try {
      const [voteRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          pollPublicKey.toBuffer(),
          voterPublicKey.toBuffer(),
        ],
        new PublicKey(PROGRAM_ID)
      );

      const tx = await this.program.methods
        .init_vote_record()
        .accounts({
          voter: voterPublicKey,
          poll: pollPublicKey,
          voteRecord: voteRecordPda,
          systemProgram: new PublicKey("11111111111111111111111111111111"),
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error("Error initializing vote record:", error);
      throw error;
    }
  }

  // Close a poll (authority only)
  async closePoll(pollPublicKey: PublicKey) {
    try {
      const tx = await this.program.methods
        .close_poll()
        .accounts({
          authority: this.program.provider.publicKey!,
          poll: pollPublicKey,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error("Error closing poll:", error);
      throw error;
    }
  }
}
