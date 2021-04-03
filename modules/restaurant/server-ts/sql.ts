import { camelizeKeys, decamelizeKeys } from 'humps';

import {
  knex,
  returnId,
  orderedFor,
} from '@gqlapp/database-server-ts';

const restaurantFields = [
  'id',
  'title',
  'description',
  'location',
  'image_url as imageUrl',
];
const reviewFields = [
  'id',
  'content',
  'rating',
  'restaurant_id AS restaurantId',
  'user_id AS userId',
  'created_at AS createdAt',
];

export interface Restaurant {
  title: string;
  description: string;
  imageUrl: string;
  location: string;
}

export interface Review {
  createdAt: number;
  content: string;
  restaurantId: number;
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
  public restaurantsPagination(limit: number, after: number) {
    return knex
      .select(...restaurantFields)
      .from('restaurant')
      .orderBy('id', 'desc')
      .limit(limit)
      .offset(after);
  }

  public async getReviewsForRestaurantIds(restaurantIds: number[]) {
    const res = await knex
      .select(
        reviewFields
      )
      .from('review')
      .whereIn('restaurant_id', restaurantIds);

    console.log('result', res);
    return orderedFor(res, restaurantIds, 'restaurantId', false);
  }

  public getTotal() {
    return knex('restaurant')
      .countDistinct('id as count')
      .first();
  }

  public restaurant(id: number) {
    return knex
      .select(...restaurantFields)
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

  public editRestaurant({
    id,
    title,
    description,
  }: Restaurant & Identifier) {
    return knex('restaurant')
      .where('id', '=', id)
      .update({ title, description });
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
      .select(reviewFields)
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
        rating,
      });
  }

  public getReviewCommentFromReview(reviewId: number) {
    return knex('review_comment')
      .where('review_id', '=', reviewId)
      .first();
  }
}
