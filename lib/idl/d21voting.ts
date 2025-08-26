export type D21Voting = {
  version: "0.1.0";
  name: "d21voting";
  metadata: {
    address: string;
    name: string;
    version: string;
    spec: string;
    description: string;
  };
  instructions: [
    {
      name: "add_candidate";
      accounts: [
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "candidate";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
          relations: ["poll"];
        },
        {
          name: "system_program";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "index";
          type: "u16";
        },
        {
          name: "name";
          type: "string";
        },
        {
          name: "max_name_bytes";
          type: "u32";
        }
      ];
    },
    {
      name: "cast_votes";
      accounts: [
        {
          name: "voter";
          isMut: true;
          isSigner: true;
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "vote_record";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "indices";
          type: {
            vec: "u16";
          };
        }
      ];
    },
    {
      name: "close_poll";
      accounts: [
        {
          name: "authority";
          isMut: true;
          isSigner: true;
          relations: ["poll"];
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "create_poll";
      accounts: [
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "system_program";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "poll_id";
          type: "u64";
        },
        {
          name: "title";
          type: "string";
        },
        {
          name: "max_candidates";
          type: "u16";
        },
        {
          name: "max_votes_per_voter";
          type: "u16";
        },
        {
          name: "max_title_bytes";
          type: "u32";
        }
      ];
    },
    {
      name: "init_vote_record";
      accounts: [
        {
          name: "voter";
          isMut: true;
          isSigner: true;
        },
        {
          name: "poll";
          isMut: true;
          isSigner: false;
        },
        {
          name: "vote_record";
          isMut: true;
          isSigner: false;
        },
        {
          name: "system_program";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "Candidate";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poll";
            type: "publicKey";
          },
          {
            name: "index";
            type: "u16";
          },
          {
            name: "name";
            type: "string";
          }
        ];
      };
    },
    {
      name: "Poll";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "poll_id";
            type: "u64";
          },
          {
            name: "is_open";
            type: "bool";
          },
          {
            name: "max_votes_per_voter";
            type: "u16";
          },
          {
            name: "max_candidates";
            type: "u16";
          },
          {
            name: "candidate_count";
            type: "u16";
          },
          {
            name: "title";
            type: "string";
          },
          {
            name: "vote_counts";
            type: {
              vec: "u64";
            };
          }
        ];
      };
    },
    {
      name: "VoteRecord";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poll";
            type: "publicKey";
          },
          {
            name: "voter";
            type: "publicKey";
          },
          {
            name: "used_votes";
            type: "u16";
          },
          {
            name: "voted_bitmap";
            type: "bytes";
          }
        ];
      };
    }
  ];
  events: [
    {
      name: "VotesCastEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poll";
            type: "publicKey";
          },
          {
            name: "voter";
            type: "publicKey";
          },
          {
            name: "added";
            type: "u16";
          },
          {
            name: "total_used";
            type: "u16";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "ZeroCandidatesNotAllowed";
      msg: "max_candidates must be > 0";
    },
    {
      code: 6001;
      name: "ZeroVotesPerVoter";
      msg: "max_votes_per_voter must be > 0";
    },
    {
      code: 6002;
      name: "PollClosed";
      msg: "poll is closed";
    },
    {
      code: 6003;
      name: "Unauthorized";
      msg: "unauthorized";
    },
    {
      code: 6004;
      name: "MaxCandidatesReached";
      msg: "maximum number of candidates reached";
    },
    {
      code: 6005;
      name: "NameTooLongAtInit";
      msg: "candidate name exceeds reserved length (max_name_bytes)";
    },
    {
      code: 6006;
      name: "TitleTooLongAtInit";
      msg: "title exceeds reserved length (max_title_bytes)";
    },
    {
      code: 6007;
      name: "NoVotesSubmitted";
      msg: "no votes submitted";
    },
    {
      code: 6008;
      name: "NoNewVotes";
      msg: "no new votes to add (duplicates or already voted)";
    },
    {
      code: 6009;
      name: "VotesQuotaExceeded";
      msg: "votes-per-voter quota exceeded";
    },
    {
      code: 6010;
      name: "InvalidCandidateIndex";
      msg: "invalid candidate index";
    },
    {
      code: 6011;
      name: "Overflow";
      msg: "arithmetic overflow";
    },
    {
      code: 6012;
      name: "MismatchedPollInRecord";
      msg: "vote record links to a different poll";
    }
  ];
};

export const IDL: D21Voting = {
  version: "0.1.0",
  name: "d21voting",
  metadata: {
    address: "2CNQMKvkPPfgiZFKJar6gyWc6bquTV2jW7NEHMfynLBs",
    name: "d21voting",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Created with Anchor",
  },
  instructions: [
    {
      name: "add_candidate",
      accounts: [
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "candidate",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
          relations: ["poll"],
        },
        {
          name: "system_program",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "index",
          type: "u16",
        },
        {
          name: "name",
          type: "string",
        },
        {
          name: "max_name_bytes",
          type: "u32",
        },
      ],
    },
    {
      name: "cast_votes",
      accounts: [
        {
          name: "voter",
          isMut: true,
          isSigner: true,
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "vote_record",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "indices",
          type: {
            vec: "u16",
          },
        },
      ],
    },
    {
      name: "close_poll",
      accounts: [
        {
          name: "authority",
          isMut: true,
          isSigner: true,
          relations: ["poll"],
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "create_poll",
      accounts: [
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "system_program",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "poll_id",
          type: "u64",
        },
        {
          name: "title",
          type: "string",
        },
        {
          name: "max_candidates",
          type: "u16",
        },
        {
          name: "max_votes_per_voter",
          type: "u16",
        },
        {
          name: "max_title_bytes",
          type: "u32",
        },
      ],
    },
    {
      name: "init_vote_record",
      accounts: [
        {
          name: "voter",
          isMut: true,
          isSigner: true,
        },
        {
          name: "poll",
          isMut: true,
          isSigner: false,
        },
        {
          name: "vote_record",
          isMut: true,
          isSigner: false,
        },
        {
          name: "system_program",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Candidate",
      type: {
        kind: "struct",
        fields: [
          {
            name: "poll",
            type: "publicKey",
          },
          {
            name: "index",
            type: "u16",
          },
          {
            name: "name",
            type: "string",
          },
        ],
      },
    },
    {
      name: "Poll",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "poll_id",
            type: "u64",
          },
          {
            name: "is_open",
            type: "bool",
          },
          {
            name: "max_votes_per_voter",
            type: "u16",
          },
          {
            name: "max_candidates",
            type: "u16",
          },
          {
            name: "candidate_count",
            type: "u16",
          },
          {
            name: "title",
            type: "string",
          },
          {
            name: "vote_counts",
            type: {
              vec: "u64",
            },
          },
        ],
      },
    },
    {
      name: "VoteRecord",
      type: {
        kind: "struct",
        fields: [
          {
            name: "poll",
            type: "publicKey",
          },
          {
            name: "voter",
            type: "publicKey",
          },
          {
            name: "used_votes",
            type: "u16",
          },
          {
            name: "voted_bitmap",
            type: "bytes",
          },
        ],
      },
    },
  ],
  events: [
    {
      name: "VotesCastEvent",
      type: {
        kind: "struct",
        fields: [
          {
            name: "poll",
            type: "publicKey",
          },
          {
            name: "voter",
            type: "publicKey",
          },
          {
            name: "added",
            type: "u16",
          },
          {
            name: "total_used",
            type: "u16",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "ZeroCandidatesNotAllowed",
      msg: "max_candidates must be > 0",
    },
    {
      code: 6001,
      name: "ZeroVotesPerVoter",
      msg: "max_votes_per_voter must be > 0",
    },
    {
      code: 6002,
      name: "PollClosed",
      msg: "poll is closed",
    },
    {
      code: 6003,
      name: "Unauthorized",
      msg: "unauthorized",
    },
    {
      code: 6004,
      name: "MaxCandidatesReached",
      msg: "maximum number of candidates reached",
    },
    {
      code: 6005,
      name: "NameTooLongAtInit",
      msg: "candidate name exceeds reserved length (max_name_bytes)",
    },
    {
      code: 6006,
      name: "TitleTooLongAtInit",
      msg: "title exceeds reserved length (max_title_bytes)",
    },
    {
      code: 6007,
      name: "NoVotesSubmitted",
      msg: "no votes submitted",
    },
    {
      code: 6008,
      name: "NoNewVotes",
      msg: "no new votes to add (duplicates or already voted)",
    },
    {
      code: 6009,
      name: "VotesQuotaExceeded",
      msg: "votes-per-voter quota exceeded",
    },
    {
      code: 6010,
      name: "InvalidCandidateIndex",
      msg: "invalid candidate index",
    },
    {
      code: 6011,
      name: "Overflow",
      msg: "arithmetic overflow",
    },
    {
      code: 6012,
      name: "MismatchedPollInRecord",
      msg: "vote record links to a different poll",
    },
  ],
};
