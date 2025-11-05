# PRD: Refactor Trading System in Marketplace

**Project:** Roblox Trading Marketplace  
**Feature:** Centralized Item Listing + Buyer-Seller Confirmation System  
**Owner:** Solinex Hobby Labs  
**Version:** v1.2 (Refactor Concept)  
**Date:** 2025-11-05

---

## 🎯 1. Objective
Currently, sellers can post any item they want, leading to these issues:
- The system cannot track which items exist or their stock levels.
- Trade history is incomplete or inaccurate.
- Users can fake or inflate trade counts to appear more trustworthy.

**Goal:**  
To implement a verified item-based trading system using an **Item Master List** defined by admins, where buyers and sellers must both confirm trade completion before an order is closed.

---

## 🧩 2. Core Concept
1. Admins define all tradeable items in the system.  
2. Sellers choose from this predefined list when creating listings.  
3. Buyers can browse sellers who have stock.  
4. When a buyer initiates a purchase, an **Order** is created.  
5. Both parties discuss the trade via chat and execute it in-game.  
6. Buyer confirms the trade (Commit/Approve).  
7. The system records the trade history and updates stock/reputation.

---

## 🧱 3. Data Model Overview

### 3.1 ItemMaster
| Field | Type | Description |
|-------|------|-------------|
| id | string | Primary key |
| name | string | Item name |
| description | string | Item details |
| image | string | Item image URL |
| rarity | string | Item rarity |
| createdBy | string | Admin ID |
| createdAt | timestamp | Created date |

> Managed only by Admin users.

---

### 3.2 Listing
| Field | Type | Description |
|-------|------|-------------|
| id | string | Primary key |
| sellerId | string | Seller User ID |
| itemId | string (FK → ItemMaster) | Linked item |
| price | number | Price per unit |
| stock | number | Remaining stock |
| status | enum(`ACTIVE`,`RESERVED`,`SOLD_OUT`,`INACTIVE`) | Listing status |
| createdAt | timestamp | Created date |
| updatedAt | timestamp | Last update |

**Behavior:**
- Stock decreases when order is confirmed.
- Auto change to `SOLD_OUT` when stock = 0.

---

### 3.3 Order
| Field | Type | Description |
|-------|------|-------------|
| id | string | Primary key |
| listingId | string (FK → Listing) | Related listing |
| itemId | string (FK → ItemMaster) | Item traded |
| buyerId | string | Buyer ID |
| sellerId | string | Seller ID |
| quantity | number | Quantity purchased |
| status | enum(`PENDING`,`AWAITING_SELLER_CONFIRM`,`AWAITING_BUYER_CONFIRM`,`COMPLETED`,`CANCELLED`,`DISPUTE`) | Order status |
| proof | string (nullable) | Proof of trade (screenshot, etc.) |
| createdAt | timestamp | Created date |
| completedAt | timestamp | Completion date |

**Order Flow:**
```
PENDING → AWAITING_SELLER_CONFIRM → AWAITING_BUYER_CONFIRM → COMPLETED
                                    ↘ CANCELLED / DISPUTE
```

---

### 3.4 TradeHistory
| Field | Type | Description |
|-------|------|-------------|
| id | string | Primary key |
| orderId | string | Completed order reference |
| buyerId | string | Buyer |
| sellerId | string | Seller |
| itemId | string | Item traded |
| quantity | number | Amount |
| completedAt | timestamp | Completion date |

Used for user profile, statistics, and average price tracking.

---

## 💬 4. Chat Integration
Each trade-related chat is linked with an `orderId` and includes an **Order Action Panel** above the chat box.

| Role | Current Status | Action Button | Next Status |
|------|----------------|----------------|--------------|
| Seller | `PENDING` | “Confirm Ready to Trade” | `AWAITING_BUYER_CONFIRM` |
| Buyer | `AWAITING_BUYER_CONFIRM` | “Confirm Trade Done” | `COMPLETED` |
| Both | `ANY` | “Report / Open Dispute” | `DISPUTE` |

---

## 🧭 5. User Flow

### Seller
1. Navigate to “Post Listing.”  
2. Select an item from ItemMaster.  
3. Enter price and quantity.  
4. Submit to publish listing.

### Buyer
1. Browse the marketplace.  
2. Choose an item → see available sellers.  
3. Click “Buy” → system creates an Order (`PENDING`).  
4. Chat with seller.  
5. After in-game trade, click “Confirm Trade Done.”

### System
- Deduct stock automatically.  
- Auto-close listings when stock = 0.  
- Save to TradeHistory.  
- Update user reputation.

---

## 📊 6. Admin Functions
- Manage ItemMaster (CRUD).  
- Monitor all Listings / Orders / History.  
- Handle disputes manually with chat logs and proof.  
- Adjust user reputation as needed.

---

## 🧠 7. Edge Cases & Rules

| Case | Handling |
|------|-----------|
| Seller unresponsive | Keep in `PENDING`, auto-notify after 24h |
| Buyer doesn’t confirm | Reminder after 48h → auto `DISPUTE` after 72h |
| Stock < requested quantity | Prevent order creation |
| Seller cancels order | Must attach reason/proof |
| Either side cancels | Mark `CANCELLED`, log in reputation history |

---

## 🧩 8. UI/UX Requirements

### Seller Dashboard
- Dropdown to select items from ItemMaster.  
- Table showing all listings (stock, price, status).  
- Buttons: Edit / Deactivate.

### Buyer Interface
- Marketplace showing all items.  
- Seller list for each item.  
- Buy button and order confirmation modal.  
- Order detail view with confirm buttons.

### Profile Page
- Display trade stats, success rate, and trust score.  
- Show trade history and reputation level.

### Admin Dashboard
- CRUD ItemMaster.  
- Manage disputes and proof review.  
- Access marketplace metrics.

---

## ⚙️ 9. Technical Notes
- Built using React / Next.js.  
- Data stored in ReactState or Supabase.  
- Chat system must reference `orderId`.  
- API/state handlers to implement:  
  - `createListing()`  
  - `createOrder()`  
  - `confirmTrade()`  
  - `cancelOrder()`  
  - `completeOrder()`  
  - `logTradeHistory()`  

---

## 📈 10. Success Metrics
- Accurate tracking of stock and trade completion.  
- 100% traceable order lifecycle.  
- ≥90% reduction in fake order closures.  
- User trust scores visible on profiles.

---

## 🧩 11. Future Extensions
- Average market price calculations from TradeHistory.  
- Escrow/deposit system to prevent scams.  
- User levels / trader rank based on successful trades.  
- Automated dispute resolution timer and notifications.
