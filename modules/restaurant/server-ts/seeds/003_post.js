import { returnId, truncateTables } from '@gqlapp/database-server-ts';

export async function seed(knex, Promise) {
  await truncateTables(knex, Promise, [
    'restaurant',
    'review',
    'review_comment'
  ]);

  await Promise.all(
    [...Array(20).keys()].map(async (ii) => {
      const restaurant = await returnId(knex('restaurant')).insert({
        description: `Restaurant description ${ii + 1}`,
        location: 'Av. Córdoba 1147',
        image_url:
          'https://img.pystatic.com/profile-headers/chabuca-granda-header.jpg',
        title: `Restaurant title ${ii + 1}`
      });

      const review1 = `I got a burger and an order of empanadas from this place via Uber Eats.
The deliver was spot-on. FAST! Food arrived quite hot, and early. However the food also left much to be desired. The fries were soggy. The meat had a weird off flavor. I was ok in the morning but it left me wondering what the heck was up with that. And the pattie was like leather with gristle in it. Not pleasant. Same meat was in the empanadas but at least they were still juicy.
Not about to try again!`;
      const review2 = `Excelente lugar para tomar un trago con tu grupo de amigos o con tu pareja si no te gusta lo excesivamente romántico. El lugar es cálido, bien atendido y cómodo. Vale la pena sobre todo la parte de sandwiches, muy variados y a buen precio. Tiene posibilidades de convertirse en mi bar de cabecera!`;

      await Promise.all(
        [...Array(1).keys()].map(async (jj) => {
          const [reviewId] = await returnId(knex('review')).insert({
            restaurant_id: restaurant[0],
            content: jj % 2 ? review1 : review2,
            rating: jj % 2 ? 5 : 1,
            user_id: jj + 1
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
