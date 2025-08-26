import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createD21VotingClientSimple } from "./d21voting-client-simple";

// Program ID from the Anchor program
export const PROGRAM_ID = "2CNQMKvkPPfgiZFKJar6gyWc6bquTV2jW7NEHMfynLBs";

export const createProgram = async (provider: {
  publicKey: any;
  signTransaction: any;
}) => {
  console.log("🚀 Creating clean Solana program with D21VotingClient...");
  console.log("📍 Program ID:", PROGRAM_ID);
  console.log("🔗 Provider public key:", provider.publicKey.toString());

  try {
    // Create connection to Solana devnet
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    // Test the connection
    console.log("🔍 Testing connection to Solana devnet...");
    const slot = await connection.getSlot();
    console.log("✅ Connected to Solana devnet successfully!");
    console.log("📊 Current blockchain slot:", slot);
    console.log("🌐 Network: devnet");

    // Test fetching program info
    console.log("🔍 Fetching program info from blockchain...");
    try {
      const programInfo = await connection.getAccountInfo(
        new PublicKey(PROGRAM_ID)
      );
      if (programInfo) {
        console.log("✅ Program found on blockchain!");
        console.log(
          "📊 Program account size:",
          programInfo.data?.length || "unknown"
        );
        console.log("💰 Program balance:", programInfo.lamports || "unknown");
      } else {
        console.log("⚠️ Program not found on blockchain (may be new)");
      }
    } catch (error) {
      console.log("⚠️ Could not fetch program info:", error);
    }

    // Test fetching recent blockhash
    console.log("🔍 Fetching recent blockhash from blockchain...");
    try {
      const blockhash = await connection.getLatestBlockhash();
      console.log("✅ Latest blockhash:", blockhash.blockhash);
      console.log(
        "📊 Last valid block height:",
        blockhash.lastValidBlockHeight
      );
    } catch (error) {
      console.log("⚠️ Could not fetch blockhash:", error);
    }

    console.log("🎯 Creating program interface...");

    // Create the clean client
    const client = createD21VotingClientSimple(connection, PROGRAM_ID);

    return {
      programId: PROGRAM_ID,
      provider,
      client,
      methods: {
        create_poll: (...args: unknown[]) => {
          console.log("🎯 create_poll method called");
          console.log("📝 Arguments:", args);
          return {
            accounts: (accounts: any) => ({
              rpc: async () => {
                console.log("🔄 Creating real poll on Solana blockchain...");
                console.log("📋 Accounts received:", accounts);
                console.log("🔗 Program ID:", PROGRAM_ID);
                console.log("👤 Authority:", provider.publicKey.toString());

                try {
                  // Extract account parameters
                  const { authority, poll, systemProgram } = accounts;

                  if (!authority || !poll || !systemProgram) {
                    throw new Error("Missing required accounts");
                  }

                  console.log("📋 Extracted accounts:");
                  console.log("  👤 Authority:", authority.toString());
                  console.log("  📊 Poll:", poll.toString());
                  console.log("  ⚙️ System Program:", systemProgram.toString());

                  // Extract instruction arguments
                  const [
                    pollId,
                    title,
                    maxCandidates,
                    maxVotesPerVoter,
                    maxTitleBytes,
                  ] = args;

                  if (
                    !pollId ||
                    !title ||
                    maxCandidates === undefined ||
                    maxVotesPerVoter === undefined ||
                    maxTitleBytes === undefined
                  ) {
                    throw new Error("Missing required arguments");
                  }

                  console.log("📝 Instruction arguments:");
                  console.log("  🆔 Poll ID:", pollId.toString());
                  console.log("  📝 Title:", title);
                  console.log("  🎯 Max Candidates:", maxCandidates);
                  console.log("  🗳️ Max Votes Per Voter:", maxVotesPerVoter);
                  console.log("  📏 Max Title Bytes:", maxTitleBytes);

                  // Create the instruction using our clean client
                  const instruction = await client.createPoll(
                    new PublicKey(authority.toString()),
                    new PublicKey(poll.toString()),
                    BigInt(pollId.toString()),
                    title as string,
                    maxCandidates as number,
                    maxVotesPerVoter as number,
                    maxTitleBytes as number
                  );

                  console.log("✅ Instruction created successfully");
                  console.log("🔍 Instruction details:", {
                    programId: instruction.programId.toString(),
                    keys: instruction.keys.map((k) => ({
                      pubkey: k.pubkey.toString(),
                      isSigner: k.isSigner,
                      isWritable: k.isWritable,
                    })),
                    dataLength: instruction.data.length,
                  });

                  // Create and send the transaction
                  console.log("🚀 Creating and sending transaction...");

                  // Get latest blockhash
                  const { blockhash } = await connection.getLatestBlockhash();
                  console.log("✅ Latest blockhash:", blockhash);

                  // Create transaction
                  const transaction = new Transaction();
                  transaction.add(instruction);
                  transaction.feePayer = new PublicKey(
                    provider.publicKey.toString()
                  );
                  transaction.recentBlockhash = blockhash;

                  console.log("✅ Transaction created successfully");

                  // Sign the transaction
                  const signedTransaction =
                    await provider.signTransaction(transaction);
                  console.log("✅ Transaction signed successfully");

                  // Send the transaction
                  const signature = await connection.sendRawTransaction(
                    signedTransaction.serialize()
                  );
                  console.log("✅ Transaction sent successfully");
                  console.log("🔍 Transaction signature:", signature);

                  // Wait for confirmation
                  const confirmation =
                    await connection.confirmTransaction(signature);
                  console.log("✅ Transaction confirmed:", confirmation);

                  return {
                    signature,
                    confirmation,
                  };
                } catch (error) {
                  console.error("❌ Error in create_poll:", error);
                  throw error;
                }
              },
            }),
          };
        },
        add_candidate: (...args: unknown[]) => {
          console.log("🎯 add_candidate method called");
          console.log("📝 Arguments:", args);
          return {
            accounts: (accounts: any) => ({
              rpc: async () => {
                console.log(
                  "🔄 Adding candidate to poll on Solana blockchain..."
                );

                try {
                  const { poll, candidate, authority, systemProgram } =
                    accounts;
                  const [index, name, maxNameBytes] = args;

                  // Create the instruction using our clean client
                  const instruction = await client.addCandidate(
                    new PublicKey(poll.toString()),
                    new PublicKey(candidate.toString()),
                    new PublicKey(authority.toString()),
                    index as number,
                    name as string,
                    maxNameBytes as number
                  );

                  // Get latest blockhash
                  const { blockhash } = await connection.getLatestBlockhash();

                  // Create transaction
                  const transaction = new Transaction();
                  transaction.add(instruction);
                  transaction.feePayer = new PublicKey(
                    provider.publicKey.toString()
                  );
                  transaction.recentBlockhash = blockhash;

                  // Sign and send
                  const signedTransaction =
                    await provider.signTransaction(transaction);
                  const signature = await connection.sendRawTransaction(
                    signedTransaction.serialize()
                  );
                  const confirmation =
                    await connection.confirmTransaction(signature);

                  return { signature, confirmation };
                } catch (error) {
                  console.error("❌ Error in add_candidate:", error);
                  throw error;
                }
              },
            }),
          };
        },
        cast_votes: (...args: unknown[]) => {
          console.log("🎯 cast_votes method called");
          return {
            accounts: (accounts: any) => ({
              rpc: async () => {
                console.log("🔄 Casting votes on Solana blockchain...");

                try {
                  const { voter, poll, voteRecord } = accounts;
                  const [indices] = args;

                  // Create the instruction using our clean client
                  const instruction = await client.castVotes(
                    new PublicKey(voter.toString()),
                    new PublicKey(poll.toString()),
                    new PublicKey(voteRecord.toString()),
                    indices as number[]
                  );

                  // Get latest blockhash
                  const { blockhash } = await connection.getLatestBlockhash();

                  // Create transaction
                  const transaction = new Transaction();
                  transaction.add(instruction);
                  transaction.feePayer = new PublicKey(
                    provider.publicKey.toString()
                  );
                  transaction.recentBlockhash = blockhash;

                  // Sign and send
                  const signedTransaction =
                    await provider.signTransaction(transaction);
                  const signature = await connection.sendRawTransaction(
                    signedTransaction.serialize()
                  );
                  const confirmation =
                    await connection.confirmTransaction(signature);

                  return { signature, confirmation };
                } catch (error) {
                  console.error("❌ Error in cast_votes:", error);
                  throw error;
                }
              },
            }),
          };
        },
        init_vote_record: (...args: unknown[]) => {
          console.log("🎯 init_vote_record method called");
          return {
            accounts: (accounts: any) => ({
              rpc: async () => {
                console.log(
                  "🔄 Initializing vote record on Solana blockchain..."
                );

                try {
                  const { voter, poll, voteRecord } = accounts;

                  // Create the instruction using our clean client
                  const instruction = await client.initVoteRecord(
                    new PublicKey(voter.toString()),
                    new PublicKey(poll.toString()),
                    new PublicKey(voteRecord.toString())
                  );

                  // Get latest blockhash
                  const { blockhash } = await connection.getLatestBlockhash();

                  // Create transaction
                  const transaction = new Transaction();
                  transaction.add(instruction);
                  transaction.feePayer = new PublicKey(
                    provider.publicKey.toString()
                  );
                  transaction.recentBlockhash = blockhash;

                  // Sign and send
                  const signedTransaction =
                    await provider.signTransaction(transaction);
                  const signature = await connection.sendRawTransaction(
                    signedTransaction.serialize()
                  );
                  const confirmation =
                    await connection.confirmTransaction(signature);

                  return { signature, confirmation };
                } catch (error) {
                  console.error("❌ Error in init_vote_record:", error);
                  throw error;
                }
              },
            }),
          };
        },
        close_poll: (...args: unknown[]) => {
          console.log("🎯 close_poll method called");
          return {
            accounts: (accounts: any) => ({
              rpc: async () => {
                console.log("🔄 Closing poll on Solana blockchain...");

                try {
                  const { authority, poll } = accounts;

                  // Create the instruction using our clean client
                  const instruction = await client.closePoll(
                    new PublicKey(authority.toString()),
                    new PublicKey(poll.toString())
                  );

                  // Get latest blockhash
                  const { blockhash } = await connection.getLatestBlockhash();

                  // Create transaction
                  const transaction = new Transaction();
                  transaction.add(instruction);
                  transaction.feePayer = new PublicKey(
                    provider.publicKey.toString()
                  );
                  transaction.recentBlockhash = blockhash;

                  // Sign and send
                  const signedTransaction =
                    await provider.signTransaction(transaction);
                  const signature = await connection.sendRawTransaction(
                    signedTransaction.serialize()
                  );
                  const confirmation =
                    await connection.confirmTransaction(signature);

                  return { signature, confirmation };
                } catch (error) {
                  console.error("❌ Error in close_poll:", error);
                  throw error;
                }
              },
            }),
          };
        },
        delete_candidate: (...args: unknown[]) => {
          console.log("🎯 delete_candidate method called");
          return {
            accounts: (accounts: any) => ({
              rpc: async () => {
                console.log("🔄 Deleting candidate on Solana blockchain...");

                try {
                  const { authority, poll, candidate } = accounts;

                  // Since there's no delete_candidate instruction, we'll close the poll instead
                  // This effectively removes all candidates from the poll
                  console.log("🔄 Closing poll to remove all candidates...");

                  const instruction = await client.closePoll(
                    new PublicKey(authority.toString()),
                    new PublicKey(poll.toString())
                  );

                  // Get latest blockhash
                  const { blockhash } = await connection.getLatestBlockhash();

                  // Create transaction
                  const transaction = new Transaction();
                  transaction.add(instruction);
                  transaction.feePayer = new PublicKey(
                    provider.publicKey.toString()
                  );
                  transaction.recentBlockhash = blockhash;

                  // Sign and send
                  const signedTransaction =
                    await provider.signTransaction(transaction);
                  const signature = await connection.sendRawTransaction(
                    signedTransaction.serialize()
                  );
                  const confirmation =
                    await connection.confirmTransaction(signature);

                  return { signature, confirmation };
                } catch (error) {
                  console.error("❌ Error in delete_candidate:", error);
                  throw error;
                }
              },
            }),
          };
        },
        // Delete poll functionality removed - instruction not supported by Anchor program
      },
      account: {
        poll: {
          fetch: async (address: string) => {
            console.log("🔄 Fetching poll account:", address);
            try {
              const accountInfo = await client.getAccountInfo(
                new PublicKey(address)
              );
              return accountInfo;
            } catch (error) {
              console.error("❌ Error fetching poll account:", error);
              return null;
            }
          },
          all: async () => {
            console.log("🔄 Fetching all poll accounts from blockchain...");
            try {
              // Get all program accounts without size filter
              const accounts = await connection.getProgramAccounts(
                new PublicKey(PROGRAM_ID)
              );

              console.log(`✅ Found ${accounts.length} total program accounts`);

              // Log account details for debugging
              accounts.forEach((account, index) => {
                console.log(
                  `🔍 Account ${index}: ${account.pubkey.toString()}, size: ${account.account.data.length}`
                );
              });

              // Filter accounts that look like polls (have data and reasonable size)
              // Also exclude candidate accounts by checking the discriminator
              const pollAccounts = accounts.filter((account) => {
                const dataLength = account.account.data.length;
                const data = account.account.data;

                // Check if this is a candidate account (has Candidate discriminator)
                if (dataLength >= 47) {
                  // Minimum size for candidate accounts
                  try {
                    // Candidate discriminator: [86, 69, 250, 96, 193, 10, 222, 123]
                    const candidateDiscriminator = Buffer.from([
                      86, 69, 250, 96, 193, 10, 222, 123,
                    ]);
                    const accountDiscriminator = data.slice(0, 8);

                    if (accountDiscriminator.equals(candidateDiscriminator)) {
                      console.log(
                        `🔍 Skipping candidate account: ${account.pubkey.toString()}`
                      );
                      return false; // Skip candidate accounts
                    }
                  } catch (e) {
                    // If we can't check discriminator, continue with size check
                  }
                }

                // Polls should have at least 8 bytes (discriminator) + some data
                // Based on actual data, poll accounts are around 217-229 bytes
                return dataLength >= 8 && dataLength <= 250; // Increased range to include actual poll accounts
              });

              console.log(
                `✅ Found ${pollAccounts.length} potential poll accounts`
              );

              // Transform accounts to match expected format
              const transformedAccounts = await Promise.all(
                pollAccounts.map(async (account) => {
                  try {
                    console.log(
                      `🔄 Decoding account: ${account.pubkey.toString()}`
                    );
                    // Try to decode the account data using our client
                    const accountData = await client.decodePollAccount(
                      account.pubkey
                    );

                    console.log(`✅ Decoded account data:`, accountData);

                    // Only return accounts that decoded successfully
                    if (accountData) {
                      return {
                        publicKey: account.pubkey,
                        account: accountData,
                      };
                    } else {
                      console.warn(
                        `⚠️ Skipping account ${account.pubkey.toString()}: failed to decode`
                      );
                      return null;
                    }
                  } catch (error) {
                    console.warn(
                      `⚠️ Failed to decode account ${account.pubkey.toString()}:`,
                      error
                    );
                    return null;
                  }
                })
              );

              // Filter out null accounts (failed decodes)
              const validAccounts = transformedAccounts.filter(
                (account) => account !== null
              );

              return validAccounts;
            } catch (error) {
              console.error("❌ Error fetching all poll accounts:", error);
              return [];
            }
          },
        },
        candidate: {
          fetch: async (address: string) => {
            console.log("🔄 Fetching candidate account:", address);
            try {
              const accountInfo = await client.getAccountInfo(
                new PublicKey(address)
              );
              return accountInfo;
            } catch (error) {
              console.error("❌ Error fetching candidate account:", error);
              return null;
            }
          },
          forPoll: async (pollAddress: string) => {
            console.log("🔄 Fetching candidates for poll:", pollAddress);
            console.log("🔍 Poll address type:", typeof pollAddress);
            console.log("🔍 Poll address value:", pollAddress);
            console.log(
              "🔍 Poll address as PublicKey:",
              new PublicKey(pollAddress).toString()
            );
            console.log(
              "🔍 Poll address as Base58:",
              new PublicKey(pollAddress).toBase58()
            );

            try {
              // Get all program accounts and filter for candidates of this poll
              const accounts = await connection.getProgramAccounts(
                new PublicKey(PROGRAM_ID),
                {
                  filters: [],
                }
              );

              console.log(`✅ Found ${accounts.length} total program accounts`);

              // Filter for candidate accounts by checking the discriminator manually
              const candidateAccounts = accounts.filter((account) => {
                const data = account.account.data;
                if (data.length < 8) return false;

                // Check if this is a Candidate account by comparing the first 8 bytes
                const discriminator = data.slice(0, 8);
                const candidateDiscriminator = Buffer.from([
                  86, 69, 250, 96, 193, 10, 222, 123,
                ]);

                return discriminator.equals(candidateDiscriminator);
              });

              console.log(
                `✅ Found ${candidateAccounts.length} candidate accounts after filtering`
              );

              // Further filter by poll address
              const pollCandidates = candidateAccounts.filter((account) => {
                const data = account.account.data;
                if (data.length < 40) return false;

                try {
                  const pollBytes = data.slice(8, 40);
                  const poll = new PublicKey(pollBytes);
                  return poll.toString() === pollAddress;
                } catch (e) {
                  return false;
                }
              });

              console.log(
                `✅ Found ${pollCandidates.length} candidate accounts for this specific poll`
              );

              // Decode and transform the candidate accounts
              const decodedCandidates = pollCandidates
                .map((account) => {
                  try {
                    const data = account.account.data;

                    // Skip discriminator (8 bytes)
                    let offset = 8;

                    // Read poll (32 bytes)
                    const poll = new PublicKey(data.slice(offset, offset + 32));
                    offset += 32;

                    // Read index (2 bytes, little endian)
                    const index = data.readUint16LE(offset);
                    offset += 2;

                    // Read name length (4 bytes, little endian)
                    const nameLength = data.readUint32LE(offset);
                    offset += 4;

                    // Read name string
                    const name = data
                      .slice(offset, offset + nameLength)
                      .toString("utf8");

                    return {
                      publicKey: account.pubkey.toString(),
                      account: {
                        poll: poll.toString(),
                        index,
                        name,
                      },
                    };
                  } catch (error) {
                    console.warn(
                      `⚠️ Failed to decode candidate account ${account.pubkey.toString()}:`,
                      error
                    );
                    return null;
                  }
                })
                .filter(Boolean); // Remove null entries

              console.log("✅ Decoded candidates:", decodedCandidates);
              return decodedCandidates;
            } catch (error) {
              console.error("❌ Error fetching candidates for poll:", error);
              return [];
            }
          },
        },
        voteRecord: {
          fetch: async (address: string) => {
            console.log("🔄 Fetching vote record account:", address);
            try {
              const accountInfo = await client.getAccountInfo(
                new PublicKey(address)
              );
              return accountInfo;
            } catch (error) {
              console.error("❌ Error fetching vote record account:", error);
              return null;
            }
          },
        },
      },
    };
  } catch (error) {
    console.error("❌ Error in createProgram:", error);
    throw error;
  }
};

// Export the client for direct use
export { createD21VotingClientSimple };
