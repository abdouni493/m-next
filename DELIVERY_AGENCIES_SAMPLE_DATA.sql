-- ========== SAMPLE DATA FOR DELIVERY AGENCIES ==========
-- Uncomment and modify these examples to add delivery agencies to your system

-- Example 1: Yassir Livraison (Popular DZ delivery service)
INSERT INTO delivery_agencies (
  name,
  description,
  contact_phone,
  contact_email,
  price_domicile,
  price_bureau,
  is_active,
  is_visible
)
VALUES (
  'Yassir Livraison',
  '🚗 Service rapide et fiable de livraison en Algérie',
  '+213 XXX XXX XXX',
  'contact@yassir.com',
  300.00,
  200.00,
  true,
  true
);

-- Example 2: DZ Express (National coverage)
INSERT INTO delivery_agencies (
  name,
  description,
  contact_phone,
  contact_email,
  price_domicile,
  price_bureau,
  is_active,
  is_visible
)
VALUES (
  'DZ Express',
  '📦 Livraison nationale avec suivi en temps réel',
  '+213 XXX XXX XXX',
  'info@dzexpress.com',
  350.00,
  250.00,
  true,
  true
);

-- Example 3: CourierDz (Fast courier service)
INSERT INTO delivery_agencies (
  name,
  description,
  contact_phone,
  contact_email,
  price_domicile,
  price_bureau,
  is_active,
  is_visible
)
VALUES (
  'CourierDz',
  '🏍️ Coursier express avec livraison rapide',
  '+213 XXX XXX XXX',
  'support@courierdz.com',
  250.00,
  150.00,
  true,
  true
);

-- Example 4: Jumia Food Delivery (Major platform)
INSERT INTO delivery_agencies (
  name,
  description,
  contact_phone,
  contact_email,
  price_domicile,
  price_bureau,
  is_active,
  is_visible
)
VALUES (
  'Jumia Express',
  '📦 Plateforme de livraison leader en Algérie',
  '+213 XXX XXX XXX',
  'partner@jumia.dz',
  400.00,
  300.00,
  true,
  true
);

-- Example 5: Local pickup option (Free)
INSERT INTO delivery_agencies (
  name,
  description,
  contact_phone,
  contact_email,
  price_domicile,
  price_bureau,
  is_active,
  is_visible
)
VALUES (
  'Retrait en Magasin',
  '🏪 Venez récupérer votre commande au magasin',
  '+213 XXX XXX XXX',
  'contact@store.com',
  0.00,
  0.00,
  true,
  true
);

-- ========== VERIFICATION QUERY ==========
-- Run this to verify the agencies were inserted
SELECT
  name,
  price_domicile,
  price_bureau,
  is_active,
  is_visible
FROM delivery_agencies
ORDER BY name;

-- ========== UPDATE EXAMPLE ==========
-- Update prices for an agency (example)
UPDATE delivery_agencies
SET
  price_domicile = 280.00,
  price_bureau = 180.00,
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'Yassir Livraison';

-- ========== DELETE EXAMPLE ==========
-- Soft delete (hide from customers, keep data)
UPDATE delivery_agencies
SET is_visible = false
WHERE name = 'Some Agency';

-- Hard delete (remove completely)
-- DELETE FROM delivery_agencies WHERE name = 'Some Agency';

-- ========== VIEW VISIBLE AGENCIES ==========
-- Show only visible agencies (what customers see)
SELECT
  id,
  name,
  description,
  price_domicile,
  price_bureau,
  (price_domicile + price_bureau) / 2 as average_price
FROM delivery_agencies_with_prices
ORDER BY name;
