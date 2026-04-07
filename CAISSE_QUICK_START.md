# 💰 CAISSE - QUICK START

## 1️⃣ RUN SQL CODE FIRST
Copy this to Supabase SQL Editor:

```sql
-- Create caisse_transactions table for encaissement and décaissement
CREATE TABLE IF NOT EXISTS public.caisse_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('encaissement', 'decaissement')),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_caisse_type ON public.caisse_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_caisse_date ON public.caisse_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_caisse_active ON public.caisse_transactions(is_active);

CREATE OR REPLACE VIEW public.caisse_summary AS
SELECT 
  COALESCE(SUM(CASE WHEN transaction_type = 'encaissement' THEN amount ELSE 0 END), 0) as total_encaissements,
  COALESCE(SUM(CASE WHEN transaction_type = 'decaissement' THEN amount ELSE 0 END), 0) as total_decaissements,
  COALESCE(SUM(CASE WHEN transaction_type = 'encaissement' THEN amount ELSE 0 END), 0) - 
  COALESCE(SUM(CASE WHEN transaction_type = 'decaissement' THEN amount ELSE 0 END), 0) as balance,
  COUNT(*) as total_transactions
FROM public.caisse_transactions
WHERE is_active = TRUE;

ALTER TABLE public.caisse_transactions DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to manage caisse" ON public.caisse_transactions
  USING (TRUE)
  WITH CHECK (TRUE);

ALTER TABLE public.caisse_transactions ENABLE ROW LEVEL SECURITY;
```

## 2️⃣ RESTART APP
```
Ctrl+C (stop)
npm run dev
```

## 3️⃣ ACCESS CAISSE
Click sidebar → 💰 Caisse (under Tools section)

---

## 📊 WHAT YOU GET

### Dashboard Summary
- **💵 Balance**: Current cash total
- **⬆️ Total Deposits**: All encaissements
- **⬇️ Total Withdrawals**: All décaissements
- **📋 Transactions**: Total count

### Manage Transactions
- ➕ Add encaissement or décaissement
- ✏️ Edit any transaction
- 🗑️ Delete (soft delete)
- 🔍 Search by description

### Transaction Cards
```
💚 Encaissement (Green) | ❤️ Décaissement (Red)
500 DZD               | 250 DZD
📝 Cash from sales    | 📝 Supplier payment
[Edit] [Delete]       | [Edit] [Delete]
```

---

## 🎯 QUICK TIPS

| Action | Steps |
|--------|-------|
| **Add Deposit** | Click "➕ Add" → Select "Encaissement" → Enter amount → Describe → Save |
| **Add Withdrawal** | Click "➕ Add" → Select "Décaissement" → Enter amount → Describe → Save |
| **Edit** | Click pencil icon on card → Modify → Save |
| **Delete** | Click trash icon → Confirm deletion |
| **Search** | Type in search box to filter transactions |
| **View Balance** | Look at top left summary card (💵) |

---

## 📋 FIELDS EXPLAINED

| Field | Example | Notes |
|-------|---------|-------|
| **Type** | Encaissement / Décaissement | Deposit or Withdrawal |
| **Amount** | 1000.50 | In DZD currency |
| **Description** | Cash from POS sales | Why this transaction |
| **Date** | 2026-04-07 | When it happened |

---

## ✅ FEATURES

✨ **Dashboard**: 4 summary cards with totals  
💚❤️ **Color Coded**: Green for deposits, red for withdrawals  
📱 **Responsive**: Works on mobile, tablet, desktop  
🌙 **Dark Mode**: Full dark mode support  
🌍 **Multilingual**: English, French, Arabic  
⚡ **Real-time**: Updates instantly  
🔒 **Secure**: Soft deletes preserve data  

---

## 🔧 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Can't see Caisse link | Restart app: `npm run dev` |
| Can't create transactions | Run SQL code first |
| Summary cards empty | Refresh page or add transaction |
| Wrong language | Check language selector in app |
| Dark mode broken | Clear browser cache |

---

## 📞 SUPPORT

- Check CAISSE_IMPLEMENTATION_GUIDE.md for detailed docs
- All code is in src/pages/Caisse.tsx
- Database setup in CREATE_CAISSE_SCHEMA.sql

---

**Setup time: ~5 minutes** ⏱️
**Ready to use immediately after!** 🚀
