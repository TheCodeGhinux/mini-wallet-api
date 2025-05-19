import { Document, Model, PaginateModel } from "mongoose";

export type DBModel<T extends Document> = Model<T> &
  PaginateModel<T> & {
    aggregatePaginate(aggregateQuery, options, callback);
  };
