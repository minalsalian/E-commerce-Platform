INSERT INTO category (name, description) VALUES
('Dairy', 'Milk and dairy products'),
('Bakery', 'Fresh baked goods'),
('Clothing', 'Apparel and fashion'),
('Snacks', 'Ready to eat snacks');

INSERT INTO product (pname, description, image, price, pricetype, status, userid, categoryid) VALUES
('Milk 1L', 'Fresh cow milk', 'milk.jpg', 45, 'Rs', 1, 1, (SELECT id FROM category WHERE name='Dairy' LIMIT 1)),
('Yogurt 500g', 'Creamy yogurt', 'yogurt.jpg', 60, 'Rs', 1, 1, (SELECT id FROM category WHERE name='Dairy' LIMIT 1)),
('Cheese Block', 'Aged cheddar cheese', 'cheese.jpg', 250, 'Rs', 1, 1, (SELECT id FROM category WHERE name='Dairy' LIMIT 1)),
('Bread Loaf', 'Whole wheat bread', 'bread.jpg', 35, 'Rs', 1, 1, (SELECT id FROM category WHERE name='Bakery' LIMIT 1)),
('Pastry Pack', 'Assorted pastries', 'pastry.jpg', 150, 'Rs', 1, 1, (SELECT id FROM category WHERE name='Bakery' LIMIT 1)),
('T-Shirt', 'Cotton t-shirt', 'tshirt.jpg', 299, 'Rs', 1, 1, (SELECT id FROM category WHERE name='Clothing' LIMIT 1)),
('Jeans', 'Denim jeans', 'jeans.jpg', 999, 'Rs', 1, 1, (SELECT id FROM category WHERE name='Clothing' LIMIT 1)),
('Snack Bar', 'Chocolate snack', 'snack.jpg', 25, 'Rs', 1, 1, (SELECT id FROM category WHERE name='Snacks' LIMIT 1)),
('Chips Pack', 'Crispy chips', 'chips.jpg', 40, 'Rs', 1, 1, (SELECT id FROM category WHERE name='Snacks' LIMIT 1));
