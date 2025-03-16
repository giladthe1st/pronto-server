const DealService = require('../services/dealService');

const dealController = {
  getAllDeals: async (req, res) => {
    try {
      const deals = await DealService.getAllDeals();
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = dealController;