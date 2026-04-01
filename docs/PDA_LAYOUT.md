# PDA Layout

This document describes the PDA structure currently used by FanSphere.

## Exact Seed Specs

- **Profile PDA**  
  `["profile", creator_pubkey]`

- **Subscriber Mint PDA**  
  `["mint", creator_pubkey]`

- **Post PDA**  
  `["post", creator_pubkey, seed.to_le_bytes()]`

- **Subscription Record PDA**  
  `["subscription", creator_pubkey, subscriber_pubkey]`

- **Like PDA**  
  `["like", target_pda, user_pubkey]`

- **Comment PDA**  
  `["comment", parent_pda, index.to_le_bytes()]`

## PDA Tree

```text
FanSphere Program
├── Creator Profile PDA
│   ├── seeds: ["profile", creator_pubkey]
│   ├── stores: CreatorProfile
│   └── one per creator
│
├── Subscriber Mint PDA
│   ├── seeds: ["mint", creator_pubkey]
│   ├── account type: SPL Token Mint
│   ├── mint authority: Creator Profile PDA
│   └── one per creator
│
├── Post PDA
│   ├── seeds: ["post", creator_pubkey, seed_u64_le]
│   ├── stores: PostState
│   ├── one per post
│   ├── child: Like PDA
│   └── child: Comment PDA
│
├── Subscription Record PDA
│   ├── seeds: ["subscription", creator_pubkey, subscriber_pubkey]
│   ├── stores: SubscriptionRecord
│   └── one per creator-subscriber pair
│
├── Like PDA
│   ├── seeds: ["like", target_pda, user_pubkey]
│   ├── stores: LikerRecord
│   ├── target_pda can be:
│   │   ├── a Post PDA
│   │   └── a Comment PDA
│   └── one per user-target pair
│
└── Comment PDA
    ├── seeds: ["comment", parent_pda, index_u32_le]
    ├── stores: CommentState
    ├── root comment:
    │   └── parent_pda = post_pda
    ├── reply comment:
    │   └── parent_pda = parent_comment_pda
    └── one per parent-index pair
```
## Relationship Tree

```text
Creator
├── Profile PDA
│   └── Subscriber Mint PDA
├── Post PDA #1
│   ├── Like PDA (user A -> post)
│   ├── Like PDA (user B -> post)
│   ├── Comment PDA #0
│   │   ├── Like PDA (user A -> comment)
│   │   └── Comment PDA #0 reply
│   └── Comment PDA #1
├── Post PDA #2
└── Subscription Record PDA (subscriber X -> creator)
```
Notes

FanSphere currently uses a unified comment PDA pattern:

Root comments: parent_pda = post_pda
Reply comments: parent_pda = parent_comment_pda

If the frontend still contains any helper such as deriveReplyPDA(...), the README and state documentation should follow the current on-chain logic rather than an older or unused reply-specific seed format.