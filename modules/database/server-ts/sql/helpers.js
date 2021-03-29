import { groupBy } from 'lodash';

export const returnId = knexTable => knexTable;

export const truncateTables = async (knex, Promise, tables) => {
  return Promise.all(tables.map(table => knex(table).truncate()));
};

export const orderedFor = (rows, collection, field, singleObject) => {
  // return the rows ordered for the collection
  const inGroupsOfField = groupBy(rows, field);
  return collection.map(element => {
    const elementArray = inGroupsOfField[element];
    if (elementArray) {
      return singleObject ? elementArray[0] : elementArray;
    }
    return singleObject ? {} : [];
  });
};
