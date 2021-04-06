import core from '@gqlapp/core-client-react';
import look from '@gqlapp/look-client-react';
import i18n from '@gqlapp/i18n-client-react';
import ClientModule from '@gqlapp/module-client-react';
import defaultRouter from '@gqlapp/router-client-react';
import authentication from '@gqlapp/authentication-client-react';
import '@gqlapp/favicon-common';

// const post = require('@gqlapp/restaurant-client-react').default;
const user = require('@gqlapp/user-client-react').default;

const modules = new ClientModule(
  look,
  defaultRouter,
  user,
  i18n,
  core,
  authentication
);

export default modules;
