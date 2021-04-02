import { knex, returnId, orderedFor } from '@gqlapp/database-server-ts';

export interface Post {
  title: string;
  content: string;
}

export interface Review {
  postId: number;
  content: string;
  userId: number;
  review: string;
}

export interface ReviewComment {
  reviewId: number;
  comment: string;
}

export interface Identifier {
  id: number;
}

export default class PostDAO {
  public postsPagination(limit: number, after: number) {
    return knex
      .select('id', 'title', 'content')
      .from('post')
      .orderBy('id', 'desc')
      .limit(limit)
      .offset(after);
  }

  public async getReviewsForPostIds(postIds: number[]) {
    const res = await knex
      .select('id', 'content', 'rating', 'post_id AS postId', 'user_id AS userId')
      .from('review')
      .whereIn('post_id', postIds);

    return orderedFor(res, postIds, 'postId', false);
  }

  public getTotal() {
    return knex('post')
      .countDistinct('id as count')
      .first();
  }

  public post(id: number) {
    return knex
      .select('id', 'title', 'content')
      .from('post')
      .where('id', '=', id)
      .first();
  }

  public addPost(params: Post) {
    return returnId(knex('post')).insert(params);
  }

  public deletePost(id: number) {
    return knex('post')
      .where('id', '=', id)
      .del();
  }

  public editPost({ id, title, content }: Post & Identifier) {
    return knex('post')
      .where('id', '=', id)
      .update({ title, content });
  }

  public addReview({ content, postId }: Review) {
    return returnId(knex('review')).insert({
      content,
      post_id: postId
    });
  }

  public getReview(id: number) {
    return knex
      .select('id', 'content')
      .from('review')
      .where('id', '=', id)
      .first();
  }

  public deleteReview(id: number) {
    return knex('review')
      .where('id', '=', id)
      .del();
  }

  public editReview({ id, content }: Review & Identifier) {
    return knex('review')
      .where('id', '=', id)
      .update({
        content
      });
  }

  public getReviewCommentFromReview(reviewId: number) {
    return knex('review_comment')
      .where('review_id', '=', reviewId)
      .first();
  }
}
