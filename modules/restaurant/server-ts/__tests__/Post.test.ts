import { expect } from 'chai';
import { getApollo } from '@gqlapp/testing-server-ts';
import gql from 'graphql-tag';
import {
  createLoginOwner,
  createLoginUser,
  createLogout,
  removeTypename
} from './utils';

let loginOwner = (): void => null;
let loginUser = (): void => null;
let logout = (): void => null;

describe('Restaurant and reviews example API works', () => {
  let apollo: any;

  beforeAll(async () => {
    apollo = getApollo();
    loginOwner = createLoginOwner(apollo);
    loginUser = createLoginUser(apollo);
    logout = createLogout(apollo);
    logout();
  });

  it('Query restaurant list works', async () => {
    await loginUser();

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
              description: 'Restaurant description 19'
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

  it('Query single restaurant with reviews works', async () => {
    await loginUser();
    const query = await gql`
      query Restaurant {
        restaurant(id: 1) {
          id
          averageRating
          description
          location
          canAddReview
          imageUrl
          title
          totalReviews
          reviews {
            id
            rating
            reviewComment {
              comment
            }
          }
        }
      }
    `;
    const result = await apollo.query({
      query,
      variables: { id: 1 }
    });
    removeTypename(result);

    expect(result.data).to.deep.equal({
      restaurant: {
        id: 1,
        averageRating: 1,
        description: 'Restaurant description 1',
        location: 'Av. Córdoba 1147',
        canAddReview: true,
        imageUrl:
          'https://img.pystatic.com/profile-headers/chabuca-granda-header.jpg',
        title: 'Restaurant title 1',
        totalReviews: 1,
        reviews: [
          {
            id: 1,
            rating: 1,
            reviewComment: {
              comment: 'Thanks for coming!'
            }
          }
        ]
      }
    });
  });

  it('Publishes restaurant on add', async () => {
    const mutation = gql`
      mutation addRestaurant {
        addRestaurant(
          input: {
            title: "This is a new restaurant"
            description: "this is a restaurant description"
            location: "812 evergreen terrace"
            imageUrl: "https://images.unsplash.com/photo-1490138139357-fc819d02e344?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwyNDF8MHwxfHJhbmRvbXx8fHx8fHx8fDE2MTc1NDIzNTQ&ixlib=rb-1.2.1&q=80&w=400"
            userId: 3
          }
        ) {
          description
          title
          userId
        }
      }
    `;

    await loginOwner();
    const result = await apollo.mutate({
      mutation
    });
    removeTypename(result.data);

    console.log('the results!!', result);

    expect(result.data).to.deep.equal({
      addRestaurant: {
        description: 'this is a restaurant description',
        title: 'This is a new restaurant',
        userId: 3
      }
    });
  });

  it('Can delete a restaurant', async () => {
    const addRestaurantMutation = gql`
      mutation addRestaurant {
        addRestaurant(
          input: {
            title: "This is a new restaurant"
            description: "this is a restaurant description"
            location: "812 evergreen terrace"
            imageUrl: "https://images.unsplash.com/photo-1490138139357-fc819d02e344?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwyNDF8MHwxfHJhbmRvbXx8fHx8fHx8fDE2MTc1NDIzNTQ&ixlib=rb-1.2.1&q=80&w=400"
            userId: 3
          }
        ) {
          id
        }
      }
    `;
    const deleteRestaurantMutation = await gql`
      mutation deleteRestaurant($id: Int!) {
        deleteRestaurant(id: $id) {
          id
        }
      }
    `;
    const getRestaurantQuery = await gql`
      query Restaurant($id: Int!) {
        restaurant(id: $id) {
          id
        }
      }
    `;

    await loginOwner();
    const newRestaurant = await apollo.mutate({
      mutation: addRestaurantMutation
    });
    const newRestaurantId = newRestaurant.data.addRestaurant.id;
    console.log('check!', JSON.stringify(newRestaurant));

    expect(newRestaurantId).to.be.greaterThan(0);

    await apollo.mutate({
      mutation: deleteRestaurantMutation,
      variables: {
        id: newRestaurantId
      }
    });

    const deletedRestaurant = await apollo.query({
      query: getRestaurantQuery,
      variables: {
        id: newRestaurantId
      }
    });

    expect(deletedRestaurant.data.restaurant).to.be.null;
  });
});

// can't delete another person's restaurant
// admin can delete all restaurants
