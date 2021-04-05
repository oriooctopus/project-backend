import { expect } from 'chai';
import { getApollo } from '@gqlapp/testing-server-ts';
import gql from 'graphql-tag';

// import RESTAURANTS_QUERY from '@gqlapp/restaurant-client-react/graphql/RestaurantsQuery.graphql';
// import RESTAURANT_QUERY from '@gqlapp/restaurant-client-react/graphql/RestaurantQuery.graphql';
// import ADD_RESTAURANT from '@gqlapp/restaurant-client-react/graphql/AddRestaurant.graphql';
// import EDIT_RESTAURANT from '@gqlapp/restaurant-client-react/graphql/EditRestaurant.graphql';
// import DELETE_RESTAURANT from '@gqlapp/restaurant-client-react/graphql/DeleteRestaurant.graphql';
// import RESTAURANTS_SUBSCRIPTION from '@gqlapp/restaurant-client-react/graphql/RestaurantsSubscription.graphql';

const LOGIN_MUTATION = gql`
  mutation Login {
    login(input: { usernameOrEmail: "user", password: "user1234" }) {
      user {
        id
      }
    }
  }
`;

const removeTypename = obj => {
  delete obj["__typename"];
  for (let key in obj) {
    if (typeof obj[key] === 'object' && !Array.isArray(obj)) {
      removeTypename(obj[key]);
    }
  }
}

describe('Restaurant and reviews example API works', () => {
  let apollo: any;

  beforeAll(async () => {
    apollo = getApollo();
    await apollo.mutate({
      mutation: LOGIN_MUTATION
    });
  });

  it('Query restaurant list works', async () => {
    const RESTAURANTS_QUERY = gql`
      query RestaurantsQuery($limit: Int, $after: Int) {
        restaurants(limit: $limit, after: $after) {
          totalCount
          edges {
            cursor
            node {
              id
              title
              description
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    `;
    const result = await apollo.query({
      query: RESTAURANTS_QUERY,
      variables: { limit: 1, after: 18 }
    });

    removeTypename(result.data);
    expect(result.data).to.deep.equal({
      restaurants: {
        totalCount: 20,
        edges: [
          {
            cursor: 18,
            node: {
              id: 19,
              title: 'Restaurant title 19',
              content: 'Restaurant description 19'
            }
          }
        ],
        pageInfo: {
          endCursor: 18,
          hasNextPage: true
        }
      }
    });
  });

  // it('Query single restaurant with reviews works', async () => {
  //   const result = await apollo.query({
  //     query: RESTAURANT_QUERY,
  //     variables: { id: 1 }
  //   });

  //   expect(result.data).to.deep.equal({
  //     restaurant: {
  //       id: 1,
  //       title: 'Restaurant title 1',
  //       content: 'Restaurant content 1',
  //       __typename: 'Restaurant',
  //       reviews: [
  //         {
  //           id: 1,
  //           content: 'Review title 1 for restaurant 1',
  //           __typename: 'Review'
  //         },
  //         {
  //           id: 2,
  //           content: 'Review title 2 for restaurant 1',
  //           __typename: 'Review'
  //         }
  //       ]
  //     }
  //   });
  // });

  // it('Publishes restaurant on add', done => {
  //   apollo.mutate({
  //     mutation: ADD_RESTAURANT,
  //     variables: {
  //       input: {
  //         title: 'New restaurant 1',
  //         content: 'New restaurant content 1'
  //       }
  //     }
  //   });

  //   const subscription = apollo
  //     .subscribe({
  //       query: RESTAURANTS_SUBSCRIPTION,
  //       variables: { endCursor: 10 }
  //     })
  //     .subscribe({
  //       next(data: any) {
  //         expect(data).to.deep.equal({
  //           data: {
  //             restaurantsUpdated: {
  //               mutation: 'CREATED',
  //               node: {
  //                 id: 21,
  //                 title: 'New restaurant 1',
  //                 content: 'New restaurant content 1',
  //                 __typename: 'Restaurant'
  //               },
  //               __typename: 'UpdateRestaurantPayload'
  //             }
  //           }
  //         });
  //         subscription.unsubscribe();
  //         done();
  //       }
  //     });
  // });

  // it('Adding restaurant works', async () => {
  //   const result = await apollo.query({
  //     query: RESTAURANTS_QUERY,
  //     variables: { limit: 1, after: 0 }
  //   });
  //   expect(result.data.restaurants).to.have.property('totalCount', 21);
  //   expect(result.data.restaurants).to.have.nested.property('edges[0].node.title', 'New restaurant 1');
  //   expect(result.data.restaurants).to.have.nested.property('edges[0].node.content', 'New restaurant content 1');
  // });

  // it('Publishes restaurant on update', done => {
  //   apollo.mutate({
  //     mutation: EDIT_RESTAURANT,
  //     variables: {
  //       input: {
  //         id: 21,
  //         title: 'New restaurant 2',
  //         content: 'New restaurant content 2'
  //       }
  //     }
  //   });

  //   const subscription = apollo
  //     .subscribe({
  //       query: RESTAURANTS_SUBSCRIPTION,
  //       variables: { endCursor: 10 }
  //     })
  //     .subscribe({
  //       next(data: any) {
  //         expect(data).to.deep.equal({
  //           data: {
  //             restaurantsUpdated: {
  //               mutation: 'UPDATED',
  //               node: {
  //                 id: 21,
  //                 title: 'New restaurant 2',
  //                 content: 'New restaurant content 2',
  //                 __typename: 'Restaurant'
  //               },
  //               __typename: 'UpdateRestaurantPayload'
  //             }
  //           }
  //         });
  //         subscription.unsubscribe();
  //         done();
  //       }
  //     });
  // });

  // it('Updating restaurant works', async () => {
  //   const result = await apollo.query({
  //     query: RESTAURANTS_QUERY,
  //     variables: { limit: 1, after: 0 }
  //   });
  //   expect(result.data.restaurants).to.have.property('totalCount', 21);
  //   expect(result.data.restaurants).to.have.nested.property('edges[0].node.title', 'New restaurant 2');
  //   expect(result.data.restaurants).to.have.nested.property('edges[0].node.content', 'New restaurant content 2');
  // });

  // it('Publishes restaurant on removal', done => {
  //   apollo.mutate({
  //     mutation: DELETE_RESTAURANT,
  //     variables: { id: 21 }
  //   });

  //   const subscription = apollo
  //     .subscribe({
  //       query: RESTAURANTS_SUBSCRIPTION,
  //       variables: { endCursor: 10 }
  //     })
  //     .subscribe({
  //       next(data: any) {
  //         expect(data).to.deep.equal({
  //           data: {
  //             restaurantsUpdated: {
  //               mutation: 'DELETED',
  //               node: {
  //                 id: 21,
  //                 title: 'New restaurant 2',
  //                 content: 'New restaurant content 2',
  //                 __typename: 'Restaurant'
  //               },
  //               __typename: 'UpdateRestaurantPayload'
  //             }
  //           }
  //         });
  //         subscription.unsubscribe();
  //         done();
  //       }
  //     });
  // });

  // it('Deleting restaurant works', async () => {
  //   const result = await apollo.query({
  //     query: RESTAURANTS_QUERY,
  //     variables: { limit: 2, after: 0 }
  //   });
  //   expect(result.data.restaurants).to.have.property('totalCount', 20);
  //   expect(result.data.restaurants).to.have.nested.property('edges[0].node.title', 'Restaurant title 20');
  //   expect(result.data.restaurants).to.have.nested.property('edges[0].node.content', 'Restaurant content 20');
  // });
});
