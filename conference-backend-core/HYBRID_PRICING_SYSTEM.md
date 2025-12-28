# Hybrid Pricing System - Database-Driven with Config Fallback

## 🎯 Architecture

### **Database First, Config Fallback**
The system now uses a **hybrid approach**:

1. **Primary Source:** MongoDB `Configuration` collection (admin-configurable)
2. **Fallback Source:** `config/pricing.config.ts` (initial setup/defaults)
3. **Static Labels:** `config/conference.config.ts` (registration type labels)

---

## 📊 Data Flow

### **Payment Calculation Process:**

```
┌─────────────────────────────────────┐
│  User submits registration         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Check MongoDB Configuration        │
│  - registration_categories          │
│  - accompanying_person              │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │ Found in DB?│
        └──────┬──────┘
               │
       ┌───────┴────────┐
       │ YES            │ NO
       ▼                ▼
┌──────────────┐  ┌────────────────┐
│ Use DB values│  │ Use config file│
│ (6823 INR)   │  │ (fallback)     │
└──────┬───────┘  └────────┬───────┘
       │                   │
       └─────────┬─────────┘
                 ▼
        ┌────────────────┐
        │ Get label from │
        │ conference.    │
        │ config.ts      │
        └────────┬───────┘
                 ▼
        ┌────────────────┐
        │ Calculate total│
        │ & save to DB   │
        └────────────────┘
```

---

## 🗄️ Database Structure

### **Configuration Collection:**

#### **Registration Categories**
```json
{
  "_id": "...",
  "type": "pricing",
  "key": "registration_categories",
  "isActive": true,
  "value": {
    "cvsi-member": {
      "amount": 15000,
      "currency": "INR"
    },
    "resident": {
      "amount": 10000,
      "currency": "INR"
    },
    "non-member": {
      "amount": 15000,
      "currency": "INR"
    },
    "international": {
      "amount": 25000,
      "currency": "INR"
    }
  }
}
```

#### **Accompanying Person Fee**
```json
{
  "_id": "...",
  "type": "pricing",
  "key": "accompanying_person",
  "isActive": true,
  "value": {
    "amount": 6823,
    "currency": "INR",
    "description": "Includes conference materials and meals"
  }
}
```

---

## 📝 Configuration Files

### **1. pricing.config.ts** (Fallback/Defaults)
```typescript
// Used ONLY when database has no pricing data
export const pricingTiers = {
  earlyBird: {
    categories: {
      'cvsi-member': { amount: 15000 },
      'resident': { amount: 10000 }
    }
  }
}

export const accompanyingPersonFee = {
  amount: 6823  // Fallback value
}
```

### **2. conference.config.ts** (Static Labels)
```typescript
// Registration type labels (never change)
registration: {
  categories: [
    { key: "cvsi-member", label: "CVSI Member" },
    { key: "resident", label: "Resident / Fellow" },
    { key: "international", label: "International Delegate" }
  ]
}
```

---

## ✅ Expected Behavior

### **Scenario 1: Database Has Pricing**
```
Input: resident registration + 1 accompanying person
Database values:
  - resident: 10000 INR
  - accompanying_person: 6823 INR

Output breakdown:
{
  "baseAmount": 10000,
  "accompanyingPersonFees": 6823,
  "total": 16823
}

Console log:
📊 Using database pricing configuration
📊 Accompanying person fee from database: 6823
📊 Registration type: resident | Base amount: 10000 | Source: Database
```

### **Scenario 2: No Database Pricing (Fresh Install)**
```
Input: resident registration + 1 accompanying person
Database: Empty or no pricing config

Output breakdown:
{
  "baseAmount": 10000,  // from pricing.config.ts
  "accompanyingPersonFees": 6823,  // from pricing.config.ts
  "total": 16823
}

Console log:
⚠️ No database pricing found, using pricing.config.ts
📊 Using pricing tier from config: Early Bird earlyBird
📊 Accompanying person fee from config (fallback): 6823
📊 Registration type: resident | Base amount: 10000 | Source: Config
```

---

## 🔧 Admin Panel Integration

### **Initial Setup (One-Time)**
When conference is first initialized, run this migration:

```javascript
// scripts/seed-pricing-from-config.js
const { getCurrentTierPricing, accompanyingPersonFee } = require('../config/pricing.config')
const Configuration = require('../lib/models/Configuration')

async function seedPricing() {
  const tier = getCurrentTierPricing()
  
  // Seed registration categories
  await Configuration.create({
    type: 'pricing',
    key: 'registration_categories',
    value: Object.fromEntries(
      Object.entries(tier.categories).map(([key, cat]) => [
        key,
        { amount: cat.amount, currency: cat.currency }
      ])
    ),
    isActive: true
  })
  
  // Seed accompanying person fee
  await Configuration.create({
    type: 'pricing',
    key: 'accompanying_person',
    value: accompanyingPersonFee,
    isActive: true
  })
  
  console.log('✅ Pricing seeded from config to database')
}
```

### **Runtime Updates**
Admins can update pricing via admin panel:
- Values stored in `Configuration` collection
- Changes take effect immediately (no server restart)
- Config files remain as fallback only

---

## 🎯 Why This Approach?

### **Advantages:**
✅ **Admin-friendly**: Update pricing without code deployment  
✅ **Safe fallback**: Always has working defaults from config  
✅ **Version controlled**: Config files track initial pricing  
✅ **Flexible**: Different pricing for different events  
✅ **Auditable**: Database tracks all pricing changes  

### **Data Separation:**
- **Labels** (conference.config.ts): Rarely change, version controlled
- **Pricing** (Database): Changes frequently, admin controlled
- **Defaults** (pricing.config.ts): Fallback for new installations

---

## 📋 Migration Checklist

- [x] Update `app/api/payment/verify/route.ts` to check database first
- [x] Add fallback to `pricing.config.ts`
- [x] Keep labels in `conference.config.ts`
- [ ] Create admin panel UI for pricing management
- [ ] Create seed script for initial setup
- [ ] Add pricing history/audit log

---

## 🚀 Current Status

**✅ System is now database-driven with config fallback!**

**Next registration will:**
1. Check database for pricing (6823 INR for accompanying person)
2. If not found, use pricing.config.ts (also 6823 INR)
3. Save correct breakdown to Payment record
4. Show accurate invoice in email

---

## 🔍 Debugging

### **Check what pricing source is being used:**
Look for these console logs:
```
✅ "Using database pricing configuration" = Database values
⚠️ "No database pricing found, using pricing.config.ts" = Fallback
```

### **Verify database pricing:**
```javascript
// In MongoDB
db.configurations.find({ type: "pricing" })
```

### **Expected output:**
```json
[
  { "key": "registration_categories", "value": {...} },
  { "key": "accompanying_person", "value": { "amount": 6823 } }
]
```

---

**Status:** ✅ Complete  
**Priority:** Database > Config > Hardcoded (NONE)  
**Next:** Create admin UI to manage database pricing
