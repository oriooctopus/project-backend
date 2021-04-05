export default {
  admin: [
    'basic',
    'user:*',
    'restaurant:view:*',
    'restaurant:delete:*',
    'restaurant:update:*'
  ],
  user: [
    'basic',
    'restaurant:view:all',
    'user:view:self',
    'user:update:self',
    'review:create:self'
  ],
  owner: [
    'basic',
    'restaurant:view:self',
    'restaurant:create:self',
    'restaurant:delete:self',
    'restaurant:update:self',
    'reviewComment:create:self'
  ]
};
