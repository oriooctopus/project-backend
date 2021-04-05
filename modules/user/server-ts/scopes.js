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
    'user:view:self',
    'user:update:self',
    'stripe:*',
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
