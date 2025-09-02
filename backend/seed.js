// seed.js
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "./config/database.js";
import dotenv from "dotenv";

dotenv.config();

// Import your existing models (if available) or define schemas
// Replace these imports with your actual model files
// import User from "./models/User.js";
// import Menu from "./models/Menu.js";
// import Table from "./models/Table.js";
// import Order from "./models/Order.js";
// import Billing from "./models/Billing.js";
// import Feedback from "./models/Feedback.js";

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'manager', 'kitchen', 'cashier', 'waiter'], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: String,
  isActive: { type: Boolean, default: true },
  hireDate: { type: Date, default: Date.now },
  salary: Number
}, { timestamps: true });

// Menu Schema
const menuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, enum: ['appetizer', 'main_course', 'dessert', 'beverage', 'special'], required: true },
  image: String,
  isVegetarian: { type: Boolean, default: false },
  isGlutenFree: { type: Boolean, default: false },
  isSpicy: { type: Boolean, default: false },
  ingredients: [String],
  preparationTime: Number,
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

// Table Schema
const tableSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true, unique: true },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ['available', 'occupied', 'reserved', 'maintenance'], default: 'available' },
  location: { type: String, enum: ['indoor', 'outdoor', 'private_room', 'bar_area'], default: 'indoor' },
  qrCode: { type: String, unique: true },
  amenities: [String]
}, { timestamps: true });

// Order Schema
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    specialInstructions: String,
    status: { type: String, enum: ['pending', 'preparing', 'ready', 'served'], default: 'pending' }
  }],
  status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'], default: 'pending' },
  totalAmount: { type: Number, required: true },
  orderType: { type: String, enum: ['dine_in', 'takeaway', 'delivery'], default: 'dine_in' },
  assignedWaiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  estimatedTime: Number,
  actualPrepTime: Number
}, { timestamps: true });

// Billing Schema
const billingSchema = new mongoose.Schema({
  billNumber: { type: String, unique: true, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    name: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tip: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'digital_wallet', 'bank_transfer'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  cashierById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transactionId: String,
  billDate: { type: Date, default: Date.now }
}, { timestamps: true });

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  rating: { type: Number, min: 1, max: 5, required: true },
  foodQuality: { type: Number, min: 1, max: 5 },
  serviceQuality: { type: Number, min: 1, max: 5 },
  ambiance: { type: Number, min: 1, max: 5 },
  valueForMoney: { type: Number, min: 1, max: 5 },
  comments: String,
  wouldRecommend: { type: Boolean, default: true },
  favoriteItems: [String],
  suggestions: String,
  visitDate: { type: Date, default: Date.now }
}, { timestamps: true });

// Models
const User = mongoose.model('User', userSchema);
const Menu = mongoose.model('Menu', menuSchema);
const Table = mongoose.model('Table', tableSchema);
const Order = mongoose.model('Order', orderSchema);
const Billing = mongoose.model('Billing', billingSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);

const seedAllData = async () => {
  try {
    await connectDB();
    console.log("🗑️ Clearing existing data...");
    
    // Clear all collections
    await User.deleteMany({});
    await Menu.deleteMany({});
    await Table.deleteMany({});
    await Order.deleteMany({});
    await Billing.deleteMany({});
    await Feedback.deleteMany({});

    console.log("👥 Seeding Users...");
    // Seed Users
    const users = await User.insertMany([
      {
        username: "superadmin",
        email: "superadmin@blissbay.com",
        password: await bcrypt.hash("super123", 10),
        role: "superadmin",
        firstName: "Root",
        lastName: "Boss",
        phone: "+1-555-0001",
        salary: 120000
      },
      {
        username: "alice_admin",
        email: "admin@blissbay.com",
        password: await bcrypt.hash("admin123", 10),
        role: "admin",
        firstName: "Alice",
        lastName: "Admin",
        phone: "+1-555-0003",
        salary: 85000
      },
      {
        username: "mark_manager",
        email: "manager@blissbay.com",
        password: await bcrypt.hash("manager123", 10),
        role: "manager",
        firstName: "Mark",
        lastName: "Manager",
        phone: "+1-555-0005",
        salary: 65000
      },
      {
        username: "kelly_chef",
        email: "kitchen@blissbay.com",
        password: await bcrypt.hash("kitchen123", 10),
        role: "kitchen",
        firstName: "Kelly",
        lastName: "Chef",
        phone: "+1-555-0007",
        salary: 55000
      },
      {
        username: "carl_cashier",
        email: "cashier@blissbay.com",
        password: await bcrypt.hash("cashier123", 10),
        role: "cashier",
        firstName: "Carl",
        lastName: "Cashier",
        phone: "+1-555-0009",
        salary: 38000
      },
      {
        username: "wendy_waiter",
        email: "waiter@blissbay.com",
        password: await bcrypt.hash("waiter123", 10),
        role: "waiter",
        firstName: "Wendy",
        lastName: "Waitress",
        phone: "+1-555-0011",
        salary: 32000
      },
      {
        username: "john_waiter",
        email: "waiter2@blissbay.com",
        password: await bcrypt.hash("waiter456", 10),
        role: "waiter",
        firstName: "John",
        lastName: "Server",
        phone: "+1-555-0013",
        salary: 32000
      },
      {
        username: "sarah_kitchen",
        email: "kitchen2@blissbay.com",
        password: await bcrypt.hash("kitchen456", 10),
        role: "kitchen",
        firstName: "Sarah",
        lastName: "Cook",
        phone: "+1-555-0015",
        salary: 48000
      }
    ]);

    console.log("🍽️ Seeding Menu Items...");
    // Seed Menu Items
    const menuItems = await Menu.insertMany([
      // Appetizers
      {
        name: "Crispy Calamari Rings",
        description: "Fresh squid rings served with marinara sauce and lemon wedges",
        price: 12.99,
        category: "appetizer",
        image: "/images/calamari.jpg",
        isVegetarian: false,
        isGlutenFree: false,
        isSpicy: false,
        ingredients: ["squid", "flour", "marinara sauce", "lemon", "parsley"],
        preparationTime: 8,
        isAvailable: true
      },
      {
        name: "Spinach & Artichoke Dip",
        description: "Creamy spinach and artichoke dip served with tortilla chips",
        price: 10.99,
        category: "appetizer",
        image: "/images/spinach-dip.jpg",
        isVegetarian: true,
        isGlutenFree: false,
        isSpicy: false,
        ingredients: ["spinach", "artichoke", "cream cheese", "mozzarella", "tortilla chips"],
        preparationTime: 6,
        isAvailable: true
      },
      {
        name: "Buffalo Wings",
        description: "Spicy chicken wings served with blue cheese dip and celery sticks",
        price: 14.99,
        category: "appetizer",
        image: "/images/buffalo-wings.jpg",
        isVegetarian: false,
        isGlutenFree: true,
        isSpicy: true,
        ingredients: ["chicken wings", "buffalo sauce", "blue cheese", "celery"],
        preparationTime: 12,
        isAvailable: true
      },
      {
        name: "Loaded Nachos",
        description: "Tortilla chips topped with melted cheese, jalapeños, and sour cream",
        price: 11.99,
        category: "appetizer",
        image: "/images/nachos.jpg",
        isVegetarian: true,
        isGlutenFree: true,
        isSpicy: true,
        ingredients: ["tortilla chips", "cheddar cheese", "jalapeños", "sour cream", "guacamole"],
        preparationTime: 5,
        isAvailable: true
      },
      
      // Main Courses
      {
        name: "Grilled Salmon Fillet",
        description: "Atlantic salmon grilled to perfection with herbs and lemon butter",
        price: 24.99,
        category: "main_course",
        image: "/images/grilled-salmon.jpg",
        isVegetarian: false,
        isGlutenFree: true,
        isSpicy: false,
        ingredients: ["salmon", "herbs", "lemon", "butter", "asparagus", "rice"],
        preparationTime: 15,
        isAvailable: true
      },
      {
        name: "Ribeye Steak",
        description: "12oz premium ribeye steak with garlic mashed potatoes and vegetables",
        price: 32.99,
        category: "main_course",
        image: "/images/ribeye-steak.jpg",
        isVegetarian: false,
        isGlutenFree: true,
        isSpicy: false,
        ingredients: ["ribeye steak", "garlic", "potatoes", "butter", "seasonal vegetables"],
        preparationTime: 18,
        isAvailable: true
      },
      {
        name: "Vegetarian Pasta Primavera",
        description: "Fresh pasta with seasonal vegetables in a light cream sauce",
        price: 18.99,
        category: "main_course",
        image: "/images/pasta-primavera.jpg",
        isVegetarian: true,
        isGlutenFree: false,
        isSpicy: false,
        ingredients: ["pasta", "zucchini", "bell peppers", "broccoli", "cream", "parmesan"],
        preparationTime: 12,
        isAvailable: true
      },
      {
        name: "Chicken Tikka Masala",
        description: "Tender chicken in a rich, creamy tomato-based curry sauce",
        price: 21.99,
        category: "main_course",
        image: "/images/chicken-tikka.jpg",
        isVegetarian: false,
        isGlutenFree: true,
        isSpicy: true,
        ingredients: ["chicken", "tomatoes", "cream", "spices", "basmati rice", "naan"],
        preparationTime: 16,
        isAvailable: true
      },
      {
        name: "Fish & Chips",
        description: "Beer-battered cod with crispy fries and mushy peas",
        price: 19.99,
        category: "main_course",
        image: "/images/fish-chips.jpg",
        isVegetarian: false,
        isGlutenFree: false,
        isSpicy: false,
        ingredients: ["cod", "beer batter", "potatoes", "peas", "tartar sauce"],
        preparationTime: 14,
        isAvailable: true
      },
      {
        name: "BBQ Pulled Pork Sandwich",
        description: "Slow-cooked pulled pork with BBQ sauce on a brioche bun",
        price: 16.99,
        category: "main_course",
        image: "/images/pulled-pork.jpg",
        isVegetarian: false,
        isGlutenFree: false,
        isSpicy: false,
        ingredients: ["pork shoulder", "BBQ sauce", "brioche bun", "coleslaw"],
        preparationTime: 8,
        isAvailable: true
      },
      
      // Desserts
      {
        name: "Chocolate Lava Cake",
        description: "Warm chocolate cake with molten center, served with vanilla ice cream",
        price: 8.99,
        category: "dessert",
        image: "/images/lava-cake.jpg",
        isVegetarian: true,
        isGlutenFree: false,
        isSpicy: false,
        ingredients: ["dark chocolate", "flour", "eggs", "butter", "vanilla ice cream"],
        preparationTime: 5,
        isAvailable: true
      },
      {
        name: "New York Cheesecake",
        description: "Classic creamy cheesecake with graham cracker crust and berry compote",
        price: 7.99,
        category: "dessert",
        image: "/images/cheesecake.jpg",
        isVegetarian: true,
        isGlutenFree: false,
        isSpicy: false,
        ingredients: ["cream cheese", "graham crackers", "eggs", "sugar", "mixed berries"],
        preparationTime: 3,
        isAvailable: true
      },
      {
        name: "Tiramisu",
        description: "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone",
        price: 9.99,
        category: "dessert",
        image: "/images/tiramisu.jpg",
        isVegetarian: true,
        isGlutenFree: false,
        isSpicy: false,
        ingredients: ["ladyfingers", "espresso", "mascarpone", "cocoa powder"],
        preparationTime: 3,
        isAvailable: true
      },
      {
        name: "Apple Pie à la Mode",
        description: "Homemade apple pie with cinnamon and vanilla ice cream",
        price: 6.99,
        category: "dessert",
        image: "/images/apple-pie.jpg",
        isVegetarian: true,
        isGlutenFree: false,
        isSpicy: false,
        ingredients: ["apples", "cinnamon", "pie crust", "vanilla ice cream"],
        preparationTime: 4,
        isAvailable: true
      },
      
      // Beverages
      {
        name: "Fresh Orange Juice",
        description: "Freshly squeezed orange juice",
        price: 4.99,
        category: "beverage",
        image: "/images/orange-juice.jpg",
        isVegetarian: true,
        isGlutenFree: true,
        isSpicy: false,
        ingredients: ["fresh oranges"],
        preparationTime: 2,
        isAvailable: true
      },
      {
        name: "Craft Beer - IPA",
        description: "Local IPA with citrus notes and hoppy finish",
        price: 6.99,
        category: "beverage",
        image: "/images/craft-beer.jpg",
        isVegetarian: true,
        isGlutenFree: false,
        isSpicy: false,
        ingredients: ["malt", "hops", "yeast", "water"],
        preparationTime: 1,
        isAvailable: true
      },
      {
        name: "House Wine - Cabernet Sauvignon",
        description: "Full-bodied red wine with notes of blackberry and oak",
        price: 8.99,
        category: "beverage",
        image: "/images/red-wine.jpg",
        isVegetarian: true,
        isGlutenFree: true,
        isSpicy: false,
        ingredients: ["cabernet sauvignon grapes"],
        preparationTime: 1,
        isAvailable: true
      },
      {
        name: "Espresso",
        description: "Rich, bold espresso shot",
        price: 2.99,
        category: "beverage",
        image: "/images/espresso.jpg",
        isVegetarian: true,
        isGlutenFree: true,
        isSpicy: false,
        ingredients: ["espresso beans"],
        preparationTime: 2,
        isAvailable: true
      },
      {
        name: "Smoothie Bowl",
        description: "Mixed berry smoothie topped with granola and fresh fruit",
        price: 7.99,
        category: "beverage",
        image: "/images/smoothie.jpg",
        isVegetarian: true,
        isGlutenFree: true,
        isSpicy: false,
        ingredients: ["mixed berries", "banana", "yogurt", "granola"],
        preparationTime: 3,
        isAvailable: true
      },
      
      // Specials
      {
        name: "Chef's Special Lobster",
        description: "Grilled lobster tail with garlic butter and seasonal vegetables",
        price: 45.99,
        category: "special",
        image: "/images/lobster.jpg",
        isVegetarian: false,
        isGlutenFree: true,
        isSpicy: false,
        ingredients: ["lobster tail", "garlic", "butter", "seasonal vegetables"],
        preparationTime: 20,
        isAvailable: true
      }
    ]);

    console.log("🪑 Seeding Tables...");
    // Seed Tables
    const tables = await Table.insertMany([
      {
        tableNumber: 1,
        capacity: 2,
        status: "available",
        location: "indoor",
        qrCode: "QR_TABLE_001",
        amenities: ["window_view", "charging_station"]
      },
      {
        tableNumber: 2,
        capacity: 4,
        status: "occupied",
        location: "indoor",
        qrCode: "QR_TABLE_002",
        amenities: ["wheelchair_accessible"]
      },
      {
        tableNumber: 3,
        capacity: 6,
        status: "available",
        location: "indoor",
        qrCode: "QR_TABLE_003",
        amenities: ["high_chair_available"]
      },
      {
        tableNumber: 4,
        capacity: 2,
        status: "reserved",
        location: "outdoor",
        qrCode: "QR_TABLE_004",
        amenities: ["window_view"]
      },
      {
        tableNumber: 5,
        capacity: 8,
        status: "available",
        location: "private_room",
        qrCode: "QR_TABLE_005",
        amenities: ["wheelchair_accessible", "charging_station"]
      },
      {
        tableNumber: 6,
        capacity: 4,
        status: "occupied",
        location: "outdoor",
        qrCode: "QR_TABLE_006",
        amenities: []
      },
      {
        tableNumber: 7,
        capacity: 3,
        status: "maintenance",
        location: "bar_area",
        qrCode: "QR_TABLE_007",
        amenities: ["charging_station"]
      },
      {
        tableNumber: 8,
        capacity: 2,
        status: "available",
        location: "bar_area",
        qrCode: "QR_TABLE_008",
        amenities: []
      },
      {
        tableNumber: 9,
        capacity: 4,
        status: "available",
        location: "indoor",
        qrCode: "QR_TABLE_009",
        amenities: ["window_view"]
      },
      {
        tableNumber: 10,
        capacity: 6,
        status: "available",
        location: "outdoor",
        qrCode: "QR_TABLE_010",
        amenities: ["wheelchair_accessible"]
      }
    ]);

    console.log("🛍️ Seeding Orders...");
    // Seed Orders
    const orders = await Order.insertMany([
      {
        orderNumber: "ORD-001",
        tableId: tables[1]._id, // Table 2 (occupied)
        items: [
          {
            menuItem: menuItems[4]._id, // Grilled Salmon
            quantity: 1,
            price: 24.99,
            specialInstructions: "Medium rare",
            status: "preparing"
          },
          {
            menuItem: menuItems[0]._id, // Calamari
            quantity: 1,
            price: 12.99,
            status: "served"
          },
          {
            menuItem: menuItems[14]._id, // Fresh Orange Juice
            quantity: 2,
            price: 4.99,
            status: "served"
          }
        ],
        status: "preparing",
        totalAmount: 47.97,
        orderType: "dine_in",
        assignedWaiter: users[5]._id, // Wendy Waitress
        notes: "Customer has seafood allergy - notified kitchen",
        estimatedTime: 25
      },
      {
        orderNumber: "ORD-002",
        tableId: tables[5]._id, // Table 6 (occupied)
        items: [
          {
            menuItem: menuItems[5]._id, // Ribeye Steak
            quantity: 2,
            price: 32.99,
            specialInstructions: "Well done, no salt",
            status: "ready"
          },
          {
            menuItem: menuItems[2]._id, // Buffalo Wings
            quantity: 1,
            price: 14.99,
            status: "served"
          }
        ],
        status: "ready",
        totalAmount: 80.97,
        orderType: "dine_in",
        assignedWaiter: users[6]._id, // John Server
        estimatedTime: 20,
        actualPrepTime: 22
      },
      {
        orderNumber: "ORD-003",
        tableId: tables[0]._id, // Table 1
        items: [
          {
            menuItem: menuItems[6]._id, // Pasta Primavera
            quantity: 1,
            price: 18.99,
            status: "pending"
          },
          {
            menuItem: menuItems[10]._id, // Chocolate Lava Cake
            quantity: 1,
            price: 8.99,
            status: "pending"
          }
        ],
        status: "pending",
        totalAmount: 27.98,
        orderType: "dine_in",
        assignedWaiter: users[5]._id, // Wendy Waitress
        estimatedTime: 15
      }
    ]);

    console.log("💳 Seeding Billing...");
    // Seed Billing
    const billings = await Billing.insertMany([
      {
        billNumber: "BILL-001",
        orderId: orders[1]._id, // Completed order
        tableId: tables[5]._id,
        items: [
          {
            name: "Ribeye Steak",
            quantity: 2,
            unitPrice: 32.99,
            totalPrice: 65.98
          },
          {
            name: "Buffalo Wings",
            quantity: 1,
            unitPrice: 14.99,
            totalPrice: 14.99
          }
        ],
        subtotal: 80.97,
        tax: 7.29, // 9% tax
        discount: 0,
        tip: 12.00,
        totalAmount: 100.26,
        paymentMethod: "card",
        paymentStatus: "paid",
        cashierById: users[4]._id, // Carl Cashier
        transactionId: "TXN-20250829-001",
        billDate: new Date()
      },
      {
        billNumber: "BILL-002",
        orderId: orders[0]._id,
        tableId: tables[1]._id,
        items: [
          {
            name: "Grilled Salmon Fillet",
            quantity: 1,
            unitPrice: 24.99,
            totalPrice: 24.99
          },
          {
            name: "Crispy Calamari Rings",
            quantity: 1,
            unitPrice: 12.99,
            totalPrice: 12.99
          },
          {
            name: "Fresh Orange Juice",
            quantity: 2,
            unitPrice: 4.99,
            totalPrice: 9.98
          }
        ],
        subtotal: 47.97,
        tax: 4.32,
        discount: 5.00, // Discount applied
        tip: 8.00,
        totalAmount: 55.29,
        paymentMethod: "cash",
        paymentStatus: "pending",
        cashierById: users[4]._id, // Carl Cashier
        billDate: new Date()
      }
    ]);

    console.log("⭐ Seeding Feedback...");
    // Seed Feedback
    const feedbacks = await Feedback.insertMany([
      {
        orderId: orders[1]._id,
        tableId: tables[5]._id,
        customerName: "John Smith",
        customerEmail: "john.smith@email.com",
        customerPhone: "+1-555-1234",
        rating: 5,
        foodQuality: 5,
        serviceQuality: 4,
        ambiance: 5,
        valueForMoney: 4,
        comments: "Excellent ribeye steak! Cooked to perfection. Service was friendly and prompt.",
        wouldRecommend: true,
        favoriteItems: ["Ribeye Steak", "Buffalo Wings"],
        suggestions: "Maybe offer more vegetarian options",
        visitDate: new Date()
      },
      {
        orderId: orders[0]._id,
        tableId: tables[1]._id,
        customerName: "Maria Garcia",
        customerEmail: "maria.garcia@email.com",
        customerPhone: "+1-555-5678",
        rating: 4,
        foodQuality: 4,
        serviceQuality: 5,
        ambiance: 4,
        valueForMoney: 4,
        comments: "Great salmon dish and the calamari was crispy. Wendy was an amazing waitress!",
        wouldRecommend: true,
        favoriteItems: ["Grilled Salmon Fillet"],
        suggestions: "Could use more seasoning on the salmon",
        visitDate: new Date()
      },
      {
        tableId: tables[2]._id,
        customerName: "Anonymous Diner",
        rating: 3,
        foodQuality: 3,
        serviceQuality: 3,
        ambiance: 4,
        valueForMoney: 3,
        comments: "Food was okay, service was average. Nice atmosphere though.",
        wouldRecommend: false,
        suggestions: "Faster service needed during peak hours",
        visitDate: new Date(Date.now() - 86400000) // Yesterday
      },
      {
        tableId: tables[0]._id,
        customerName: "David Wilson",
        customerEmail: "david.wilson@email.com",
        rating: 5,
        foodQuality: 5,
        serviceQuality: 5,
        ambiance: 5,
        valueForMoney: 5,
        comments: "Perfect dining experience! Will definitely come back. The chocolate lava cake was divine!",
        wouldRecommend: true,
        favoriteItems: ["Chocolate Lava Cake", "Pasta Primavera"],
        visitDate: new Date(Date.now() - 172800000) // 2 days ago
      },
      {
        tableId: tables[4]._id,
        customerName: "Lisa Brown",
        customerEmail: "lisa.brown@email.com",
        customerPhone: "+1-555-9999",
        rating: 2,
        foodQuality: 2,
        serviceQuality: 2,
        ambiance: 3,
        valueForMoney: 2,
        comments: "Food arrived cold and service was slow. Not impressed with the experience.",
        wouldRecommend: false,
        suggestions: "Improve food temperature and service speed",
        visitDate: new Date(Date.now() - 259200000) // 3 days ago
      }
    ]);

    console.log("\n✅ DATABASE SEEDED SUCCESSFULLY!");
    console.log("==========================================");
    console.log(`👥 Users created: ${users.length}`);
    console.log(`🍽️ Menu items created: ${menuItems.length}`);
    console.log(`🪑 Tables created: ${tables.length}`);
    console.log(`🛍️ Orders created: ${orders.length}`);
    console.log(`💳 Bills created: ${billings.length}`);
    console.log(`⭐ Feedback entries created: ${feedbacks.length}`);
    console.log("==========================================");
    
    // Verify data insertion
    const userCount = await User.countDocuments();
    const menuCount = await Menu.countDocuments();
    const tableCount = await Table.countDocuments();
    const orderCount = await Order.countDocuments();
    const billingCount = await Billing.countDocuments();
    const feedbackCount = await Feedback.countDocuments();
    
    console.log("\n📊 VERIFICATION:");
    console.log(`Users in database: ${userCount}`);
    console.log(`Menu items in database: ${menuCount}`);
    console.log(`Tables in database: ${tableCount}`);
    console.log(`Orders in database: ${orderCount}`);
    console.log(`Bills in database: ${billingCount}`);
    console.log(`Feedback entries in database: ${feedbackCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seedAllData();
