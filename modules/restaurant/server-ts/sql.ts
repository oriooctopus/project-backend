import { camelizeKeys, decamelizeKeys } from 'humps';

import {
  knex,
  returnId,
  orderedFor
} from '@gqlapp/database-server-ts';

const getRestaurantFields = (precursor = '') => [
  `${precursor && `${precursor}.`}id`,
  `${precursor && `${precursor}.`}title`,
  `${precursor && `${precursor}.`}description`,
  `${precursor && `${precursor}.`}location`,
  `${precursor && `${precursor}.`}image_url as imageUrl`
];

const reviewFields = [
  'id',
  'content',
  'rating',
  'restaurant_id AS restaurantId',
  'user_id AS userId',
  'created_at AS createdAt'
];

export interface Restaurant {
  description: string;
  imageUrl: string;
  location: string;
  title: string;
  userId: number;
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
  public getRestaurants(
    limit: number,
    after: number,
    ratingsMinimum: number,
    userId: number
  ) {
    const query = knex
      .select(...getRestaurantFields('res'))
      .avg('rev.rating as rating')
      .from('restaurant as res')
      .innerJoin('review as rev', 'rev.restaurant_id', 'res.id')
      .groupBy('res.id')
      .orderBy('rating', 'desc');

    if (userId) {
      query.where('res.user_id', '=', userId);
    }

    if (ratingsMinimum) {
      query.where('rev.rating', '>', ratingsMinimum);
    }

    return query;

    // console.log('log yoyo', query.toSQL().toNative());
    // return query;
    // .orderBy('average_rating', 'desc')
    // ;
    // const restaurants = await knex
    //   .select(...restaurantFields)
    //   .from('restaurant')
    //   .orderByRaw('');
  }

  public getHighestReviewForRestaurant(restaurantId: number) {
    return knex
      .select(...reviewFields)
      .from('review')
      .where(decamelizeKeys({ restaurantId }))
      .orderBy('rating', 'desc')
      .orderBy('created_at', 'desc')
      .first();
  }

  public getLowestReviewForRestaurant(restaurantId: number) {
    return knex
      .select(...reviewFields)
      .from('review')
      .where(decamelizeKeys({ restaurantId }))
      .orderBy('rating', 'asc')
      .orderBy('created_at', 'desc')
      .first();
  }

  public getReviewFromUserAndRestaurantId(
    userId: number,
    restaurantId: number
  ) {
    // console.log('stuff here', restaurantId, userId);

    return knex
      .select(...reviewFields)
      .from('review')
      .where({
        restaurant_id: restaurantId,
        user_id: userId
      })
      .first();
    // console.log('query', knex
    //   .select('id')
    //   .from('review')
    //   .where({
    //     restaurant_id: restaurantId,
    //     user_id: userId,
    //   })
    //   .first().toSQL().toNative());
    // console.log('result hey there', result, !!result);
    // return result;
  }

  public async getReviewsForRestaurantIds(restaurantIds: number[]) {
    const res = await knex
      .select(reviewFields)
      .from('review')
      .whereIn('restaurant_id', restaurantIds)
      .orderBy('created_at', 'desc');

    return (
      orderedFor(res, restaurantIds, 'restaurantId', false) || []
    );
  }

  public getTotal() {
    return knex('restaurant')
      .countDistinct('id as count')
      .first();
  }

  public restaurant(id: number) {
    return knex
      .select(...getRestaurantFields())
      .from('restaurant')
      .where('id', '=', id)
      .first();
  }

  public addRestaurant(params: Restaurant) {
    return returnId(knex('restaurant')).insert(
      decamelizeKeys(params)
    );
  }

  public async deleteRestaurant(id: number) {
    const result = await knex('restaurant')
      .where('id', '=', id)
      .del();

    if (result === 0) {
      throw new Error('restaurant is already deleted');
    }

    return { id };
  }

  public editRestaurant({
    id,
    description,
    imageUrl,
    location,
    title,
    userId
  }: Restaurant & Identifier) {
    return knex('restaurant')
      .where('id', '=', id)
      .update(
        decamelizeKeys({
          description,
          imageUrl,
          location,
          title,
          userId
        })
      );
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

  public addReview({
    content,
    restaurantId,
    rating,
    userId
  }: Review) {
    return returnId(knex('review')).insert({
      content,
      restaurant_id: restaurantId,
      rating,
      user_id: userId
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
        rating
      });
  }

  public getReviewComment(id: number) {
    return knex
      .select('*')
      .from('review_comment')
      .where('id', '=', id)
      .first();
  }

  public addReviewComment(params: ReviewComment) {
    return returnId(knex('review_comment')).insert(
      decamelizeKeys(params)
    );
  }

  public deleteReviewComment(id: number) {
    return knex('review_comment')
      .where('id', '=', id)
      .del();
  }

  public editReviewComment({
    id,
    comment
  }: ReviewComment & Identifier) {
    return knex('review_comment')
      .where('id', '=', id)
      .update({
        comment
      });
  }

  public getReviewCommentFromReview(reviewId: number) {
    return knex('review_comment')
      .where('review_id', '=', reviewId)
      .first();
  }
}
