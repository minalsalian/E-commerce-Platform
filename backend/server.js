const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("./db");

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// -------- DATABASE INITIALIZATION --------

// Add phone and address columns to users table if they don't exist
db.query(
  "ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL",
  (err) => {
    if (err && err.code !== "ER_DUP_FIELDNAME") {
      console.log("Add phone column:", err.message);
    } else {
      console.log("✓ Phone column ready");
    }
  }
);

db.query(
  "ALTER TABLE users ADD COLUMN address VARCHAR(255) NULL",
  (err) => {
    if (err && err.code !== "ER_DUP_FIELDNAME") {
      console.log("Add address column:", err.message);
    } else {
      console.log("✓ Address column ready");
    }
  }
);

// Add stock column to product table if it doesn't exist
db.query(`
  ALTER TABLE product ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0
`, (err) => {
  if (err && err.code !== 'ER_DUP_FIELDNAME') {
    console.log("Add stock column:", err.message);
  } else {
    console.log("✓ Stock column ready");
  }
});

// Create product variants table
db.query(`
  CREATE TABLE IF NOT EXISTS product_variants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    size VARCHAR(50),
    color VARCHAR(50),
    price DECIMAL(10, 2),
    stock INT DEFAULT 0,
    sku VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    UNIQUE KEY unique_variant (product_id, size, color)
  )
`, (err) => {
  if (err) console.log("Product variants table creation:", err.message);
  else console.log("✓ Product variants table ready");
});

// Add variant_id column to cart_items if it doesn't exist
db.query(`
  ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_id INT
`, (err) => {
  if (err && err.code !== 'ER_DUP_FIELDNAME') {
    console.log("Add variant_id column:", err.message);
  } else {
    console.log("✓ Cart variant_id column ready");
  }
});

// Create price alerts table
db.query(`
  CREATE TABLE IF NOT EXISTS price_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    target_price DECIMAL(10, 2) NOT NULL,
    current_price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    INDEX idx_active_alerts (is_active, product_id)
  )
`, (err) => {
  if (err) console.log("Price alerts table creation:", err.message);
  else console.log("✓ Price alerts table ready");
});

// Configure uploads directory
const uploadDir = path.join(__dirname, "uploads");

// Serve static files from uploads folder
app.use("/uploads", express.static(uploadDir));

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

// 🔍 GLOBAL LOGGER – shows every request hitting the server
app.use((req, res, next) => {
  console.log("HIT:", req.method, req.url);
  next();
});

// -------- AUTH --------

// Register
app.post("/api/register", (req, res) => {
  console.log("REGISTER BODY:", req.body);

  const { name, email, password, role = "user" } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  const sql =
    "INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)";

  db.query(sql, [name, email, password, role], (err) => {
    if (err) {
      console.log("REGISTER DB ERROR:", err.code, err.message);
      if (err.code === "ER_DUP_ENTRY") {
        return res.json({ msg: "Email already exists" });
      }
      return res.status(500).json({ msg: err.message || "Server error" });
    }

    res.json({ msg: "Registered successfully" });
  });
});

// Login
app.post("/api/login", (req, res) => {
  console.log("LOGIN BODY:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Email or password missing" });
  }

  const sql = "SELECT * FROM users WHERE email=? AND password=?";
  db.query(sql, [email, password], (err, rows) => {
    if (err) {
      console.log("LOGIN DB ERROR:", err);
      return res.status(500).json({ msg: "Database error" });
    }

    if (rows.length > 0) {
      return res.json({
        msg: "Login successful",
        user: {
          id: rows[0].id,
          name: rows[0].name,
          role: rows[0].role,
        },
      });
    } else {
      return res.json({ msg: "Invalid credentials" });
    }
  });
});

// -------- CATEGORIES --------

app.get("/api/categories", (req, res) => {
  db.query("SELECT * FROM category", (err, rows) => {
    if (err) {
      console.log("CATEGORY FETCH ERROR:", err);
      return res.status(500).json([]);
    }
    res.json(rows);
  });
});

app.post("/api/categories", (req, res) => {
  const { cname, description } = req.body;
  console.log("ADD CATEGORY REQUEST:", { cname, description });

  if (!cname) {
    return res.status(400).json({ msg: "Category name is required" });
  }

  const sqlCname = "INSERT INTO category (cname, description) VALUES (?,?)";
  const sqlName = "INSERT INTO category (name, description) VALUES (?,?)";

  db.query(sqlCname, [cname, description], (err) => {
    if (!err) {
      console.log("CATEGORY ADDED (cname)");
      return res.json({ msg: "Category added successfully" });
    }

    // Fallback if column is named `name` instead of `cname`
    if (err.code === "ER_BAD_FIELD_ERROR") {
      console.log("TRYING FALLBACK (name column)");
      return db.query(sqlName, [cname, description], (err2) => {
        if (err2) {
          console.log("ADD CATEGORY ERROR (fallback):", err2.message);
          return res.status(500).json({ msg: err2.message || "Error adding category" });
        }
        console.log("CATEGORY ADDED (name fallback)");
        return res.json({ msg: "Category added successfully" });
      });
    }

    console.log("ADD CATEGORY ERROR:", err.message);
    return res.status(500).json({ msg: err.message || "Error adding category" });
  });
});

// Update category
app.put("/api/categories/:id", (req, res) => {
  const { id } = req.params;
  const { cname, name, description = "" } = req.body;
  const updatedName = cname || name;

  if (!updatedName) {
    return res.status(400).json({ msg: "Category name is required" });
  }

  const sqlCname = "UPDATE category SET cname = ?, description = ? WHERE id = ?";
  const sqlName = "UPDATE category SET name = ?, description = ? WHERE id = ?";

  db.query(sqlCname, [updatedName, description, id], (err) => {
    if (err) {
      if (err.code === "ER_BAD_FIELD_ERROR") {
        db.query(sqlName, [updatedName, description, id], (err2) => {
          if (err2) {
            console.log("UPDATE CATEGORY ERROR (fallback):", err2.message);
            return res.status(500).json({ msg: err2.message || "Error updating category" });
          }
          return res.json({ msg: "Category updated successfully" });
        });
        return;
      }

      console.log("UPDATE CATEGORY ERROR:", err.message);
      return res.status(500).json({ msg: err.message || "Error updating category" });
    }

    res.json({ msg: "Category updated successfully" });
  });
});

app.delete("/api/categories/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM category WHERE id=?";

  db.query(sql, [id], (err) => {
    if (err) {
      console.log("DELETE CATEGORY ERROR:", err);
      return res.status(500).json({ msg: err.message || "Error deleting category" });
    }
    res.json({ msg: "Category deleted successfully" });
  });
});

// -------- USERS --------

// Get single user by ID
app.get("/api/users/:id", (req, res) => {
  const { id } = req.params;
  
  db.query("SELECT id, name, email, role, phone, address FROM users WHERE id = ?", [id], (err, rows) => {
    if (err) {
      console.log("USER FETCH ERROR:", err);
      return res.status(500).json({ msg: "Error fetching user" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(rows[0]);
  });
});

// Update user profile
app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address } = req.body;

  // Check if email already exists for another user
  db.query("SELECT id FROM users WHERE email = ? AND id != ?", [email, id], (err, rows) => {
    if (err) {
      console.log("EMAIL CHECK ERROR:", err);
      return res.status(500).json({ msg: "Error checking email" });
    }

    if (rows.length > 0) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const sql = "UPDATE users SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?";
    
    db.query(sql, [name, email, phone, address, id], (err) => {
      if (err) {
        console.log("UPDATE USER ERROR:", err);
        return res.status(500).json({ msg: "Error updating user" });
      }

      // Fetch updated user
      db.query("SELECT id, name, email, role, phone, address FROM users WHERE id = ?", [id], (err, rows) => {
        if (err) {
          return res.status(500).json({ msg: "Error fetching updated user" });
        }
        res.json(rows[0]);
      });
    });
  });
});

// Change password
app.put("/api/users/:id/password", (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  // First verify current password
  db.query("SELECT password FROM users WHERE id = ?", [id], (err, rows) => {
    if (err) {
      console.log("PASSWORD CHECK ERROR:", err);
      return res.status(500).json({ msg: "Error checking password" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (rows[0].password !== currentPassword) {
      return res.status(401).json({ msg: "Current password is incorrect" });
    }

    // Update password
    db.query("UPDATE users SET password = ? WHERE id = ?", [newPassword, id], (err) => {
      if (err) {
        console.log("PASSWORD UPDATE ERROR:", err);
        return res.status(500).json({ msg: "Error updating password" });
      }
      res.json({ msg: "Password changed successfully" });
    });
  });
});

app.get("/api/users", (req, res) => {
  console.log("USERS ENDPOINT HIT");
  db.query("SELECT id, name, email, role FROM users", (err, rows) => {
    if (err) {
      console.log("USERS FETCH ERROR:", err);
      return res.status(500).json({ msg: "Error fetching users", error: err.message });
    }
    console.log("USERS FETCHED:", rows.length, "rows");
    res.json(rows);
  });
});

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM users WHERE id=?";

  db.query(sql, [id], (err) => {
    if (err) {
      console.log("DELETE USER ERROR:", err);
      return res.status(500).json({ msg: "Error deleting user" });
    }
    res.json({ msg: "User deleted successfully" });
  });
});

// -------- IMAGE UPLOAD --------

app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: "No image provided" });
  }
  
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ msg: "Image uploaded", image: imageUrl });
});

// -------- PRODUCTS --------

// Autocomplete/Search suggestions
app.get("/api/search/suggestions", (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 1) {
    return res.json([]);
  }

  const searchTerm = `%${q.trim()}%`;
  
  const sql = `
    SELECT DISTINCT id, pname, price, image, stock
    FROM product
    WHERE pname LIKE ? AND status = 1
    ORDER BY pname ASC
    LIMIT 10
  `;

  db.query(sql, [searchTerm], (err, rows) => {
    if (err) {
      console.log("AUTOCOMPLETE ERROR:", err);
      return res.status(500).json([]);
    }
    res.json(rows);
  });
});

// Get single product by ID
app.get("/api/products/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT p.*, 
           c.name AS category,
           COALESCE(
             (SELECT pi.image_url FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.display_order ASC
              LIMIT 1),
             p.image
           ) AS image
    FROM product p
    LEFT JOIN category c ON p.categoryid = c.id
    WHERE p.id = ?
  `;
  
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.log("PRODUCT FETCH ERROR:", err);
      return res.status(500).json({ msg: "Database error" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.json(rows[0]);
  });
});

app.get("/api/products", (req, res) => {
  const { search, category, minPrice, maxPrice, categoryId, limit, page } = req.query;

  // Pagination setup
  const itemsPerPage = parseInt(limit) || 12;
  const currentPage = parseInt(page) || 1;
  const offset = (currentPage - 1) * itemsPerPage;

  let sql = `
    SELECT p.*,
           COALESCE(
             (SELECT pi.image_url FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.display_order ASC
              LIMIT 1),
             p.image
           ) AS image
    FROM product p
    WHERE 1=1
  `;
  let countSql = "SELECT COUNT(*) as total FROM product WHERE 1=1";
  const params = [];
  const countParams = [];

  // Search filter
  if (search) {
    sql += " AND (pname LIKE ? OR description LIKE ?)";
    countSql += " AND (pname LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`);
  }

  // Category filter by name
  if (category && category !== "All") {
    sql += " AND categoryid = (SELECT id FROM category WHERE name = ?)";
    countSql += " AND categoryid = (SELECT id FROM category WHERE name = ?)";
    params.push(category);
    countParams.push(category);
  }

  // Category filter by ID (for related products)
  if (categoryId) {
    sql += " AND categoryid = ?";
    countSql += " AND categoryid = ?";
    params.push(categoryId);
    countParams.push(categoryId);
  }

  // Price range filter
  if (minPrice) {
    sql += " AND price >= ?";
    countSql += " AND price >= ?";
    params.push(minPrice);
    countParams.push(minPrice);
  }
  if (maxPrice) {
    sql += " AND price <= ?";
    countSql += " AND price <= ?";
    params.push(maxPrice);
    countParams.push(maxPrice);
  }

  // Add pagination
  sql += " LIMIT ? OFFSET ?";
  params.push(itemsPerPage, offset);

  console.log("PRODUCT SEARCH:", { search, category, minPrice, maxPrice, categoryId, page, limit: itemsPerPage });
  
  // Get total count
  db.query(countSql, countParams, (err, countResult) => {
    if (err) {
      console.log("COUNT ERROR:", err);
      return res.status(500).json({ products: [], total: 0, page: currentPage, totalPages: 0 });
    }

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / itemsPerPage);

    // Get paginated products
    db.query(sql, params, (err, rows) => {
      if (err) {
        console.log("PRODUCT FETCH ERROR:", err);
        return res.status(500).json({ products: [], total: 0, page: currentPage, totalPages: 0 });
      }
      console.log("PRODUCTS FOUND:", rows.length, "of", total);
      res.json({
        products: rows,
        total: total,
        page: currentPage,
        totalPages: totalPages,
        itemsPerPage: itemsPerPage
      });
    });
  });
});

// Get flash deals (products with good ratings and stock)
app.get("/api/flash-deals", (req, res) => {
  const sql = `
    SELECT p.*,
           COALESCE(
             (SELECT pi.image_url FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.display_order ASC
              LIMIT 1),
             p.image
           ) AS image
    FROM product p
    WHERE COALESCE(p.stock_quantity, p.stock, 0) > 0
    ORDER BY RAND()
    LIMIT 4
  `;
  
  db.query(sql, (err, rows) => {
    if (err) {
      console.log("FLASH DEALS FETCH ERROR:", err);
      return res.status(500).json([]);
    }
    res.json(rows);
  });
});

app.post("/api/products", (req, res) => {
  const {
    pname,
    description,
    image,
    price,
    pricetype,
    status,
    userid,
    categoryid,
    stock = 0,
  } = req.body;

  const sql = `
    INSERT INTO product 
    (pname, description, image, price, pricetype, status, userid, categoryid, stock)
    VALUES (?,?,?,?,?,?,?,?,?)
  `;

  db.query(
    sql,
    [pname, description, image, price, pricetype, status, userid, categoryid, stock],
    (err) => {
      if (err) {
        console.log("ADD PRODUCT ERROR:", err);
        return res.status(500).json({ msg: "Error adding product" });
      }
      res.json({ msg: "Product added" });
    }
  );
});

// Update product basic details
app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { pname, description, price, stock, categoryid } = req.body;

  if (!pname || !price || !categoryid) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  const sql = "UPDATE product SET pname = ?, description = ?, price = ?, stock = ?, categoryid = ? WHERE id = ?";

  db.query(sql, [pname, description || "", price, stock || 0, categoryid, id], (err) => {
    if (err) {
      console.log("UPDATE PRODUCT ERROR:", err);
      return res.status(500).json({ msg: "Error updating product" });
    }
    res.json({ msg: "Product updated successfully" });
  });
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM product WHERE id=?";

  db.query(sql, [id], (err) => {
    if (err) {
      console.log("DELETE PRODUCT ERROR:", err);
      return res.status(500).json({ msg: "Error deleting product" });
    }
    res.json({ msg: "Product deleted successfully" });
  });
});

// Get product images
app.get("/api/products/:id/images", (req, res) => {
  const { id } = req.params;
  
  db.query(
    "SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC",
    [id],
    (err, rows) => {
      if (err) {
        console.log("GET PRODUCT IMAGES ERROR:", err);
        return res.status(500).json([]);
      }
      res.json(rows);
    }
  );
});

// Upload additional product images
app.post("/api/products/:id/images", upload.array("images", 5), (req, res) => {
  const { id } = req.params;
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ msg: "No images uploaded" });
  }

  const values = req.files.map((file, index) => [
    id,
    "/uploads/" + file.filename,
    index
  ]);

  db.query(
    "INSERT INTO product_images (product_id, image_url, display_order) VALUES ?",
    [values],
    (err) => {
      if (err) {
        console.log("UPLOAD PRODUCT IMAGES ERROR:", err);
        return res.status(500).json({ msg: "Error uploading images" });
      }
      res.json({ msg: "Images uploaded successfully", count: req.files.length });
    }
  );
});

// Delete a product image
app.delete("/api/product-images/:imageId", (req, res) => {
  const { imageId } = req.params;
  
  db.query("DELETE FROM product_images WHERE id = ?", [imageId], (err) => {
    if (err) {
      console.log("DELETE PRODUCT IMAGE ERROR:", err);
      return res.status(500).json({ msg: "Error deleting image" });
    }
    res.json({ msg: "Image deleted successfully" });
  });
});

// -------- PRODUCT VARIANTS --------

// Get all variants for a product
app.get("/api/products/:id/variants", (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM product_variants WHERE product_id = ? ORDER BY created_at DESC",
    [id],
    (err, rows) => {
      if (err) {
        console.log("FETCH VARIANTS ERROR:", err);
        return res.status(500).json({ msg: "Error fetching variants" });
      }
      res.json(rows);
    }
  );
});

// Add new variant for a product
app.post("/api/products/:id/variants", (req, res) => {
  const { id } = req.params;
  const { size, color, price, stock, sku } = req.body;

  if (!size || !color || !price || stock === undefined) {
    return res.status(400).json({ msg: "Missing required fields: size, color, price, stock" });
  }

  db.query(
    "INSERT INTO product_variants (product_id, size, color, price, stock, sku) VALUES (?, ?, ?, ?, ?, ?)",
    [id, size, color, price, stock, sku || `${id}-${size}-${color}`],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ msg: "This variant already exists for this product" });
        }
        console.log("ADD VARIANT ERROR:", err);
        return res.status(500).json({ msg: "Error adding variant" });
      }
      res.json({ msg: "Variant added successfully", variantId: result.insertId });
    }
  );
});

// Update variant
app.put("/api/products/:id/variants/:variantId", (req, res) => {
  const { id, variantId } = req.params;
  const { size, color, price, stock, sku } = req.body;

  db.query(
    "UPDATE product_variants SET size = ?, color = ?, price = ?, stock = ?, sku = ? WHERE id = ? AND product_id = ?",
    [size, color, price, stock, sku, variantId, id],
    (err) => {
      if (err) {
        console.log("UPDATE VARIANT ERROR:", err);
        return res.status(500).json({ msg: "Error updating variant" });
      }
      res.json({ msg: "Variant updated successfully" });
    }
  );
});

// Delete variant
app.delete("/api/products/:id/variants/:variantId", (req, res) => {
  const { id, variantId } = req.params;

  db.query(
    "DELETE FROM product_variants WHERE id = ? AND product_id = ?",
    [variantId, id],
    (err) => {
      if (err) {
        console.log("DELETE VARIANT ERROR:", err);
        return res.status(500).json({ msg: "Error deleting variant" });
      }
      res.json({ msg: "Variant deleted successfully" });
    }
  );
});

// -------- CART --------

app.get("/api/cart/:userId", (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT c.id, p.pname, c.quantity, c.price, p.id AS product_id
    FROM cart_items c
    JOIN product p ON c.product_id = p.id
    WHERE c.user_id = ?
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.log("CART FETCH ERROR:", err);
      return res.status(500).json([]);
    }
    res.json(rows);
  });
});

app.post("/api/cart", (req, res) => {
  const { user_id, product_id, price, variant_id } = req.body;

  const check = variant_id
    ? "SELECT * FROM cart_items WHERE user_id=? AND product_id=? AND variant_id=?"
    : "SELECT * FROM cart_items WHERE user_id=? AND product_id=? AND variant_id IS NULL";

  const checkParams = variant_id ? [user_id, product_id, variant_id] : [user_id, product_id];

  db.query(check, checkParams, (err, rows) => {
    if (err) {
      console.log("CART CHECK ERROR:", err);
      return res.status(500).json({ msg: "Cart error" });
    }

    if (rows.length > 0) {
      db.query(
        "UPDATE cart_items SET quantity = quantity + 1 WHERE id=?",
        [rows[0].id],
        () => res.json({ msg: "Updated" })
      );
    } else {
      db.query(
        "INSERT INTO cart_items (user_id, product_id, price, variant_id) VALUES (?,?,?,?)",
        [user_id, product_id, price, variant_id || null],
        () => res.json({ msg: "Added" })
      );
    }
  });
});

// -------- ORDERS --------

app.get("/api/orders", (req, res) => {
  const sql = `
    SELECT o.*, 
           GROUP_CONCAT(
             JSON_OBJECT(
               'description', ot.description,
               'price', ot.price,
               'quantity', ot.quantity
             )
           ) as items
    FROM orders o
    LEFT JOIN order_transactions ot ON o.order_id = ot.order_id
    GROUP BY o.order_id
    ORDER BY o.date DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.log("FETCH ALL ORDERS ERROR:", err);
      return res.status(500).json([]);
    }

    // Parse items JSON string
    const orders = rows.map(order => ({
      ...order,
      items: order.items ? JSON.parse(`[${order.items}]`) : []
    }));

    console.log(`ALL ORDERS FETCHED:`, orders.length);
    res.json(orders);
  });
});

app.get("/api/orders/:userId", (req, res) => {
  const { userId } = req.params;

  console.log("FETCH ORDERS FOR USER - userId param:", userId, "type:", typeof userId);
  
  const sql = `
    SELECT o.*, 
           GROUP_CONCAT(
             JSON_OBJECT(
               'description', ot.description,
               'price', ot.price,
               'quantity', ot.quantity
             )
           ) as items
    FROM orders o
    LEFT JOIN order_transactions ot ON o.order_id = ot.order_id
    WHERE o.user_id = ?
    GROUP BY o.order_id
    ORDER BY o.date DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.log("FETCH ORDERS ERROR:", err);
      return res.status(500).json([]);
    }

    // Parse items JSON string
    const orders = rows.map(order => ({
      ...order,
      items: order.items ? JSON.parse(`[${order.items}]`) : []
    }));

    console.log(`ORDERS FETCHED for user ${userId}:`, orders.length);
    res.json(orders);
  });
});

app.post("/api/orders", (req, res) => {
  const { user_id, items, total, shippingAddress, paymentMethod } = req.body;
  const orderId = "ORD" + Date.now();

  console.log("ORDER REQUEST:", { user_id, items: items.length, total, shippingAddress, paymentMethod });
  console.log("USER ID TYPE:", typeof user_id, "VALUE:", user_id);

  if (!user_id || !items || items.length === 0) {
    console.log("ORDER VALIDATION FAILED - Missing user_id or items");
    return res.status(400).json({ msg: "Invalid order data" });
  }

  // Prepare shipping address string
  const addressString = shippingAddress 
    ? `${shippingAddress.name}, ${shippingAddress.phone}, ${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.pincode}`
    : "";

  db.query(
    "INSERT INTO orders (order_id, user_id, net_total, shipping_address, payment_method, status) VALUES (?,?,?,?,?,?)",
    [orderId, user_id, total, addressString, paymentMethod || "COD", "Pending"],
    (err) => {
      if (err) {
        console.log("ORDER ERROR:", err);
        return res.status(500).json({ msg: "Order error" });
      }

      // Insert order items and decrement stock
      items.forEach((i) => {
        const productName = i.pname || i.name;
        const quantity = i.qty || 1;
        const price = i.price || 0;

        db.query(
          `INSERT INTO order_transactions 
           (order_id, user_id, product_id, description, price, quantity)
           VALUES (?,?,?,?,?,?)`,
          [orderId, user_id, i.id, productName, price, quantity]
        );

        // Decrement stock by quantity ordered (variant or product)
        if (i.variant_id) {
          // Decrement variant stock
          db.query(
            "UPDATE product_variants SET stock = GREATEST(0, stock - ?) WHERE id = ? AND product_id = ?",
            [quantity, i.variant_id, i.id],
            (err) => {
              if (err) {
                console.log("VARIANT STOCK DECREMENT ERROR:", err);
              } else {
                console.log(`Variant stock decremented for variant ${i.variant_id} by ${quantity}`);
              }
            }
          );
        } else {
          // Decrement product stock
          db.query(
            "UPDATE product SET stock = GREATEST(0, stock - ?) WHERE id = ?",
            [quantity, i.id],
            (err) => {
              if (err) {
                console.log("STOCK DECREMENT ERROR:", err);
              } else {
                console.log(`Stock decremented for product ${i.id} by ${quantity}`);
              }
            }
          );
        }
      });

      // Clear user's cart
      db.query("DELETE FROM cart_items WHERE user_id=?", [user_id]);

      console.log("ORDER PLACED:", orderId);
      res.json({ msg: "Order placed successfully", orderId });
    }
  );
});

app.put("/api/orders/:orderId/status", (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  console.log("UPDATE ORDER STATUS:", { orderId, status });

  if (!["Pending", "Approved", "Dispatched", "Delivered", "Cancelled"].includes(status)) {
    return res.status(400).json({ msg: "Invalid status" });
  }

  db.query("SELECT status FROM orders WHERE order_id = ?", [orderId], (err, rows) => {
    if (err) {
      console.log("ORDER STATUS FETCH ERROR:", err);
      return res.status(500).json({ msg: "Error fetching order" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ msg: "Order not found" });
    }

    const previousStatus = rows[0].status;

    db.query(
      "UPDATE orders SET status = ? WHERE order_id = ?",
      [status, orderId],
      (err) => {
        if (err) {
          console.log("UPDATE STATUS ERROR:", err);
          return res.status(500).json({ msg: "Error updating status" });
        }

        const shouldRestock = status === "Cancelled" && previousStatus !== "Cancelled";
        if (!shouldRestock) {
          console.log("ORDER STATUS UPDATED:", orderId, "->", status);
          return res.json({ msg: "Order status updated successfully" });
        }

        db.query(
          "SELECT product_id, SUM(quantity) AS qty FROM order_transactions WHERE order_id = ? GROUP BY product_id",
          [orderId],
          (err, items) => {
            if (err) {
              console.log("RESTOCK FETCH ERROR:", err);
              return res.json({ msg: "Order cancelled, but restock failed" });
            }

            items.forEach((item) => {
              db.query(
                "UPDATE product SET stock = stock + ? WHERE id = ?",
                [item.qty, item.product_id],
                (err) => {
                  if (err) {
                    console.log("RESTOCK ERROR:", err);
                  }
                }
              );
            });

            console.log("ORDER STATUS UPDATED:", orderId, "->", status, "(restocked)");
            return res.json({ msg: "Order status updated successfully" });
          }
        );
      }
    );
  });
});

// -------- REVIEWS --------

// Create reviews table if not exists
db.query(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    user_name VARCHAR(255),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) console.log("Reviews table creation:", err.message);
  else console.log("Reviews table ready");
});

// Create wishlist table if not exists
db.query(`
  CREATE TABLE IF NOT EXISTS wishlist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_wishlist (user_id, product_id)
  )
`, (err) => {
  if (err) console.log("Wishlist table creation:", err.message);
  else console.log("Wishlist table ready");
});

// Create coupons table if not exists
db.query(`
  CREATE TABLE IF NOT EXISTS coupons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type ENUM('percentage', 'flat') DEFAULT 'percentage',
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_value DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2) DEFAULT NULL,
    usage_limit INT DEFAULT NULL,
    used_count INT DEFAULT 0,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) console.log("Coupons table creation:", err.message);
  else console.log("Coupons table ready");
});

// Create product_images table for multiple images per product
db.query(`
  CREATE TABLE IF NOT EXISTS product_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) console.log("Product images table creation:", err.message);
  else console.log("Product images table ready");
});

// Add stock column to product table if it doesn't exist
db.query(`
  ALTER TABLE product ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0
`, (err) => {
  if (err && err.code !== 'ER_DUP_FIELDNAME') {
    console.log("Add stock column:", err.message);
  } else {
    console.log("Stock column ready");
  }
});

// Get reviews for a product
app.get("/api/products/:id/reviews", (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT r.*, u.name as user_name
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.date DESC
  `;
  
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.log("REVIEWS FETCH ERROR:", err);
      return res.status(500).json({ msg: "Error fetching reviews" });
    }
    res.json(rows);
  });
});

// Add a review
app.post("/api/products/:id/reviews", (req, res) => {
  const { id } = req.params;
  const { user_id, rating, review_text } = req.body;
  
  if (!user_id || !rating) {
    return res.status(400).json({ msg: "User ID and rating are required" });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ msg: "Rating must be between 1 and 5" });
  }
  
  // Check if user already reviewed this product
  db.query(
    "SELECT id FROM reviews WHERE product_id = ? AND user_id = ?",
    [id, user_id],
    (err, rows) => {
      if (err) {
        console.log("CHECK REVIEW ERROR:", err);
        return res.status(500).json({ msg: "Error checking existing review" });
      }
      
      if (rows.length > 0) {
        return res.status(400).json({ msg: "You have already reviewed this product" });
      }
      
      // Insert review
      const sql = "INSERT INTO reviews (product_id, user_id, rating, review_text) VALUES (?, ?, ?, ?)";
      
      db.query(sql, [id, user_id, rating, review_text], (err, result) => {
        if (err) {
          console.log("INSERT REVIEW ERROR:", err);
          return res.status(500).json({ msg: "Error submitting review" });
        }
        res.json({ msg: "Review submitted successfully", id: result.insertId });
      });
    }
  );
});

// Get average rating for a product
app.get("/api/products/:id/rating", (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT 
      AVG(rating) as average_rating,
      COUNT(*) as review_count
    FROM reviews
    WHERE product_id = ?
  `;
  
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.log("RATING FETCH ERROR:", err);
      return res.status(500).json({ msg: "Error fetching rating" });
    }
    res.json({
      average_rating: rows[0].average_rating || 0,
      review_count: rows[0].review_count || 0
    });
  });
});

// Get related products (same category, excluding current product)
app.get("/api/products/:id/related", (req, res) => {
  const { id } = req.params;
  const limit = req.query.limit || 6;
  
  const sql = `
    SELECT p.*,
           COALESCE(
             (SELECT pi.image_url FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.display_order ASC
              LIMIT 1),
             p.image
           ) AS image
    FROM product p
    WHERE p.categoryid = (
      SELECT categoryid FROM product WHERE id = ?
    )
    AND p.id != ?
    ORDER BY p.id DESC
    LIMIT ?
  `;
  
  db.query(sql, [id, id, parseInt(limit)], (err, rows) => {
    if (err) {
      console.log("RELATED PRODUCTS FETCH ERROR:", err);
      return res.status(500).json({ msg: "Error fetching related products" });
    }
    res.json(rows || []);
  });
});

// -------- WISHLIST --------

// Get wishlist for a user
app.get("/api/wishlist/:userId", (req, res) => {
  const { userId } = req.params;
  
  const sql = `
    SELECT w.id, w.product_id, w.date_added, 
           p.pname, p.description,
           COALESCE(
             (SELECT pi.image_url FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.display_order ASC
              LIMIT 1),
             p.image
           ) AS image,
           p.price, p.categoryid
    FROM wishlist w
    JOIN product p ON w.product_id = p.id
    WHERE w.user_id = ?
    ORDER BY w.date_added DESC
  `;
  
  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.log("WISHLIST FETCH ERROR:", err);
      return res.status(500).json({ msg: "Error fetching wishlist" });
    }
    res.json(rows);
  });
});

// Add to wishlist
app.post("/api/wishlist", (req, res) => {
  const { user_id, product_id } = req.body;
  
  if (!user_id || !product_id) {
    return res.status(400).json({ msg: "User ID and Product ID are required" });
  }
  
  const sql = "INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)";
  
  db.query(sql, [user_id, product_id], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ msg: "Product already in wishlist" });
      }
      console.log("ADD TO WISHLIST ERROR:", err);
      return res.status(500).json({ msg: "Error adding to wishlist" });
    }
    res.json({ msg: "Added to wishlist", id: result.insertId });
  });
});

// Remove from wishlist
app.delete("/api/wishlist/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = "DELETE FROM wishlist WHERE id = ?";
  
  db.query(sql, [id], (err) => {
    if (err) {
      console.log("REMOVE FROM WISHLIST ERROR:", err);
      return res.status(500).json({ msg: "Error removing from wishlist" });
    }
    res.json({ msg: "Removed from wishlist" });
  });
});

// Check if product is in wishlist
app.get("/api/wishlist/:userId/:productId", (req, res) => {
  const { userId, productId } = req.params;
  
  const sql = "SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?";
  
  db.query(sql, [userId, productId], (err, rows) => {
    if (err) {
      console.log("CHECK WISHLIST ERROR:", err);
      return res.status(500).json({ msg: "Error checking wishlist" });
    }
    res.json({ inWishlist: rows.length > 0, wishlistId: rows[0]?.id || null });
  });
});

// -------- ANALYTICS --------

app.get("/api/analytics", (req, res) => {
  const analytics = {};

  // Get total revenue
  db.query("SELECT SUM(net_total) AS total_revenue FROM orders", (err, rows) => {
    if (err) {
      console.log("REVENUE ERROR:", err);
      analytics.total_revenue = 0;
    } else {
      analytics.total_revenue = rows[0].total_revenue || 0;
    }

    // Get orders by status
    db.query(
      `SELECT status, COUNT(*) AS count, SUM(net_total) AS revenue 
       FROM orders 
       GROUP BY status`,
      (err, rows) => {
        if (err) {
          console.log("ORDERS BY STATUS ERROR:", err);
          analytics.orders_by_status = [];
        } else {
          analytics.orders_by_status = rows;
        }

        // Get top selling products
        db.query(
          `SELECT p.pname,
                  COALESCE(
                    (SELECT pi.image_url FROM product_images pi
                     WHERE pi.product_id = p.id
                     ORDER BY pi.display_order ASC
                     LIMIT 1),
                    p.image
                  ) AS image,
                  SUM(ot.quantity) AS total_sold,
                  SUM(ot.quantity * ot.price) AS revenue
           FROM order_transactions ot
           JOIN product p ON ot.product_id = p.id
           GROUP BY ot.product_id, p.pname, image
           ORDER BY total_sold DESC
           LIMIT 5`,
          (err, rows) => {
            if (err) {
              console.log("TOP PRODUCTS ERROR:", err);
              analytics.top_products = [];
            } else {
              analytics.top_products = rows;
            }

            // Get total counts
            db.query("SELECT COUNT(*) AS count FROM orders", (err, rows) => {
              analytics.total_orders = rows && rows[0] ? rows[0].count : 0;

              db.query("SELECT COUNT(*) AS count FROM users", (err, rows) => {
                analytics.total_customers = rows && rows[0] ? rows[0].count : 0;

                db.query("SELECT COUNT(*) AS count FROM product", (err, rows) => {
                  analytics.total_products = rows && rows[0] ? rows[0].count : 0;

                  // Get sales over time (last 6 months)
                  db.query(
                    `SELECT 
                      DATE_FORMAT(date, '%Y-%m') AS month,
                      COUNT(*) AS orders,
                      SUM(net_total) AS revenue
                     FROM orders
                     WHERE date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                     GROUP BY month
                     ORDER BY month`,
                    (err, rows) => {
                      if (err) {
                        console.log("SALES OVER TIME ERROR:", err);
                        analytics.sales_over_time = [];
                      } else {
                        analytics.sales_over_time = rows;
                      }

                      res.json(analytics);
                    }
                  );
                });
              });
            });
          }
        );
      }
    );
  });
});

// -------- COUPONS --------

// Get all coupons (admin)
app.get("/api/coupons", (req, res) => {
  db.query("SELECT * FROM coupons ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      console.log("FETCH COUPONS ERROR:", err);
      return res.status(500).json([]);
    }
    res.json(rows);
  });
});

// Create coupon (admin)
app.post("/api/coupons", (req, res) => {
  const { code, discount_type, discount_value, min_order_value, max_discount, usage_limit, expiry_date } = req.body;
  
  if (!code || !discount_value) {
    return res.status(400).json({ msg: "Code and discount value are required" });
  }

  const sql = `INSERT INTO coupons 
    (code, discount_type, discount_value, min_order_value, max_discount, usage_limit, expiry_date) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.query(
    sql,
    [code.toUpperCase(), discount_type || 'percentage', discount_value, min_order_value || 0, max_discount, usage_limit, expiry_date],
    (err) => {
      if (err) {
        console.log("CREATE COUPON ERROR:", err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ msg: "Coupon code already exists" });
        }
        return res.status(500).json({ msg: "Error creating coupon" });
      }
      res.json({ msg: "Coupon created successfully" });
    }
  );
});

// Validate and apply coupon
app.post("/api/coupons/validate", (req, res) => {
  const { code, orderTotal } = req.body;
  
  if (!code) {
    return res.status(400).json({ msg: "Coupon code is required" });
  }

  const sql = "SELECT * FROM coupons WHERE code = ? AND is_active = TRUE";
  
  db.query(sql, [code.toUpperCase()], (err, rows) => {
    if (err) {
      console.log("VALIDATE COUPON ERROR:", err);
      return res.status(500).json({ msg: "Error validating coupon" });
    }
    
    if (rows.length === 0) {
      return res.status(404).json({ msg: "Invalid coupon code" });
    }
    
    const coupon = rows[0];
    
    // Check expiry date
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return res.status(400).json({ msg: "Coupon has expired" });
    }
    
    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ msg: "Coupon usage limit reached" });
    }
    
    // Check minimum order value
    if (orderTotal < coupon.min_order_value) {
      return res.status(400).json({ 
        msg: `Minimum order value of ₹${coupon.min_order_value} required` 
      });
    }
    
    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (orderTotal * coupon.discount_value) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.discount_value;
    }
    
    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discount
      }
    });
  });
});

// Update coupon (admin)
app.put("/api/coupons/:id", (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  
  db.query("UPDATE coupons SET is_active = ? WHERE id = ?", [is_active, id], (err) => {
    if (err) {
      console.log("UPDATE COUPON ERROR:", err);
      return res.status(500).json({ msg: "Error updating coupon" });
    }
    res.json({ msg: "Coupon updated successfully" });
  });
});

// Delete coupon (admin)
app.delete("/api/coupons/:id", (req, res) => {
  const { id } = req.params;
  
  db.query("DELETE FROM coupons WHERE id = ?", [id], (err) => {
    if (err) {
      console.log("DELETE COUPON ERROR:", err);
      return res.status(500).json({ msg: "Error deleting coupon" });
    }
    res.json({ msg: "Coupon deleted successfully" });
  });
});

// Increment coupon usage (called after successful order)
app.post("/api/coupons/:id/use", (req, res) => {
  const { id } = req.params;
  
  db.query("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?", [id], (err) => {
    if (err) {
      console.log("INCREMENT COUPON ERROR:", err);
      return res.status(500).json({ msg: "Error updating coupon usage" });
    }
    res.json({ msg: "Coupon usage updated" });
  });
});

// -------- LOW STOCK ALERTS --------

// Get products with low stock (default threshold: 10)
app.get("/api/low-stock", (req, res) => {
  const { threshold = 10 } = req.query;
  
  const sql = `
    SELECT p.id, p.pname, p.description,
           COALESCE(
             (SELECT pi.image_url FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.display_order ASC
              LIMIT 1),
             p.image
           ) AS image,
           p.price, p.stock, p.categoryid
    FROM product p
    WHERE p.stock <= ? AND p.status = 1
    ORDER BY p.stock ASC
  `;
  
  db.query(sql, [threshold], (err, rows) => {
    if (err) {
      console.log("LOW STOCK ERROR:", err);
      return res.status(500).json([]);
    }
    res.json(rows);
  });
});

// Update product stock
app.put("/api/products/:id/stock", (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;
  
  if (stock === undefined || stock === null) {
    return res.status(400).json({ msg: "Stock quantity is required" });
  }
  
  const sql = "UPDATE product SET stock = ? WHERE id = ?";
  
  db.query(sql, [parseInt(stock), id], (err) => {
    if (err) {
      console.log("UPDATE STOCK ERROR:", err);
      return res.status(500).json({ msg: "Error updating stock" });
    }
    res.json({ msg: "Stock updated successfully" });
  });
});

// Increment/Decrement stock
app.patch("/api/products/:id/stock", (req, res) => {
  const { id } = req.params;
  const { change } = req.body; // positive for increment, negative for decrement
  
  if (!change) {
    return res.status(400).json({ msg: "Change quantity is required" });
  }
  
  const sql = "UPDATE product SET stock = stock + ? WHERE id = ?";
  
  db.query(sql, [change, id], (err) => {
    if (err) {
      console.log("UPDATE STOCK ERROR:", err);
      return res.status(500).json({ msg: "Error updating stock" });
    }
    res.json({ msg: "Stock updated successfully" });
  });
});

// Check stock availability for products
app.post("/api/check-stock", (req, res) => {
  const { items } = req.body;
  
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ msg: "Items array is required" });
  }

  const unavailableItems = [];
  let checkedCount = 0;

  items.forEach((item) => {
    let sql, params;

    if (item.variant_id) {
      // Check variant stock
      sql = "SELECT stock FROM product_variants WHERE id = ? AND product_id = ?";
      params = [item.variant_id, item.id];
    } else {
      // Check product stock
      sql = "SELECT stock FROM product WHERE id = ?";
      params = [item.id];
    }

    db.query(sql, params, (err, rows) => {
      checkedCount++;
      
      if (err) {
        console.log("STOCK CHECK ERROR:", err);
      } else if (rows.length > 0) {
        const availableStock = rows[0].stock || 0;
        if (availableStock < (item.qty || 1)) {
          unavailableItems.push({
            productId: item.id,
            variantId: item.variant_id,
            requested: item.qty || 1,
            available: availableStock,
            name: item.pname || item.name,
          });
        }
      }

      // Send response when all items are checked
      if (checkedCount === items.length) {
        if (unavailableItems.length > 0) {
          return res.status(400).json({
            msg: "Some items are out of stock",
            unavailable: unavailableItems,
          });
        }
        res.json({ msg: "All items in stock", available: true });
      }
    });
  });
});

// -------- PRICE ALERTS API --------

// Get all price alerts for a user
app.get("/api/price-alerts/:userId", (req, res) => {
  const { userId } = req.params;
  
  const sql = `
    SELECT pa.*, p.pname, p.price as product_price, p.image 
    FROM price_alerts pa
    JOIN product p ON pa.product_id = p.id
    WHERE pa.user_id = ? AND pa.is_active = TRUE
    ORDER BY pa.created_at DESC
  `;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.log("Fetch price alerts error:", err);
      return res.status(500).json({ msg: "Database error" });
    }
    res.json(results);
  });
});

// Create a new price alert
app.post("/api/price-alerts", (req, res) => {
  const { user_id, product_id, target_price, current_price } = req.body;
  
  if (!user_id || !product_id || !target_price || !current_price) {
    return res.status(400).json({ msg: "Missing required fields" });
  }
  
  // Check if alert already exists for this user and product
  const checkSql = `
    SELECT id FROM price_alerts 
    WHERE user_id = ? AND product_id = ? AND is_active = TRUE
  `;
  
  db.query(checkSql, [user_id, product_id], (err, existing) => {
    if (err) {
      console.log("Check existing alert error:", err);
      return res.status(500).json({ msg: "Database error" });
    }
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        msg: "You already have an active price alert for this product" 
      });
    }
    
    const insertSql = `
      INSERT INTO price_alerts (user_id, product_id, target_price, current_price)
      VALUES (?, ?, ?, ?)
    `;
    
    db.query(insertSql, [user_id, product_id, target_price, current_price], (err, result) => {
      if (err) {
        console.log("Create price alert error:", err);
        return res.status(500).json({ msg: "Database error" });
      }
      res.json({ 
        msg: "Price alert created successfully",
        id: result.insertId
      });
    });
  });
});

// Delete a price alert
app.delete("/api/price-alerts/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = "DELETE FROM price_alerts WHERE id = ?";
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.log("Delete price alert error:", err);
      return res.status(500).json({ msg: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: "Price alert not found" });
    }
    
    res.json({ msg: "Price alert deleted successfully" });
  });
});

// Check for price drops and notify users (Background job - can be called periodically)
app.post("/api/price-alerts/check", (req, res) => {
  const sql = `
    SELECT pa.*, p.price as product_price, p.pname, u.email, u.name as user_name
    FROM price_alerts pa
    JOIN product p ON pa.product_id = p.id
    JOIN users u ON pa.user_id = u.id
    WHERE pa.is_active = TRUE AND pa.notified = FALSE
  `;
  
  db.query(sql, (err, alerts) => {
    if (err) {
      console.log("Check price alerts error:", err);
      return res.status(500).json({ msg: "Database error" });
    }
    
    const triggered = [];
    let checked = 0;
    
    if (alerts.length === 0) {
      return res.json({ msg: "No active alerts", triggered: [] });
    }
    
    alerts.forEach((alert) => {
      // Update current price
      const updateSql = `UPDATE price_alerts SET current_price = ? WHERE id = ?`;
      
      db.query(updateSql, [alert.product_price, alert.id], (err) => {
        if (err) console.log("Update price error:", err);
        
        // Check if price dropped below target
        if (alert.product_price <= alert.target_price) {
          triggered.push({
            id: alert.id,
            user_id: alert.user_id,
            user_name: alert.user_name,
            user_email: alert.email,
            product_id: alert.product_id,
            product_name: alert.pname,
            target_price: alert.target_price,
            current_price: alert.product_price
          });
          
          // Mark as notified
          const notifySql = `UPDATE price_alerts SET notified = TRUE WHERE id = ?`;
          db.query(notifySql, [alert.id], (err) => {
            if (err) console.log("Mark notified error:", err);
          });
        }
        
        checked++;
        
        if (checked === alerts.length) {
          res.json({ 
            msg: `Checked ${alerts.length} alerts, ${triggered.length} triggered`,
            triggered 
          });
        }
      });
    });
  });
});

// Get triggered alerts for a user (for frontend notification)
app.get("/api/price-alerts/:userId/triggered", (req, res) => {
  const { userId } = req.params;
  
  const sql = `
    SELECT pa.*, p.pname, p.price as product_price, p.image 
    FROM price_alerts pa
    JOIN product p ON pa.product_id = p.id
    WHERE pa.user_id = ? AND pa.notified = TRUE AND pa.is_active = TRUE
    ORDER BY pa.updated_at DESC
    LIMIT 10
  `;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.log("Fetch triggered alerts error:", err);
      return res.status(500).json({ msg: "Database error" });
    }
    res.json(results);
  });
});

app.listen(8000, () => {
  console.log("Server running on http://localhost:8000");
});
