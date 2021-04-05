import gql from 'graphql-tag';

const LOGIN_MUTATION = gql`
  mutation Login($usernameOrEmail: String!, $password: String!) {
    login(
      input: {
        usernameOrEmail: $usernameOrEmail
        password: $password
      }
    ) {
      user {
        id
      }
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const createLoginUser = (apollo: any) => {
  return async () => {
    await apollo.mutate({
      mutation: LOGIN_MUTATION,
      variables: {
        usernameOrEmail: 'user',
        password: 'user1234'
      }
    });
  };
}

export const createLoginOwner = (apollo: any) => {
  return async () => {
    await apollo.mutate({
      mutation: LOGIN_MUTATION,
      variables: {
        usernameOrEmail: 'owner',
        password: 'owner1234'
      }
    });
  };
}

export const createLogout = (apollo: any) => {
  return async () => {
    await apollo.mutate({
      mutation: LOGOUT_MUTATION
    });
  }
}

export const removeTypename = (obj: any) => {
  delete obj['__typename'];
  for (let key in obj) {
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      removeTypename(obj[key]);
    } else if (Array.isArray(obj[key])) {
      obj[key].forEach((el) => {
        removeTypename(el);
      });
    }
  }
};
