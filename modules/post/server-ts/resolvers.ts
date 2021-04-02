import { PubSub, withFilter } from 'graphql-subscriptions';
import { createBatchResolver } from 'graphql-resolve-batch';
// interfaces
import { Post, Review, Identifier } from './sql';

interface Edges {
  cursor: number;
  node: Post & Identifier;
}

interface PostsParams {
  limit: number;
  after: number;
}

interface PostInput {
  input: Post;
}

interface PostInputWithId {
  input: Post & Identifier;
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

const POST_SUBSCRIPTION = 'post_subscription';
const POSTS_SUBSCRIPTION = 'posts_subscription';
const REVIEW_SUBSCRIPTION = 'review_subscription';
const REVIEW_COMMENT_SUBSCRIPTION = 'review_comment_subscription';

export default (pubsub: PubSub) => ({
  Query: {
    async posts(
      obj: any,
      { limit, after }: PostsParams,
      context: any,
    ) {
      const edgesArray: Edges[] = [];
      const posts = await context.Post.postsPagination(limit, after);
      const total = (await context.Post.getTotal()).count;
      const hasNextPage = total > after + limit;

      posts.map((post: Post & Identifier, index: number) => {
        edgesArray.push({
          cursor: after + index,
          node: post,
        });
      });
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
    post(obj: any, { id }: Identifier, context: any) {
      return context.Post.post(id);
    },
  },
  Review: {
    reviewComment({ id }: Identifier, _: any, context: any) {
      return context.Post.getReviewCommentFromReview(id);
    },
    userProfile({ userId }: Review, _: any, context: any) {
      return context.User.getUserProfile(userId);
    },
  },
  Post: {
    reviews: createBatchResolver((sources, args, context) => {
      return context.Post.getReviewsForPostIds(
        sources.map(({ id }) => id),
      );
    }),
    averageRating({ id }: Identifier, _: any, context: any) {
      console.log('post id for average rating', id);
      return context.Post.getAverageRating(id);
    },
    totalReviews({ id }: Identifier, _: any, context: any) {
      console.log('post id for total reviews', id);
      return context.Post.getTotalReviews(id);
    },
  },
  Mutation: {
    async addPost(obj: any, { input }: PostInput, context: any) {
      const [id] = await context.Post.addPost(input);
      const post = await context.Post.post(id);
      // publish for post list
      pubsub.publish(POSTS_SUBSCRIPTION, {
        postsUpdated: {
          mutation: 'CREATED',
          id,
          node: post,
        },
      });
      return post;
    },
    async deletePost(obj: any, { id }: Identifier, context: any) {
      const post = await context.Post.post(id);
      const isDeleted = await context.Post.deletePost(id);
      if (isDeleted) {
        // publish for post list
        pubsub.publish(POSTS_SUBSCRIPTION, {
          postsUpdated: {
            mutation: 'DELETED',
            id,
            node: post,
          },
        });
        // publish for edit post page
        pubsub.publish(POST_SUBSCRIPTION, {
          postUpdated: {
            mutation: 'DELETED',
            id,
            node: post,
          },
        });
        return { id: post.id };
      } else {
        return { id: null };
      }
    },
    async editPost(
      obj: any,
      { input }: PostInputWithId,
      context: any,
    ) {
      await context.Post.editPost(input);
      const post = await context.Post.post(input.id);
      // publish for post list
      pubsub.publish(POSTS_SUBSCRIPTION, {
        postsUpdated: {
          mutation: 'UPDATED',
          id: post.id,
          node: post,
        },
      });
      // publish for edit post page
      pubsub.publish(POST_SUBSCRIPTION, {
        postUpdated: {
          mutation: 'UPDATED',
          id: post.id,
          node: post,
        },
      });
      return post;
    },
    async addReview(obj: any, { input }: ReviewInput, context: any) {
      const [id] = await context.Post.addReview(input);
      const review = await context.Post.getReview(id);
      // publish for edit post page
      pubsub.publish(REVIEW_SUBSCRIPTION, {
        reviewUpdated: {
          mutation: 'CREATED',
          id: review.id,
          postId: input.postId,
          node: review,
        },
      });
      return review;
    },
    async deleteReview(
      obj: any,
      {
        input: { id, postId },
      }: ReviewInputWithId,
      context: any,
    ) {
      await context.Post.deleteReview(id);
      // publish for edit post page
      pubsub.publish(REVIEW_SUBSCRIPTION, {
        reviewUpdated: {
          mutation: 'DELETED',
          id,
          postId,
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
      await context.Post.editReview(input);
      const review = await context.Post.getReview(input.id);
      // publish for edit post page
      pubsub.publish(REVIEW_SUBSCRIPTION, {
        reviewUpdated: {
          mutation: 'UPDATED',
          id: input.id,
          postId: input.postId,
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
      const [id] = await context.Post.addReviewComment(input);
      const reviewComment = await context.Post.getReviewComment(id);
      // publish for edit post page
      pubsub.publish(REVIEW_COMMENT_SUBSCRIPTION, {
        reviewCommentUpdated: {
          mutation: 'CREATED',
          id: reviewComment.id,
          postId: input.postId,
          node: reviewComment,
        },
      });
      return reviewComment;
    },
    async deleteReviewComment(
      obj: any,
      {
        input: { id, postId },
      }: ReviewCommentInputWithId,
      context: any,
    ) {
      await context.Post.deleteReviewComment(id);
      // publish for edit post page
      pubsub.publish(REVIEW_COMMENT_SUBSCRIPTION, {
        reviewCommentUpdated: {
          mutation: 'DELETED',
          id,
          postId,
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
      await context.Post.editReviewComment(input);
      const reviewComment = await context.Post.getReviewComment(
        input.id,
      );
      // publish for edit post page
      pubsub.publish(REVIEW_COMMENT_SUBSCRIPTION, {
        reviewCommentUpdated: {
          mutation: 'UPDATED',
          id: input.id,
          postId: input.postId,
          node: reviewComment,
        },
      });
      return reviewComment;
    },
  },
  Subscription: {
    postUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(POST_SUBSCRIPTION),
        (payload, variables) => {
          return payload.postUpdated.id === variables.id;
        },
      ),
    },
    postsUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(POSTS_SUBSCRIPTION),
        (payload, variables) => {
          return variables.endCursor <= payload.postsUpdated.id;
        },
      ),
    },
    reviewUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(REVIEW_SUBSCRIPTION),
        (payload, variables) => {
          return payload.reviewUpdated.postId === variables.postId;
        },
      ),
    },
    reviewCommentUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(REVIEW_COMMENT_SUBSCRIPTION),
        (payload, variables) => {
          return (
            payload.reviewCommentUpdated.postId === variables.postId
          );
        },
      ),
    },
  },
});
