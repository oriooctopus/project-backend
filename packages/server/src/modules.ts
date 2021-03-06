import core from '@gqlapp/core-server-ts';
import i18n from '@gqlapp/i18n-server-ts';
import cookies from '@gqlapp/cookies-server-ts';
import restaurant from '@gqlapp/restaurant-server-ts';
import graphqlTypes from '@gqlapp/graphql-types-server-ts';
import authentication from '@gqlapp/authentication-server-ts';
import rest from '@gqlapp/rest-server-ts';
import '@gqlapp/debug-server-ts';

import ServerModule from '@gqlapp/module-server-ts';

const user = require('@gqlapp/user-server-ts').default;

const modules: ServerModule = new ServerModule(
  authentication,
  cookies,
  i18n,
  restaurant,
  user,
  rest,
  graphqlTypes,
  core
);

export default modules;
