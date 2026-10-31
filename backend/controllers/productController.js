const { query, transaction } = require('../config/db');

// 1. Get all products with variants & calculated pricing
async function getAllProducts(req, res, next) {
  try {
    const { search, status, type } = req.query;
    let sql = `
      SELECT p.*, 
        COUNT(v.id) AS variant_count
      FROM products p
      LEFT JOIN product_variants v ON p.id = v.product_id AND v.status = 'active'
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.product_code LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && status !== 'all') {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    if (type && type !== 'all') {
      sql += ' AND p.product_type = ?';
      params.push(type);
    }

    sql += ' GROUP BY p.id ORDER BY p.id DESC';

    const products = await query(sql, params);

    // Fetch all active variants for these products
    const variants = await query(
      `SELECT v.*, 
        (p.sales_price + v.additional_price) AS calculated_final_price
       FROM product_variants v
       JOIN products p ON v.product_id = p.id
       ORDER BY v.id ASC`
    );

    // Map variants to products
    const variantMap = {};
    variants.forEach((v) => {
      if (!variantMap[v.product_id]) variantMap[v.product_id] = [];
      variantMap[v.product_id].push(v);
    });

    const enrichedProducts = products.map((prod) => ({
      ...prod,
      variants: variantMap[prod.id] || []
    }));

    return res.json({ success: true, count: enrichedProducts.length, data: enrichedProducts });
  } catch (error) {
    next(error);
  }
}

// 2. Get single product with full variants
async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const products = await query('SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = products[0];
    const variants = await query(
      `SELECT *, (sales_price + additional_price) AS calculated_final_price 
       FROM (
         SELECT v.*, ? as sales_price 
         FROM product_variants v 
         WHERE v.product_id = ?
       ) t`,
      [product.sales_price, id]
    );

    product.variants = variants;
    return res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

// 3. Create Product with optional variants
async function createProduct(req, res, next) {
  try {
    const { product_code, name, product_type, sales_price, cost_price, description, status, variants } = req.body;

    if (!name || sales_price === undefined) {
      return res.status(400).json({ success: false, message: 'Product name and sales price are required.' });
    }

    const code = product_code || `PRD-BL-${Date.now().toString().slice(-4)}`;

    const result = await transaction(async (conn) => {
      const [prodRes] = await conn.query(
        `INSERT INTO products 
         (product_code, name, product_type, sales_price, cost_price, description, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [code, name, product_type || 'saas_subscription', sales_price, cost_price || 0, description || null, status || 'active']
      );

      const productId = prodRes.insertId;

      // Add default variant if none provided
      const variantList = Array.isArray(variants) && variants.length > 0 
        ? variants 
        : [{ variant_name: 'Standard Edition', sku: `SKU-${code}-STD`, additional_price: 0 }];

      for (const v of variantList) {
        const sku = v.sku || `SKU-${code}-${Date.now().toString().slice(-4)}`;
        await conn.query(
          `INSERT INTO product_variants (product_id, variant_name, sku, additional_price, status) 
           VALUES (?, ?, ?, ?, ?)`,
          [productId, v.variant_name, sku, v.additional_price || 0, v.status || 'active']
        );
      }

      return productId;
    });

    return res.status(201).json({ success: true, message: 'Product created successfully!', productId: result });
  } catch (error) {
    next(error);
  }
}

// 4. Update Product
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { product_code, name, product_type, sales_price, cost_price, description, status } = req.body;

    const [existing] = await query('SELECT id FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await query(
      `UPDATE products 
       SET product_code = COALESCE(?, product_code),
           name = COALESCE(?, name),
           product_type = COALESCE(?, product_type),
           sales_price = COALESCE(?, sales_price),
           cost_price = COALESCE(?, cost_price),
           description = COALESCE(?, description),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [product_code, name, product_type, sales_price, cost_price, description, status, id]
    );

    return res.json({ success: true, message: 'Product updated successfully!' });
  } catch (error) {
    next(error);
  }
}

// 5. Delete or Deactivate Product (Safety Rule: Prevent deletion if used in history)
async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;

    // Check historical usage
    const [qLines] = await query('SELECT COUNT(*) AS count FROM quotation_lines WHERE product_id = ?', [id]);
    const [sLines] = await query('SELECT COUNT(*) AS count FROM subscription_lines WHERE product_id = ?', [id]);
    const [iLines] = await query('SELECT COUNT(*) AS count FROM invoice_lines WHERE product_id = ?', [id]);

    const isReferenced = (qLines.count + sLines.count + iLines.count) > 0;

    if (isReferenced) {
      // Safe deactivation instead of deleting financial history
      await query("UPDATE products SET status = 'inactive' WHERE id = ?", [id]);
      await query("UPDATE product_variants SET status = 'inactive' WHERE product_id = ?", [id]);
      return res.json({
        success: true,
        message: 'Product has historical transactions and cannot be deleted. It has been safely deactivated instead.'
      });
    }

    // Safe to delete if never used
    await transaction(async (conn) => {
      await conn.query('DELETE FROM product_variants WHERE product_id = ?', [id]);
      await conn.query('DELETE FROM products WHERE id = ?', [id]);
    });

    return res.json({ success: true, message: 'Product deleted permanently.' });
  } catch (error) {
    next(error);
  }
}

// 6. Manage Variants: Add Variant
async function addVariant(req, res, next) {
  try {
    const { productId } = req.params;
    const { variant_name, sku, additional_price, status } = req.body;

    if (!variant_name) {
      return res.status(400).json({ success: false, message: 'Variant name is required.' });
    }

    const uniqueSku = sku || `SKU-${productId}-${Date.now().toString().slice(-4)}`;

    const [resVariant] = await query(
      `INSERT INTO product_variants (product_id, variant_name, sku, additional_price, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [productId, variant_name, uniqueSku, additional_price || 0, status || 'active']
    );

    return res.status(201).json({
      success: true,
      message: 'Product variant added successfully!',
      variantId: resVariant.insertId
    });
  } catch (error) {
    next(error);
  }
}

// 7. Update Variant
async function updateVariant(req, res, next) {
  try {
    const { variantId } = req.params;
    const { variant_name, sku, additional_price, status } = req.body;

    await query(
      `UPDATE product_variants 
       SET variant_name = COALESCE(?, variant_name),
           sku = COALESCE(?, sku),
           additional_price = COALESCE(?, additional_price),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [variant_name, sku, additional_price, status, variantId]
    );

    return res.json({ success: true, message: 'Variant updated successfully!' });
  } catch (error) {
    next(error);
  }
}

// 8. Delete / Deactivate Variant
async function deleteVariant(req, res, next) {
  try {
    const { variantId } = req.params;

    // Check if referenced
    const [qLines] = await query('SELECT COUNT(*) AS count FROM quotation_lines WHERE variant_id = ?', [variantId]);
    const [sLines] = await query('SELECT COUNT(*) AS count FROM subscription_lines WHERE variant_id = ?', [variantId]);
    const [iLines] = await query('SELECT COUNT(*) AS count FROM invoice_lines WHERE variant_id = ?', [variantId]);

    const isReferenced = (qLines.count + sLines.count + iLines.count) > 0;
    if (isReferenced) {
      await query("UPDATE product_variants SET status = 'inactive' WHERE id = ?", [variantId]);
      return res.json({
        success: true,
        message: 'Variant has historical transaction records. It has been safely deactivated instead.'
      });
    }

    await query('DELETE FROM product_variants WHERE id = ?', [variantId]);
    return res.json({ success: true, message: 'Variant deleted permanently.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addVariant,
  updateVariant,
  deleteVariant
};
