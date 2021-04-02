import { returnId, truncateTables } from '@gqlapp/database-server-ts';

export async function seed(knex, Promise) {
  await truncateTables(knex, Promise, [
    'restaurant',
    'review',
    'review_comment',
  ]);

  await Promise.all(
    [...Array(20).keys()].map(async (ii) => {
      const restaurant = await returnId(knex('restaurant')).insert({
        title: `Restaurant title ${ii + 1}`,
        content: `Restaurant content ${ii + 1}`,
      });

      await Promise.all(
        [...Array(2).keys()].map(async (jj) => {
          const [reviewId] = await returnId(knex('review')).insert({
            restaurant_id: restaurant[0],
            content: `Review #${jj + 1} for restaurant ${
              restaurant[0]
            }`,
            rating: jj % 2 ? 5 : 1,
            user_id: 1,
          });
          // let's leave some blank for testing and speed purposes
          reviewId < 5 &&
            (await returnId(knex('review_comment')).insert({
              review_id: reviewId,
              comment: 'Thanks for coming!',
            }));
        }),
      );
    }),
  );
}
