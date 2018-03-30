exports.seed = function(knex, Promise) {
  return knex('userlikes')
    .then(function () {
      return Promise.all([
        knex('userlikes').insert({userid1: 1, userid2: 2, liked: true}),
        knex('userlikes').insert({userid1: 1, userid2: 11,liked: true}),
        knex('userlikes').insert({userid1: 3, userid2: 4, liked: true}),
        knex('userlikes').insert({userid1: 1, userid2: 3, liked: false}),
        knex('userlikes').insert({userid1: 8, userid2: 4, liked: null}),
        knex('userlikes').insert({userid1: 2, userid2: 12,liked: null}),
        knex('userlikes').insert({userid1: 9, userid2: 1, liked: true}),
        knex('userlikes').insert({userid1: 7, userid2: 1, liked: true}),
        knex('userlikes').insert({userid1: 8, userid2: 1,liked: true}),
        knex('userlikes').insert({userid1: 3, userid2: 6, liked: null}),
        knex('userlikes').insert({userid1: 3, userid2: 1, liked: null}),
        knex('userlikes').insert({userid1: 4, userid2: 1, liked: true}),
        knex('userlikes').insert({userid1: 8, userid2: 1, liked: null}),
        knex('userlikes').insert({userid1: 10, userid2: 1, liked: null}),
        knex('userlikes').insert({userid1: 5, userid2: 1, liked: null})
      ]);
    });
};