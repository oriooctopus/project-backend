import { PubSub, withFilter } from 'graphql-subscriptions';
import { createBatchResolver } from 'graphql-resolve-batch';
// interfaces
import { Restaurant, Review, Identifier } from './sql';

import { timestampToDate } from './utils';

interface Edges {
  cursor: number;
  node: Restaurant & Identifier;
}

interface RestaurantsParams {
  limit: number;
  after: number;
}

interface RestaurantInput {
  input: Restaurant;
}

interface RestaurantInputWithId {
  input: Restaurant & Identifier;
}

interface ReviewInput {
  input: Review;
}

interface ReviewInputWithId {
  input: Review & Identifier;
}

interface ReviewCommentInput {
  input: ReviewComment;
}

interface ReviewCommentInputWithId {
  input: ReviewComment & Identifier;
}

const RESTAURANT_SUBSCRIPTION = 'restaurant_subscription';
const RESTAURANTS_SUBSCRIPTION = 'restaurants_subscription';
const REVIEW_SUBSCRIPTION = 'review_subscription';
const REVIEW_COMMENT_SUBSCRIPTION = 'review_comment_subscription';

export default (pubsub: PubSub) => ({
  Query: {
    async restaurants(
      obj: any,
      { limit, after }: RestaurantsParams,
      context: any,
    ) {
      const edgesArray: Edges[] = [];
      const restaurants = await context.Restaurant.restaurantsPagination(
        limit,
        after,
      );
      const total = (await context.Restaurant.getTotal()).count;
      const hasNextPage = total > after + limit;

      restaurants.map(
        (restaurant: Restaurant & Identifier, index: number) => {
          edgesArray.push({
            cursor: after + index,
            node: restaurant,
          });
        },
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
          hasNextPage,
        },
      };
    },
    restaurant(obj: any, { id }: Identifier, context: any) {
      return context.Restaurant.restaurant(id);
    },
  },
  Review: {
    reviewComment({ id }: Identifier, _: any, context: any) {
      return context.Restaurant.getReviewCommentFromReview(id);
    },
    userProfile({ userId }: Review, _: any, context: any) {
      return context.User.getUserProfile(userId);
    },
    date(all: Review, _: any, context: any) {
      console.log('all', all);
      return timestampToDate(all.createdAt);
    },
  },
  Restaurant: {
    reviews: createBatchResolver((sources, args, context) => {
      return context.Restaurant.getReviewsForRestaurantIds(
        sources.map(({ id }) => id),
      );
    }),
    averageRating({ id }: Identifier, _: any, context: any) {
      console.log('restaurant id for average rating', id);
      return context.Restaurant.getAverageRating(id);
    },
    totalReviews({ id }: Identifier, _: any, context: any) {
      console.log('restaurant id for total reviews', id);
      return context.Restaurant.getTotalReviews(id);
    },
  },
  Mutation: {
    async addRestaurant(
      obj: any,
      { input }: RestaurantInput,
      context: any,
    ) {
      const [id] = await context.Restaurant.addRestaurant(input);
      const restaurant = await context.Restaurant.restaurant(id);
      // publish for restaurant list
      pubsub.publish(RESTAURANTS_SUBSCRIPTION, {
        restaurantsUpdated: {
          mutation: 'CREATED',
          id,
          node: restaurant,
        },
      });
      return restaurant;
    },
    async deleteRestaurant(
      obj: any,
      { id }: Identifier,
      context: any,
    ) {
      const restaurant = await context.Restaurant.restaurant(id);
      const isDeleted = await context.Restaurant.deleteRestaurant(id);
      if (isDeleted) {
        // publish for restaurant list
        pubsub.publish(RESTAURANTS_SUBSCRIPTION, {
          restaurantsUpdated: {
            mutation: 'DELETED',
            id,
            node: restaurant,
          },
        });
        // publish for edit restaurant page
        pubsub.publish(RESTAURANT_SUBSCRIPTION, {
          restaurantUpdated: {
            mutation: 'DELETED',
            id,
            node: restaurant,
          },
        });
        return { id: restaurant.id };
      } else {
        return { id: null };
      }
    },
    async editRestaurant(
      obj: any,
      { input }: RestaurantInputWithId,
      context: any,
    ) {
      await context.Restaurant.editRestaurant(input);
      const restaurant = await context.Restaurant.restaurant(
        input.id,
      );
      // publish for restaurant list
      pubsub.publish(RESTAURANTS_SUBSCRIPTION, {
        restaurantsUpdated: {
          mutation: 'UPDATED',
          id: restaurant.id,
          node: restaurant,
        },
      });
      // publish for edit restaurant page
      pubsub.publish(RESTAURANT_SUBSCRIPTION, {
        restaurantUpdated: {
          mutation: 'UPDATED',
          id: restaurant.id,
          node: restaurant,
        },
      });
      return restaurant;
    },
    async addReview(obj: any, { input }: ReviewInput, context: any) {
      const [id] = await context.Restaurant.addReview(input);
      const review = await context.Restaurant.getReview(id);
      // publish for edit restaurant page
      pubsub.publish(REVIEW_SUBSCRIPTION, {
        reviewUpdated: {
          mutation: 'CREATED',
          id: review.id,
          restaurantId: input.restaurantId,
          node: review,
        },
      });
      return review;
    },
    async deleteReview(
      obj: any,
      { input: { id, restaurantId } }: ReviewInputWithId,
      context: any,
    ) {
      await context.Restaurant.deleteReview(id);
      // publish for edit restaurant page
      pubsub.publish(REVIEW_SUBSCRIPTION, {
        reviewUpdated: {
          mutation: 'DELETED',
          id,
          restaurantId,
          node: null,
        },
      });
      return { id };
    },
    async editReview(
      obj: any,
      { input }: ReviewInputWithId,
      context: any,
    ) {
      await context.Restaurant.editReview(input);
      const review = await context.Restaurant.getReview(input.id);
      // publish for edit restaurant page
      pubsub.publish(REVIEW_SUBSCRIPTION, {
        reviewUpdated: {
          mutation: 'UPDATED',
          id: input.id,
          restaurantId: input.restaurantId,
          node: review,
        },
      });
      return review;
    },
    async addReviewComment(
      obj: any,
      { input }: ReviewCommentInput,
      context: any,
    ) {
      const [id] = await context.Restaurant.addReviewComment(input);
      const reviewComment = await context.Restaurant.getReviewComment(
        id,
      );
      // publish for edit restaurant page
      pubsub.publish(REVIEW_COMMENT_SUBSCRIPTION, {
        reviewCommentUpdated: {
          mutation: 'CREATED',
          id: reviewComment.id,
          restaurantId: input.restaurantId,
          node: reviewComment,
        },
      });
      return reviewComment;
    },
    async deleteReviewComment(
      obj: any,
      { input: { id, restaurantId } }: ReviewCommentInputWithId,
      context: any,
    ) {
      await context.Restaurant.deleteReviewComment(id);
      // publish for edit restaurant page
      pubsub.publish(REVIEW_COMMENT_SUBSCRIPTION, {
        reviewCommentUpdated: {
          mutation: 'DELETED',
          id,
          restaurantId,
          node: null,
        },
      });
      return { id };
    },
    async editReviewComment(
      obj: any,
      { input }: ReviewCommentInputWithId,
      context: any,
    ) {
      await context.Restaurant.editReviewComment(input);
      const reviewComment = await context.Restaurant.getReviewComment(
        input.id,
      );
      // publish for edit restaurant page
      pubsub.publish(REVIEW_COMMENT_SUBSCRIPTION, {
        reviewCommentUpdated: {
          mutation: 'UPDATED',
          id: input.id,
          restaurantId: input.restaurantId,
          node: reviewComment,
        },
      });
      return reviewComment;
    },
  },
  Subscription: {
    restaurantUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(RESTAURANT_SUBSCRIPTION),
        (payload, variables) => {
          return payload.restaurantUpdated.id === variables.id;
        },
      ),
    },
    restaurantsUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(RESTAURANTS_SUBSCRIPTION),
        (payload, variables) => {
          return variables.endCursor <= payload.restaurantsUpdated.id;
        },
      ),
    },
    reviewUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(REVIEW_SUBSCRIPTION),
        (payload, variables) => {
          return (
            payload.reviewUpdated.restaurantId ===
            variables.restaurantId
          );
        },
      ),
    },
    reviewCommentUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(REVIEW_COMMENT_SUBSCRIPTION),
        (payload, variables) => {
          return (
            payload.reviewCommentUpdated.restaurantId ===
            variables.restaurantId
          );
        },
      ),
    },
  },
});
