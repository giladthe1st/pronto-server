// src/models/Restaurant.js
class Restaurant {
  constructor(data) {
    this.id = data.id || null
    this.created_at = data.created_at || new Date().toISOString();
    this.name = data.name || null;
    this.logo_url = data.logo_url || null;
    this.website_url = data.website_url || null;
    this.reviews_count = data.reviews_count || 0;
    this.average_rating = data.average_rating || 0.0;
    this.address = data.address || null;
    this.maps_url = data.maps_url || null;
  }

  // Optional: Add validation methods
  isValid() {
    return this.name && this.address;
  }

  // Optional: Add transformation methods
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      logo_url: this.logo_url,
      website_url: this.website_url,
      reviews_count: this.reviews_count,
      average_rating: this.average_rating,
      address: this.address,
      maps_url: this.maps_url
    };
  }
}

// Ensure the class is exported
module.exports = Restaurant;