const express = require('express');
const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview
} = require('../controllers/review.controller.js');
const { protect } = require('../middlewares/auth.middleware.js');

const router = express.Router();

router.route('/').get(getReviews);
router.route('/:id').get(getReview).put(protect, updateReview).delete(protect, deleteReview);

module.exports = router;