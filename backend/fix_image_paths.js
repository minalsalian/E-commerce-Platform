const db = require("./db");

// Update all product image paths to include /uploads/ prefix
db.query("SELECT id, image FROM product", (err, rows) => {
  if (err) {
    console.log("Error fetching products:", err);
    process.exit(1);
  }

  console.log(`Found ${rows.length} products`);

  rows.forEach((row) => {
    if (row.image && !row.image.startsWith("/uploads/")) {
      const newImagePath = `/uploads/${row.image}`;
      
      db.query(
        "UPDATE product SET image = ? WHERE id = ?",
        [newImagePath, row.id],
        (err) => {
          if (err) {
            console.log(`Error updating product ${row.id}:`, err);
          } else {
            console.log(`✓ Updated product ${row.id}: ${row.image} → ${newImagePath}`);
          }
        }
      );
    }
  });

  setTimeout(() => {
    console.log("\nAll done! Closing connection...");
    process.exit(0);
  }, 2000);
});
