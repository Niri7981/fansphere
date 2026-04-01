# FanSphere

A Web2.5 creator subscription platform prototype built on Solana, focused on direct wallet-to-wallet payments, on-chain subscription state, and subscription-based content gating.

<p align="center">
  <img src="docs/subscribe-unlock.gif" alt="FanSphere subscribe and unlock demo" width="900" />
</p>

## Overview

FanSphere is a Web2.5 creator subscription prototype built on Solana.

Creators publish content, users subscribe through wallet-to-wallet payments, and premium content unlocks based on verifiable on-chain subscription state.

The current build validates the core product loop:

- creator onboarding
- content publishing
- subscription payments
- gated content access
- persistent content rendering after refresh

The core idea is simple: keep trust-critical logic such as payments, subscriptions, and access control on-chain, while leaving heavier product logic to a future off-chain layer.

## Product Preview

The screenshots below show several core pages and interaction states from the current FanSphere prototype.

### Landing Page

This is the entry page of the product, designed to communicate FanSphere as a creator subscription platform prototype.

<p align="center">
  <img src="docs/landing.png" alt="FanSphere landing page" width="900" />
</p>

### Creator Profile

This is the creator profile page, showing creator identity, content sections, and the subscription entry point. It is one of the core pages of the product.

<p align="center">
  <img src="docs/profile.png" alt="FanSphere creator profile page" width="900" />
</p>

### Feed View

This is the current feed view, showing how public and subscription-based content can coexist in the same product experience.

<p align="center">
  <img src="docs/feed.png" alt="FanSphere feed page" width="900" />
</p>

### Locked Premium Post

This is the pre-subscription state. Users can see the preview and subscription entry, but the full content remains locked.

<p align="center">
  <img src="docs/locked-post.png" alt="Locked premium post" width="900" />
</p>

### Unlocked Premium Post

This is the post-subscription state. Once the subscription is active, premium content is unlocked based on on-chain subscription state.

<p align="center">
  <img src="docs/unlocked-post.png" alt="Unlocked premium post" width="900" />
</p>

## Why I Built This

Most creator platforms still rely on platform-controlled payment rails, slow payouts, and database-only access control.

I wanted to explore a lighter Web3-native approach:

- **Put the trust-critical parts on-chain**  
  This includes subscription state, payment outcomes, and access control

- **Keep the heavier product logic off-chain**  
  Media storage, future feed aggregation, search, ranking, and recommendation are better handled outside the program layer

- **Stay close to a usable product experience**  
  The goal is not to build a pure protocol demo, but a product-shaped prototype that feels closer to a real application

For me, FanSphere is also a build-focused project for proving my ability to connect Solana program design, frontend implementation, and product thinking in one end-to-end system.

## Why Solana

Solana is a strong fit for this kind of product because it supports:

- lower interaction costs
- faster transaction confirmation
- a user experience that can handle frequent actions

A creator subscription platform naturally involves repeated interactions such as subscribing, renewing, liking, commenting, and checking access rights. If those interactions are too expensive or too slow, the product experience breaks down quickly. Solana is a practical environment for experimenting with a payment-oriented, high-frequency creator product.

## Current Features

The current prototype already supports:

- **Creator onboarding**  
  Wallet-based creator profile setup with basic configuration

- **Content publishing**  
  Post creation with media uploaded through Irys

- **Subscription flow**  
  Users can subscribe, and subscription state is recorded on-chain

- **Content gating**  
  Private content is unlocked based on subscription status

- **Persistent asset references**  
  Content can still render correctly after refresh because asset references are stored persistently

- **Direct account reads from the frontend**  
  The frontend reads Solana program accounts directly for rendering and state checks

- **Basic social interactions**  
  Includes the on-chain model for comments and likes

## Technical Highlights

- **Solana program in Rust with Pinocchio**  
  Built around PDA-based state for creators, posts, subscriptions, comments, and likes.

- **On-chain subscription gating**  
  Premium content access is determined by subscription state rather than an off-chain flag.

- **Wallet-to-wallet subscription flow**  
  The prototype focuses on direct creator monetization without platform-controlled payment rails.

- **Irys-backed content references**  
  Media references persist so content can still render correctly after refresh.

- **Web2.5 architecture**  
  Trust-critical logic lives on-chain, while heavier discovery and ranking logic is planned for a future indexing layer.

## Architecture Overview

FanSphere currently follows a lightweight Web2.5 architecture:

- **On-chain layer (Solana Program)**  
  Stores core state such as creator profiles, posts, subscriptions, comments, and interaction records

- **Storage layer (Irys)**  
  Stores media assets and content references

- **Frontend layer (Next.js)**  
  In the current version, the frontend reads and writes program accounts directly, handles rendering, subscription checks, and UI state

- **Future off-chain layer (Planned Python Indexer)**  
  Intended for heavier logic such as:
  - feed aggregation
  - search and discovery
  - ranking
  - analytics
  - recommendation

Because the current version still relies on direct account reads from the frontend, it is best understood as a prototype architecture rather than the final production shape.

## On-Chain State Model

FanSphere uses a PDA-based account model to organize on-chain state. This README keeps the explanation high-level and does not go into byte layouts or low-level serialization details.

Core account types include:

- **Creator Profile PDA**  
  Stores creator-level profile data and configuration

- **Post PDA**  
  Stores post state, content references, and visibility metadata

- **Subscription PDA**  
  Represents the relationship between a creator and a subscriber and is used for gated access checks

- **Comment PDA**  
  Stores comment and reply relationships

- **Like Record PDA**  
  Tracks interactions and prevents duplicate actions

The goal of this design is to make the core monetization and access-control logic verifiable through deterministic on-chain state, while leaving heavier product features to a future indexing layer.

## Current Scope

FanSphere is currently shared as a working prototype focused on one core loop:

creator publishes → user subscribes → premium content unlocks based on on-chain state.

This public repository focuses on the on-chain program, architecture, PDA/state documentation, and demo assets.

A broader public demo, indexing layer, and hosted frontend can come later, but the core subscription and gating model is already working.

## PDA Layout

FanSphere uses a small set of deterministic PDAs to model creators, posts, subscriptions, comments, and likes.

- **Creator Profile PDA**  
  Seeds: `["profile", creator_pubkey]`  
  Stores creator-level profile data and configuration.

- **Subscriber Mint PDA**  
  Seeds: `["mint", creator_pubkey]`  
  This is the creator’s membership NFT mint.

- **Post PDA**  
  Seeds: `["post", creator_pubkey, seed_u64_le]`  
  Stores post state, content references, and visibility metadata.

- **Subscription Record PDA**  
  Seeds: `["subscription", creator_pubkey, subscriber_pubkey]`  
  Represents the relationship between a creator and a subscriber.

- **Like PDA**  
  Seeds: `["like", target_pda, user_pubkey]`  
  `target_pda` can be either a post PDA or a comment PDA.

- **Comment PDA**  
  Seeds: `["comment", parent_pda, index_u32_le]`  
  For root comments, `parent_pda = post_pda`.  
  For replies, `parent_pda = parent_comment_pda`.

For a more detailed breakdown of PDA relationships and seed design, see [docs/PDA_LAYOUT.md](docs/PDA_LAYOUT.md).

## Open Source Scope

This public repository currently includes:

- Solana program code
- README and project overview
- PDA and state documentation
- demo GIFs and product screenshots

The frontend code is not included in this public repository yet.