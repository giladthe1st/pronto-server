// src/models/Deal.js
class Deal {
  constructor(data) {
    this.id = data.id || null
    this.created_at = data.created_at || new Date().toISOString();
    this.details = data.details || null;
    this.restaurant_id = data.restaurant_id || null;
    this.summarized_deal = data.summarized_deal || null;
    this.price = data.price || null;
    this.restaurant_name = data.restaurant_name || null;
  }

  // Optional: Add validation methods
  isValid() {
    return this.details && this.restaurant_id && this.summarized_deal && this.price && this.restaurant_name;
  }

  // Optional: Add transformation methods
  toJSON() {
    return {
      id: this.id,
      created_at: this.created_at,
      details: this.details,
      restaurant_id: this.restaurant_id,
      summarized_deal: this.summarized_deal,
      price: this.price,
      restaurant_name: this.restaurant_name
    };
  }
}

// Ensure the class is exported
module.exports = Deal;