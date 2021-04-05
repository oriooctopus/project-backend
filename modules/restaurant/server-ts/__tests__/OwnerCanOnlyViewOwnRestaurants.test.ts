import { expect } from 'chai';
import { getApollo } from '@gqlapp/testing-server-ts';
import gql from 'graphql-tag';
import {
  ADD_RESTAURANT_MUTATION,
  createLoginOwner,
  createLoginUser,
  createLogout,
  removeTypename
} from './utils';
import { log } from '@gqlapp/core-common';

let loginOwner = (): void => null;
let loginUser = (): void => null;
let logout = (): void => null;

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

describe('Restaurant and reviews example API works', () => {
  let apollo: any;

  beforeAll(async () => {
    apollo = getApollo();
    loginOwner = createLoginOwner(apollo);
    loginUser = createLoginUser(apollo);
    logout = createLogout(apollo);
    logout();
  });

  it('An owner can only see their own restaurants', async () => {
    await loginOwner(true);

    const restaurants = await apollo.query({
      query: RESTAURANTS_QUERY,
      variables: { limit: 10, after: 0 }
    });

    const oldRestaurantsLength = restaurants.data.restaurants.edges.length;

    expect(oldRestaurantsLength).to.equal(0);

    await apollo.mutate({
      mutation: ADD_RESTAURANT_MUTATION
    });

    const newRestaurantList = await apollo.query({
      query: RESTAURANTS_QUERY,
      variables: { limit: 10, after: 0 }
    });

    console.log('wtf', newRestaurantList.data.restaurants.edges);

    expect(newRestaurantList.data.restaurants.edges.length).to.equal(
      oldRestaurantsLength + 1
    );
  });
});

// can't delete another person's restaurant
// admin can delete all restaurants
