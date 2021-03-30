import { returnId, truncateTables } from '@gqlapp/database-server-ts';

export async function seed(knex, Promise) {
  await truncateTables(knex, Promise, ['post', 'review', 'review_comment']);

  await Promise.all(
    [...Array(20).keys()].map(async ii => {
      const post = await returnId(knex('post')).insert({
        title: `Post title ${ii + 1}`,
        content: `Post content ${ii + 1}`
      });

      await Promise.all(
        [...Array(2).keys()].map(async jj => {
          const [reviewId] = await returnId(knex('review')).insert({
            post_id: post[0],
            content: `Review #${jj + 1} for restaurant ${post[0]}`,
            rating: 5,
            user_id: 1
          });
          // let's leave some blank for testing and speed purposes
          reviewId < 5 &&
            (await returnId(knex('review_comment')).insert({
              review_id: reviewId,
              comment: 'Thanks for coming!'
            }));
        })
      );
    })
  );
}
