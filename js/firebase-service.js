/* ============================================================
   firebase-service.js — Firebase Firestore Service Layer
   Semua operasi database dilakukan melalui service ini
   ============================================================ */

// ========== PRODUCTS SERVICE ==========
const ProductsService = {
  
  // Load all products from Firestore (real-time)
  loadProductsRealtime(callback) {
    return db.collection('products')
      .orderBy('id', 'asc')
      .onSnapshot(
        (snapshot) => {
          const products = [];
          snapshot.forEach((doc) => {
            products.push({
              id: doc.data().id,
              nama_produk: doc.data().nama_produk,
              kategori: doc.data().kategori,
              harga: doc.data().harga,
              foto_produk: doc.data().foto_produk,
              deskripsi: doc.data().deskripsi,
              stok: doc.data().stok,
              emoji: doc.data().emoji || "🎀",
              hot: doc.data().hot || false,
              _id: doc.id  // Document ID untuk reference
            });
          });
          callback(products);
        },
        (error) => {
          console.error("❌ Error loading products:", error);
        }
      );
  },

  // Get single product
  async getProduct(productId) {
    try {
      const doc = await db.collection('products').doc(String(productId)).get();
      if (doc.exists) {
        return { ...doc.data(), _id: doc.id };
      }
      return null;
    } catch (error) {
      console.error("❌ Error getting product:", error);
      return null;
    }
  },

  // Add new product (admin only)
  async addProduct(productData) {
    try {
      const docRef = await db.collection('products').add({
        id: Math.max(...(products?.map(p => p.id) || [0])) + 1,
        nama_produk: productData.nama_produk,
        kategori: productData.kategori,
        harga: Number(productData.harga),
        foto_produk: productData.foto_produk,
        deskripsi: productData.deskripsi,
        stok: Number(productData.stok),
        emoji: productData.emoji || "🎀",
        hot: Boolean(productData.hot),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("❌ Error adding product:", error);
      throw error;
    }
  },

  // Update product (with transaction for consistency)
  async updateProduct(productId, updates) {
    try {
      const docRef = db.collection('products').doc(String(productId));
      
      return await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        if (!doc.exists) throw new Error("Product not found");
        
        transaction.update(docRef, {
          ...updates,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return productId;
      });
    } catch (error) {
      console.error("❌ Error updating product:", error);
      throw error;
    }
  },

  // Delete product (admin only)
  async deleteProduct(productId) {
    try {
      await db.collection('products').doc(String(productId)).delete();
      return productId;
    } catch (error) {
      console.error("❌ Error deleting product:", error);
      throw error;
    }
  },

  // Seed default products (first time setup)
  async seedDefaultProducts() {
    try {
      const snapshot = await db.collection('products').limit(1).get();
      if (!snapshot.empty) {
        console.log("ℹ️ Products already exist - skipping seed");
        return;
      }

      const defaultList = (typeof defaultProducts !== 'undefined' && Array.isArray(defaultProducts))
        ? defaultProducts
        : [];

      if (!defaultList.length) {
        console.warn("⚠️ No default products available");
        return;
      }

      for (const product of defaultList) {
        await db.collection('products').add({
          id: Number(product.id || 0),
          nama_produk: product.name || product.nama_produk,
          kategori: (product.category || product.kategori || 'makeup').toLowerCase(),
          harga: Number(product.price || product.harga || 0),
          foto_produk: product.image || product.foto || `./image/${product.name?.replace(/\s+/g, '_')}.jpg`,
          deskripsi: product.desc || product.deskripsi || "",
          stok: Number(product.stock || 50),
          emoji: product.emoji || "🎀",
          hot: Boolean(product.hot),
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      console.log("✅ Default products seeded successfully");
    } catch (error) {
      console.error("❌ Error seeding products:", error);
    }
  }
};

// ========== CART SERVICE ==========
const CartService = {
  
  // Get current user's cart (real-time)
  loadCartRealtime(uid, callback) {
    if (!uid) {
      callback([]);
      return () => {};  // Unsubscribe function
    }

    return db.collection('carts')
      .doc(uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists && Array.isArray(doc.data().items)) {
            callback(doc.data().items);
          } else {
            callback([]);
          }
        },
        (error) => {
          console.error("❌ Error loading cart:", error);
          callback([]);
        }
      );
  },

  // Add item to cart
  async addToCart(uid, productId, productData, qty = 1) {
    if (!uid) throw new Error("User not authenticated");

    try {
      const cartRef = db.collection('carts').doc(uid);

      return await db.runTransaction(async (transaction) => {
        const cartDoc = await transaction.get(cartRef);
        const currentItems = cartDoc.exists ? (cartDoc.data().items || []) : [];

        // Check if item already in cart
        const existingItem = currentItems.find(item => Number(item.productId) === Number(productId));

        if (existingItem) {
          // Increment quantity
          const updatedItems = currentItems.map(item =>
            Number(item.productId) === Number(productId)
              ? { ...item, qty: Number(item.qty) + qty }
              : item
          );
          transaction.set(cartRef, {
            items: updatedItems,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Add new item
          const newItem = {
            productId: String(productId),
            nama_produk: productData.nama_produk,
            harga: Number(productData.harga),
            qty: Number(qty),
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          transaction.set(cartRef, {
            items: [...currentItems, newItem],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }

        return true;
      });
    } catch (error) {
      console.error("❌ Error adding to cart:", error);
      throw error;
    }
  },

  // Update cart item quantity
  async updateCartQty(uid, productId, newQty) {
    if (!uid) throw new Error("User not authenticated");

    try {
      const cartRef = db.collection('carts').doc(uid);

      return await db.runTransaction(async (transaction) => {
        const cartDoc = await transaction.get(cartRef);
        const currentItems = cartDoc.data().items || [];

        const updatedItems = currentItems
          .map(item =>
            Number(item.productId) === Number(productId)
              ? { ...item, qty: Math.max(0, Number(newQty)) }
              : item
          )
          .filter(item => Number(item.qty) > 0);  // Remove 0 qty items

        transaction.update(cartRef, {
          items: updatedItems,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return updatedItems;
      });
    } catch (error) {
      console.error("❌ Error updating cart qty:", error);
      throw error;
    }
  },

  // Remove item from cart
  async removeFromCart(uid, productId) {
    if (!uid) throw new Error("User not authenticated");

    try {
      const cartRef = db.collection('carts').doc(uid);

      return await db.runTransaction(async (transaction) => {
        const cartDoc = await transaction.get(cartRef);
        const currentItems = cartDoc.data().items || [];

        const updatedItems = currentItems.filter(item =>
          Number(item.productId) !== Number(productId)
        );

        transaction.update(cartRef, {
          items: updatedItems,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return updatedItems;
      });
    } catch (error) {
      console.error("❌ Error removing from cart:", error);
      throw error;
    }
  },

  // Clear entire cart
  async clearCart(uid) {
    if (!uid) throw new Error("User not authenticated");

    try {
      await db.collection('carts').doc(uid).set({
        items: [],
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("❌ Error clearing cart:", error);
      throw error;
    }
  }
};

// ========== ORDERS SERVICE ==========
const OrdersService = {
  
  // Load user's orders (real-time)
  loadUserOrdersRealtime(uid, callback) {
    if (!uid) {
      callback([]);
      return () => {};
    }

    return db.collection('orders')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const orders = [];
          snapshot.forEach((doc) => {
            orders.push({
              _id: doc.id,
              ...doc.data()
            });
          });
          callback(orders);
        },
        (error) => {
          console.error("❌ Error loading orders:", error);
          callback([]);
        }
      );
  },

  // Load all orders (admin only)
  loadAllOrdersRealtime(callback) {
    return db.collection('orders')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const orders = [];
          snapshot.forEach((doc) => {
            orders.push({
              _id: doc.id,
              ...doc.data()
            });
          });
          callback(orders);
        },
        (error) => {
          console.error("❌ Error loading orders:", error);
          callback([]);
        }
      );
  },

  // Create new order WITH STOCK DECREMENT
  async createOrder(uid, orderData) {
    try {
      const orderNum = `ORD-${Date.now()}`;

      // Use transaction to ensure atomic operation: create order + decrement stock
      const result = await db.runTransaction(async (transaction) => {
        // 1. Decrement stock for each product in order
        for (const item of orderData.items) {
          const productRef = db.collection('products').doc(String(item.productId));
          const productDoc = await transaction.get(productRef);
          
          if (productDoc.exists) {
            const currentStok = Number(productDoc.data().stok || 0);
            const newStok = Math.max(0, currentStok - Number(item.qty));
            
            transaction.update(productRef, {
              stok: newStok,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          }
        }

        // 2. Create order
        const orderRef = db.collection('orders').doc();
        transaction.set(orderRef, {
          uid: uid,
          orderNum: orderNum,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerAddress: orderData.customerAddress,
          items: orderData.items,
          subtotal: Number(orderData.subtotal || 0),
          shippingCost: Number(orderData.shippingCost || 0),
          total: Number(orderData.total),
          status: 'pending',
          paymentMethod: orderData.paymentMethod || 'qris',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return {
          _id: orderRef.id,
          orderNum: orderNum
        };
      });

      // 3. Clear user's cart after successful order
      await CartService.clearCart(uid);

      return result;
    } catch (error) {
      console.error("❌ Error creating order:", error);
      throw error;
    }
  },

  // Update order status (admin only)
  async updateOrderStatus(orderId, newStatus) {
    try {
      await db.collection('orders').doc(orderId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("❌ Error updating order status:", error);
      throw error;
    }
  }
};

// ========== REVIEWS SERVICE ==========
const ReviewsService = {
  
  // Load product reviews (real-time)
  loadReviewsRealtime(productId, callback) {
    if (!productId) {
      callback([]);
      return () => {};
    }

    return db.collection('products')
      .doc(String(productId))
      .collection('reviews')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const reviews = [];
          snapshot.forEach((doc) => {
            reviews.push({
              _id: doc.id,
              ...doc.data()
            });
          });
          callback(reviews);
        },
        (error) => {
          console.error("❌ Error loading reviews:", error);
          callback([]);
        }
      );
  },

  // Add review (user must be authenticated)
  async addReview(productId, reviewData) {
    try {
      const docRef = await db.collection('products')
        .doc(String(productId))
        .collection('reviews')
        .add({
          uid: reviewData.uid,
          nama_user: reviewData.nama_user,
          teks_review: reviewData.teks_review,
          rating: Number(reviewData.rating) || 5,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

      return docRef.id;
    } catch (error) {
      console.error("❌ Error adding review:", error);
      throw error;
    }
  }
};

console.log("✅ Firebase Services loaded");
