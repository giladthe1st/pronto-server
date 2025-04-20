// src/models/Restaurant.js
class Restaurant {
  constructor(data) {
    this.id = data.id || null
    this.created_at = data.created_at || new Date().toISOString();
    this.name = data.name || null;
    this.logo_url = data.logo_url || null;
    this.website_url = data.website_url || null;
    this.reviews_count = data.reviews_count|| 0;
    this.average_rating = Math.round(data.average_rating) / 2 || 0.0;
    this.address = data.address || null;
    this.maps_url = data.maps_url || null;
    this.latitude = data.latitude || null;
    this.longitude = data.longitude || null;
  }

  isValid() {
    return this.name && this.address;
  }

  toJSON() {
    const obj = {
      name: this.name,
      logo_url: this.logo_url,
      website_url: this.website_url,
      reviews_count: this.reviews_count,
      average_rating: this.average_rating,
      address: this.address,
      maps_url: this.maps_url,
      latitude: this.latitude,
      longitude: this.longitude
    };
    if (this.id !== null && this.id !== undefined) {
      obj.id = this.id;
    }
    return obj;
  }
}

module.exports = Restaurant;