import { expect } from 'chai';
import { getApollo } from '@gqlapp/testing-server-ts';
import gql from 'graphql-tag';
import { createLoginOwner, createLoginUser, removeTypename } from './utils';

let loginOwner = () => null;
let loginUser = () => null;

describe('Restaurant and reviews example API works', () => {
  let apollo: any;

  beforeAll(async () => {
    apollo = getApollo();
    loginOwner = createLoginOwner(apollo);
    loginUser = createLoginUser(apollo);
  });

  it('Publishes review add', async () => {

    // expect(result.data)
  });
});
