import { PubSub, withFilter } from 'graphql-subscriptions';
import { createBatchResolver } from 'graphql-resolve-batch';
// interfaces
import { Restaurant, Review, ReviewComment, Identifier } from './sql';

import RestaurantService from './service';
import { isAdmin } from './utils';

import { timestampToDate } from './utils';

import withAuth from 'graphql-auth';
import service from './service';

interface RestaurantsEdges {
  cursor: number;
  node: Restaurant & Identifier;
}

interface RestaurantsParams {
  after: number;
  limit: number;
  onlyUnreplied: boolean;
  ratingsMinimum: number;
}

interface UnansweredReviewsParams {
  after: number;
  limit: number;
}

interface UnansweredReviewsEdges {
  cursor: number;
  node: Review & Identifier;
}

interface RestaurantInput {
  input: Restaurant;
}

interface RestaurantInputWithId {
  input: Omit<Restaurant, 'userId'> & Identifier;
}

interface ReviewInput {
  fail: number;
  input: Review;
}

interface EditReviewInput {
  input: Omit<Review, 'userId'> & Identifier;
}

interface ReviewCommentInput {
  input: ReviewComment;
}

interface EditReviewCommentInput {
  input: ReviewComment & Identifier;
}

const RESTAURANT_SUBSCRIPTION = 'restaurant_subscription';
const RESTAURANTS_SUBSCRIPTION = 'restaurants_subscription';
const REVIEW_SUBSCRIPTION = 'review_subscription';
const REVIEW_COMMENT_SUBSCRIPTION = 'review_comment_subscription';

export default (pubsub: PubSub) => ({
  Query: {
    getUnansweredReviewsForOwner: withAuth(
      ['basic'],
      async (
        obj: any,
        { after = 0, limit = 10 }: UnansweredReviewsParams,
        context: any
      ) => {
        const edgesArray: UnansweredReviewsEdges[] = [];
        const allMatchingReviews = await context.Restaurant.getUnansweredReviewsForOwner(
          context.req.identity.id
        );
        const reviewsToReturn = allMatchingReviews.slice(
          after,
          after + limit
        );
        const total = allMatchingReviews.length;
        const hasNextPage = total > after + limit;

        reviewsToReturn.map(
          (review: Review & Identifier, index: number) => {
            edgesArray.push({
              cursor: after + index,
              node: review
            });
          }
        );
        const endCursor =
          edgesArray.length > 0
            ? edgesArray[edgesArray.length - 1].cursor
            : 0;

        return {
          totalCount: total,
          edges: edgesArray,
          pageInfo: {
            endCursor,
            hasNextPage
          }
        };
      }
    ),
    restaurants: withAuth(
      ['restaurant:view:all', 'restaurant:view:self'],
      async (
        obj: any,
        { after = 0, limit = 10, ratingsMinimum }: RestaurantsParams,
        { Restaurant, req: { identity } }
      ) => {
        let userFilter =
          identity.role === 'owner' ? identity.id : null;
        // console.log('params', after, limit, ratingsMinimum, ownedByUser, userFilter);

        const edgesArray: RestaurantsEdges[] = [];
        const allMatchingRestaurants = await Restaurant.getRestaurants(
          ratingsMinimum,
          userFilter
        );
        const restaurantsToReturn = allMatchingRestaurants.slice(
          after,
          after + limit
        );
        const total = allMatchingRestaurants.length;
        const hasNextPage = total > after + limit;

        restaurantsToReturn.map(
          (restaurant: Restaurant & Identifier, index: number) => {
            edgesArray.push({
              cursor: after + index,
              node: restaurant
            });
          }
        );
        const endCursor =
          edgesArray.length > 0
            ? edgesArray[edgesArray.length - 1].cursor
            : 0;

        return {
          totalCount: total,
          edges: edgesArray,
          pageInfo: {
            endCursor,
            hasNextPage
          }
        };
      }
    ),
    restaurant(obj: any, { id }: Identifier, context: any) {
      return context.Restaurant.restaurant(id);
    },
    review(obj: any, { id }: Identifier, context: any) {
      return context.Restaurant.getReview(id);
    },
    reviewComment(obj: any, { id }: Identifier, context: any) {
      return context.Restaurant.getReviewComment(id);
    }
  },
  Review: {
    async canAddComment({ id }: Identifier, _: any, context: any) {
      if (context.req.identity.role !== 'owner') {
        return false;
      }

      const existingComment = await context.Restaurant.getReviewCommentFromReview(
        id
      );
      return !existingComment;
    },
    async canModify({ userId }: Review, _: any, context: any) {
      return isAdmin(context) || userId === context.req.identity.id;
    },
    reviewComment({ id }: Identifier, _: any, context: any) {
      return context.Restaurant.getReviewCommentFromReview(id);
    },
    userProfile({ userId }: Review, _: any, context: any) {
      return context.User.getUserProfileByUser(userId);
    },
    date({ createdAt }: Review) {
      return timestampToDate(createdAt);
    },
    restaurant({ restaurantId }: Review, _: any, context: any) {
      return context.Restaurant.restaurant(restaurantId);
    }
  },
  ReviewComment: {
    async restaurantId(
      { reviewId }: ReviewComment,
      _: any,
      context: any
    ) {
      const review = await context.Restaurant.getReview(reviewId);
      return review && review.restaurantId;
    },
    review({ reviewId }: ReviewComment, _: any, context: any) {
      console.log('the review id', reviewId);
      return context.Restaurant.getReview(reviewId);
    },
    async canModify({ id }: Identifier, _: any, context: any) {
      if (isAdmin(context)) {
        return true;
      }

      const {
        userId: restaurantUserId
      } = await context.Restaurant.getRestaurantFromReviewComment(id);
      return restaurantUserId === context.req.identity.id;
    }
  },
  Restaurant: {
    async canAddReview(
      { id: restaurantId }: Identifier,
      _: any,
      context: any
    ) {
      if (context.req.identity.role === 'owner') {
        return false;
      }

      return service.customerCanAddReview(
        context.req.identity.id,
        restaurantId
      );
    },
    async canModify({ userId }: Review, _: any, context: any) {
      return isAdmin(context) || userId === context.req.identity.id;
    },
    highestReview({ id }: Identifier, args: any, context: any) {
      return context.Restaurant.getHighestReviewForRestaurant(id);
    },
    lowestReview({ id }: Identifier, args: any, context: any) {
      return context.Restaurant.getLowestReviewForRestaurant(id);
    },
    reviews: createBatchResolver((sources, args, context) => {
      return context.Restaurant.getReviewsForRestaurantIds(
        sources.map(({ id }) => id)
      );
    }),
    averageRating({ id }: Identifier, _: any, context: any) {
      return context.Restaurant.getAverageRating(id);
    },
    totalReviews({ id }: Identifier, _: any, context: any) {
      return context.Restaurant.getTotalReviews(id);
    }
  },
  Mutation: {
    addRestaurant: withAuth(
      ['restaurant:create:self'],
      async (obj: any, { input }: RestaurantInput, context: any) => {
        const newRestaurant = {
          ...input,
          userId: context.req.identity.id
        };
        const [id] = await context.Restaurant.addRestaurant(
          newRestaurant
        );
        const restaurant = await context.Restaurant.restaurant(id);
        return restaurant;
      }
    ),
    async deleteRestaurant(
      obj: any,
      { id }: Identifier,
      context: any
    ) {
      if (!isAdmin(context)) {
        const restaurant = await context.Restaurant.restaurant(id);

        if (restaurant.userId !== context.req.identity.id) {
          throw new Error(
            'insufficient permissions to delete this restaurant'
          );
        }
      }

      const isDeleted = await context.Restaurant.deleteRestaurant(id);
      if (!isDeleted) {
        throw new Error('Restaurant was not deleted');
      } else {
        return { id };
      }
    },
    async editRestaurant(
      obj: any,
      { input }: RestaurantInputWithId,
      context: any
    ) {
      if (!isAdmin(context)) {
        const restaurant = await context.Restaurant.restaurant(
          input.id
        );

        if (restaurant.userId !== context.req.identity.id) {
          throw new Error(
            'insufficient permissions to edit this restaurant'
          );
        }
      }

      await context.Restaurant.editRestaurant(input);
      const editedRestaurant = await context.Restaurant.restaurant(
        input.id
      );

      return editedRestaurant;
    },
    addReview: withAuth(
      ['review:create:self'],
      async (obj: any, { input }: ReviewInput, context: any) => {
        const userId = context.req.identity.id;
        const canAddReview = await RestaurantService.customerCanAddReview(
          input.restaurantId,
          userId
        );

        if (!canAddReview) {
          throw new Error(
            'User has already added a review to this restaurant'
          );
        }

        const [id] = await context.Restaurant.addReview({
          ...input,
          userId
        });
        const review = await context.Restaurant.getReview(id);
        return review;
      }
    ),
    async deleteReview(obj: any, { id }: Identitifer, context: any) {
      const review = await context.Restaurant.getReview(id);
      if (
        !isAdmin(context) &&
        review.userId !== context.req.identity.id
      ) {
        throw new Error(
          'User does not have authorization to delete this review'
        );
      }

      const result = await context.Restaurant.deleteReview(id);
      if (result === 0) {
        throw new Error('review is already deleted');
      }
      return { id };
    },
    async editReview(
      obj: any,
      { input }: EditReviewInput,
      context: any
    ) {
      const review = await context.Restaurant.getReview(input.id);
      if (
        !isAdmin(context) &&
        review.userId !== context.req.identity.id
      ) {
        throw new Error(
          'User does not have authorization to edit this review'
        );
      }

      await context.Restaurant.editReview(input);
      const editedReview = await context.Restaurant.getReview(
        input.id
      );
      return editedReview;
    },
    async addReviewComment(
      obj: any,
      { input }: ReviewCommentInput,
      context: any
    ) {
      const { reviewId } = input;
      // ideally speed this up if you have time
      const review = await context.Restaurant.getReview(reviewId);
      const restaurant = await context.Restaurant.restaurant(
        review.restaurantId
      );

      if (restaurant.userId !== context.req.identity.id) {
        throw new Error(
          'Only the creator of the restauarant can add comments to reviews on that restaurant'
        );
      }

      const [id] = await context.Restaurant.addReviewComment(input);
      const reviewComment = await context.Restaurant.getReviewComment(
        id
      );
      return reviewComment;
    },
    async deleteReviewComment(
      obj: any,
      { id }: Identifier,
      context: any
    ) {
      if (!isAdmin(context)) {
        const {
          userId: restaurantUserId
        } = await context.Restaurant.getRestaurantFromReviewComment(
          id
        );

        if (restaurantUserId !== context.req.identity.id) {
          throw new Error(
            'Only the creator of the restauarant can edit comments to reviews on this restaurant'
          );
        }
      }

      const isDeleted = await context.Restaurant.deleteReviewComment(
        id
      );

      if (!isDeleted) {
        throw new Error('review comment is already deleted');
      }

      return { id };
    },
    async editReviewComment(
      obj: any,
      { input }: EditReviewCommentInput,
      context: any
    ) {
      if (!isAdmin(context)) {
        const {
          userId: restaurantUserId
        } = await context.Restaurant.getRestaurantFromReviewComment(
          input.id
        );

        if (restaurantUserId !== context.req.identity.id) {
          throw new Error(
            'Only the creator of the restauarant can edit comments to reviews on this restaurant'
          );
        }
      }

      await context.Restaurant.editReviewComment(input);
      const reviewComment = await context.Restaurant.getReviewComment(
        input.id
      );
      return reviewComment;
    }
  },
  Subscription: {
    restaurantUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(RESTAURANT_SUBSCRIPTION),
        (payload, variables) => {
          return payload.restaurantUpdated.id === variables.id;
        }
      )
    },
    restaurantsUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(RESTAURANTS_SUBSCRIPTION),
        (payload, variables) => {
          return variables.endCursor <= payload.restaurantsUpdated.id;
        }
      )
    },
    reviewUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(REVIEW_SUBSCRIPTION),
        (payload, variables) => {
          return (
            payload.reviewUpdated.restaurantId ===
            variables.restaurantId
          );
        }
      )
    },
    reviewCommentUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(REVIEW_COMMENT_SUBSCRIPTION),
        (payload, variables) => {
          return (
            payload.reviewCommentUpdated.restaurantId ===
            variables.restaurantId
          );
        }
      )
    }
  }
});
