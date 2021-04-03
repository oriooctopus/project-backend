export default {
  admin: ['user:*'],
  user: [
    'user:view:self',
    'user:update:self',
    'stripe:*',
    'review:create:self'
  ],
  owner: ['reviewComment:create:self']
};
