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
};

type createLoginOwnerProps = {
  alternate?: boolean;
};

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
};

export const createLoginAlternateOwner = (apollo: any) => {
  return async () => {
    await apollo.mutate({
      mutation: LOGIN_MUTATION,
      variables: {
        usernameOrEmail: 'owner2',
        password: 'owner1234'
      }
    });
  };
};

export const createLogout = (apollo: any) => {
  return async () => {
    await apollo.mutate({
      mutation: LOGOUT_MUTATION
    });
  };
};

export const removeKey = (obj: any, keyToRemove: string) => {
  delete obj[keyToRemove];
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

export const removeTypename = (obj: any) => removeKey(obj, '__typename');

export const ADD_RESTAURANT_MUTATION = gql`
  mutation addRestaurant {
    addRestaurant(
      input: {
        title: "This is a new restaurant"
        description: "this is a restaurant description"
        location: "812 evergreen terrace"
        imageUrl: "https://images.unsplash.com/photo-1490138139357-fc819d02e344?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwyNDF8MHwxfHJhbmRvbXx8fHx8fHx8fDE2MTc1NDIzNTQ&ixlib=rb-1.2.1&q=80&w=400"
      }
    ) {
      id
      description
      title
      userId
    }
  }
`;
