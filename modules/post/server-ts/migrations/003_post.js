exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema
      .createTable('post', table => {
        table.increments();
        table.string('title');
        table.string('content');
        table.timestamps(false, true);
      })
      .createTable('review', table => {
        table.increments();
        table
          .integer('post_id')
          .unsigned()
          .references('id')
          .inTable('post')
          .onDelete('CASCADE');
        table
          .integer('user_id')
          .unsigned()
          .references('id')
          .inTable('user_profile')
          .onDelete('CASCADE');
        table.integer('rating');
        table.string('content');
        table.timestamps(false, true);
      })
      .createTable('review_comment', table => {
        table.increments();
        table
          .integer('review_id')
          .unsigned()
          .references('id')
          .inTable('review')
          .unique()
          .onDelete('CASCADE');
        table.string('comment');
        table.timestamps(false, true);
      })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('review_comment'),
    knex.schema.dropTable('review'),
    knex.schema.dropTable('post')
  ]);
};
