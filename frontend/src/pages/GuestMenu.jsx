import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useRestaurant } from "../contexts/RestaurantContext";
import { useCart } from "../contexts/CartContext";
import axios from "../api/axios";

export default function GuestMenu() {
  const [menu, setMenu] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableNumber = searchParams.get("table") || "unknown";

  const { currentTable, setCurrentTable } = useRestaurant();
  const { cart, addToCart, getCartItemCount, getCartTotal } = useCart();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/menu");
        setMenu(res.data);
        setFilteredItems(res.data);
        
        // Set current table if not already set
        if (!currentTable && tableNumber !== "unknown") {
          setCurrentTable({
            id: tableNumber,
            name: `Table ${tableNumber}`,
            type: 'Indoor',
            seats: 4
          });
        }
      } catch (err) {
        console.error("Menu fetch failed:", err);
        // Fallback demo data if API fails
        const demoMenu = [
          {
            _id: '1',
            name: "Caesar Salad",
            description: "Fresh romaine lettuce, parmesan cheese, croutons with classic caesar dressing",
            price: 450,
            category: "Starters",
            emoji: "🥗",
            isVeg: true,
            availability: true
          },
          {
            _id: '2',
            name: "Margherita Pizza",
            description: "Classic Italian pizza with fresh mozzarella, tomatoes, and basil",
            price: 650,
            category: "Mains",
            emoji: "🍕",
            isVeg: true,
            availability: true
          },
          {
            _id: '3',
            name: "Grilled Chicken",
            description: "Tender grilled chicken breast with herbs and spices",
            price: 750,
            category: "Mains",
            emoji: "🍗",
            isVeg: false,
            availability: true
          }
        ];
        setMenu(demoMenu);
        setFilteredItems(demoMenu);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [tableNumber, currentTable, setCurrentTable]);

  useEffect(() => {
    // Filter items based on category and search
    let filtered = menu;

    if (activeCategory !== "all") {
      filtered = filtered.filter(item => item.category === activeCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Only show available items
    filtered = filtered.filter(item => item.availability !== false);

    setFilteredItems(filtered);
  }, [menu, activeCategory, searchQuery]);

  const categories = [
    { id: "all", name: "All Items", emoji: "" },
    { id: "Starters", name: "Starters", emoji: "🥗" },
    { id: "Mains", name: "Mains", emoji: "🍝" },
    { id: "Sides", name: "Sides", emoji: "🍞" },
    { id: "Beverages", name: "Drinks", emoji: "🥤" },
    { id: "Desserts", name: "Desserts", emoji: "🍰" }
  ];

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleAddToCart = (item, quantity = 1, specialInstructions = "") => {
    const cartItem = {
      ...item,
      quantity,
      specialInstructions,
      cartId: `${item._id}-${Date.now()}`,
      tableNumber
    };
    
    addToCart(cartItem);
    
    // Show success feedback
    const event = new CustomEvent('showToast', {
      detail: { 
        message: `${item.name} added to cart!`, 
        type: 'success' 
      }
    });
    window.dispatchEvent(event);
  };

  const handleCallWaiter = () => {
    // Show success notification
    const event = new CustomEvent('showToast', {
      detail: { 
        message: `🔔 Waiter has been notified for Table ${tableNumber}!`, 
        type: 'info' 
      }
    });
    window.dispatchEvent(event);
  };

  const currentTableInfo = currentTable || { 
    id: tableNumber, 
    name: `Table ${tableNumber}`, 
    type: 'Indoor', 
    seats: 4 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delicious menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/")}
                className="btn-outline btn-sm"
              >
                ← Back
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  🍽️ {currentTableInfo.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {currentTableInfo.type} • {currentTableInfo.seats} seats
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate(`/bill?table=${tableNumber}`)}
                className="btn-outline btn-sm hidden sm:flex"
              >
                📄 Running Bill
              </button>
              <button
                onClick={handleCallWaiter}
                className="btn-outline btn-sm"
              >
                🔔 Call Waiter
              </button>
              <button
                onClick={() => navigate("/cart", { state: { cart, tableNumber } })}
                className="btn-primary btn-sm relative"
              >
                🛒 Cart ({getCartItemCount()})
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getCartItemCount()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeCategory === category.id
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-teal-300 hover:bg-teal-50'
                }`}
              >
                {category.emoji} {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-48 bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center text-6xl">
                {item.emoji || "🍽️"}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <div className="flex items-center space-x-1">
                    {item.isVeg && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        🌱 Veg
                      </span>
                    )}
                    <span className="text-lg font-bold text-teal-600">₹{item.price}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                <button
                  onClick={() => handleAddToCart(item)}
                  className="w-full btn-primary btn-sm"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredItems.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
            <p className="text-gray-500">
              Try searching with different keywords or browse other categories
            </p>
          </div>
        )}
      </div>

      {/* Cart Float */}
      {getCartItemCount() > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 md:left-auto md:right-4 md:max-w-sm">
          <div className="bg-teal-600 text-white rounded-xl p-4 shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold">₹{getCartTotal()}</span>
                <span className="mx-2">•</span>
                <span>{getCartItemCount()} items</span>
              </div>
              <button
                onClick={() => navigate("/cart", { state: { cart, tableNumber } })}
                className="bg-white text-teal-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                View Cart →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
