// src/models/RestaurantCategory.js
class RestaurantCategory {
  constructor(data) {
    this.id = data.id || null
    this.created_at = data.created_at || new Date().toISOString();
    this.restaurant_id = data.restaurant_id || null;
    this.category_name = data.category_name || null;
  }

  // Optional: Add validation methods
  isValid() {
    return this.restaurant_id && this.category_name;
  }

  // Optional: Add transformation methods
  toJSON() {
    return {
      id: this.id,
      created_at: this.created_at,
      restaurant_id: this.restaurant_id,
      category_name: this.category_name
    };
  }
}

// Ensure the class is exported
module.exports = RestaurantCategory;