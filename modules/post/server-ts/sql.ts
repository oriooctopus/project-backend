import { decamelizeKeys } from 'humps';

import { knex, returnId, orderedFor } from '@gqlapp/database-server-ts';

export interface Restaurant {
  title: string;
  content: string;
}

export interface Review {
  restaurantId: number;
  content: string;
  userId: number;
  rating: number;
}

export interface ReviewComment {
  reviewId: number;
  comment: string;
}

export interface Identifier {
  id: number;
}

export default class RestaurantDAO {


  public refreshRestaurantRatingsData() {

  }

  public restaurantsPagination(limit: number, after: number) {
    return knex
      .select('id', 'title', 'content')
      .from('restaurant')
      .orderBy('id', 'desc')
      .limit(limit)
      .offset(after);
  }

  public async getReviewsForRestaurantIds(restaurantIds: number[]) {
    const res = await knex
      .select('id', 'content', 'rating', 'restaurant_id AS restaurantId', 'user_id AS userId')
      .from('review')
      .whereIn('restaurant_id', restaurantIds);

    return orderedFor(res, restaurantIds, 'restaurantId', false);
  }

  public getTotal() {
    return knex('restaurant')
      .countDistinct('id as count')
      .first();
  }

  public restaurant(id: number) {
    return knex
      .select('id', 'title', 'content')
      .from('restaurant')
      .where('id', '=', id)
      .first();
  }

  public addRestaurant(params: Restaurant) {
    return returnId(knex('restaurant')).insert(params);
  }

  public async getTotalReviews(restaurantId: number) {
    return (await knex('review')
      .count('id as count')
      .where(decamelizeKeys({ restaurantId }))
      .first()).count;
  }

  public async getAverageRating(restaurantId: number) {
    return (await knex('review')
      .avg('rating as averageRating')
      .where(decamelizeKeys({ restaurantId }))
      .first()).averageRating;
  }

  public deleteRestaurant(id: number) {
    return knex('restaurant')
      .where('id', '=', id)
      .del();
  }

  public editRestaurant({ id, title, content }: Restaurant & Identifier) {
    return knex('restaurant')
      .where('id', '=', id)
      .update({ title, content });
  }

  public addReview({ content, restaurantId, rating }: Review) {
    return returnId(knex('review')).insert({
      content,
      restaurant_id: restaurantId,
      rating,
    });
  }

  public getReview(id: number) {
    return knex
      .select('id', 'content', 'rating')
      .from('review')
      .where('id', '=', id)
      .first();
  }

  public deleteReview(id: number) {
    return knex('review')
      .where('id', '=', id)
      .del();
  }

  public editReview({ id, content, rating }: Review & Identifier) {
    return knex('review')
      .where('id', '=', id)
      .update({
        content,
        rating
      });
  }

  public getReviewCommentFromReview(reviewId: number) {
    return knex('review_comment')
      .where('review_id', '=', reviewId)
      .first();
  }
}
