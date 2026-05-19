jest.mock("../../../models/productModel", () => ({
  findByIdAndUpdate: jest.fn(),
}));

const Review = require("../../../models/reviewModel");
const Product = require("../../../models/productModel");

const buildAggregateStats = (reviews, productId) => {
  const matchedReviews = reviews.filter((review) => review.product === productId);

  if (matchedReviews.length === 0) return [];

  const ratingCount = (rating) =>
    matchedReviews.filter((review) => review.rating === rating).length;

  return [
    {
      _id: productId,
      nRating: matchedReviews.length,
      avgRating:
        matchedReviews.reduce((sum, review) => sum + review.rating, 0) /
        matchedReviews.length,
      oneRating: ratingCount(1),
      twoRating: ratingCount(2),
      threeRating: ratingCount(3),
      fourRating: ratingCount(4),
      fiveRating: ratingCount(5),
    },
  ];
};

describe("Review.calcAverageRatings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates ratingsAverage, ratingsQuantity, and eachRating for multiple reviews from 1 to 5 stars", async () => {
    const productId = "product-1";
    const mockReviews = [
      { product: productId, rating: 1 },
      { product: productId, rating: 2 },
      { product: productId, rating: 3 },
      { product: productId, rating: 4 },
      { product: productId, rating: 5 },
      { product: productId, rating: 5 },
    ];

    jest
      .spyOn(Review, "aggregate")
      .mockResolvedValue(buildAggregateStats(mockReviews, productId));

    await Review.calcAverageRatings(productId);

    expect(Review.aggregate).toHaveBeenCalledWith([
      { $match: { product: productId } },
      {
        $group: {
          _id: "$product",
          nRating: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          fiveRating: {
            $sum: {
              $cond: [{ $eq: ["$rating", 5] }, 1, 0],
            },
          },
          fourRating: {
            $sum: {
              $cond: [{ $eq: ["$rating", 4] }, 1, 0],
            },
          },
          threeRating: {
            $sum: {
              $cond: [{ $eq: ["$rating", 3] }, 1, 0],
            },
          },
          twoRating: {
            $sum: {
              $cond: [{ $eq: ["$rating", 2] }, 1, 0],
            },
          },
          oneRating: {
            $sum: {
              $cond: [{ $eq: ["$rating", 1] }, 1, 0],
            },
          },
        },
      },
    ]);
    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(productId, {
      ratingsQuantity: 6,
      ratingsAverage: 20 / 6,
      eachRating: {
        "1_star": 1,
        "2_star": 1,
        "3_star": 1,
        "4_star": 1,
        "5_star": 2,
      },
    });
  });

  it("updates the product with default rating values when there are no reviews", async () => {
    const productId = "product-without-reviews";

    jest.spyOn(Review, "aggregate").mockResolvedValue([]);

    await Review.calcAverageRatings(productId);

    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(productId, {
      ratingsQuantity: 0,
      ratingsAverage: 0,
      eachRating: {
        "1_star": 0,
        "2_star": 0,
        "3_star": 0,
        "4_star": 0,
        "5_star": 0,
      },
      review: [],
    });
  });
});
