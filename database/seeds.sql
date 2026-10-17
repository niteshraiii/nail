USE nailchemist;

INSERT INTO services (service_name, price, description, is_active)
VALUES
  ('Gel Manicure', 1800.00, 'High-gloss gel finish with detailed cuticle care and hand massage.', 1),
  ('Spa Pedicure', 2200.00, 'Relaxing pedicure with lavender soak, scrub, mask, and polish.', 1),
  ('Nail Extensions', 2600.00, 'Custom extension set with shaping, length, and a glossy structured finish.', 1)
ON DUPLICATE KEY UPDATE
  price = VALUES(price),
  description = VALUES(description),
  is_active = VALUES(is_active);

UPDATE services
SET is_active = 0
WHERE service_name IN ('Signature Gel Manicure', 'Lavender Spa Pedicure', 'Builder Gel Overlay', 'Nail Art Atelier');

INSERT INTO rewards (required_visits, reward_name)
VALUES
  (5, 'Complimentary nail art accent'),
  (10, 'Luxury spa manicure upgrade')
ON DUPLICATE KEY UPDATE reward_name = VALUES(reward_name);
