import { Document, PaginateResult } from "mongoose";
import { DBModel } from "src/types/db.model";
import { CreateRecordOptionsGeneric } from "./options/create-record.generic";
import { UpdateRecordGenericOptions } from "./options/update-record.generic";
import { DeleteRecordGenericOptions } from "./options/delete-record.generic";
import { FetchRecordGenericOptions } from "./options/fetch-record.generic";
import { ListRecordGenericOptions } from "./options/list-record.generic";

export abstract class BaseModelAction<T extends Document> {
  model: DBModel<T>;

  constructor(model: DBModel<T>) {
    this.model = model;
  }
  async get(
    fetchOptions: FetchRecordGenericOptions<Record<string, any>>,
  ): Promise<T> {
    const { queryOptions, relations } = fetchOptions;
    return await this.model.findOne(queryOptions).populate(relations).exec();
  }

  async create(
    createRecordOptions: CreateRecordOptionsGeneric<Record<string, any>>,
  ): Promise<T> {
    const { createPayload, dbTransaction } = createRecordOptions;
    if (dbTransaction?.useTransaction) {
      const [created] = await this.model.create([createPayload], {
        session: dbTransaction.session,
      });
      return created;
    }
    const [created] = await this.model.create([createPayload]);
    return created;
  }

  async update(
    updateRecordOptions: UpdateRecordGenericOptions<Record<string, any>>,
  ): Promise<T> {
    const { updatePayload, identifierOptions, dbTransaction } =
      updateRecordOptions;
    if (dbTransaction?.useTransaction) {
      return await this.model.findOneAndUpdate(
        identifierOptions,
        { $set: updatePayload },
        { session: dbTransaction.session, new: true },
      );
    }
    return await this.model.findOneAndUpdate(
      identifierOptions,
      { $set: updatePayload },
      { new: true },
    );
  }

  async delete(
    deleteRecordOptions: DeleteRecordGenericOptions<Record<string, any>>,
  ): Promise<T> {
    const { identifierOptions, dbTransaction } = deleteRecordOptions;
    if (dbTransaction?.useTransaction) {
      return await this.model.findOneAndDelete(identifierOptions, {
        session: dbTransaction.session,
      });
    }
    return await this.model.findOneAndDelete(identifierOptions);
  }

  async list(
    listRecordOptions: ListRecordGenericOptions<Record<string, any>>,
  ): Promise<{ responsePayload: T[]; meta: Omit<PaginateResult<T>, "docs"> }> {
    const { filterOptions, paginationOptions, sortOptions, relations } =
      listRecordOptions;
    const { docs, ...meta } = await this.model.paginate(filterOptions, {
      ...paginationOptions,
      sort: sortOptions,
      populate: relations,
    });
    return { responsePayload: docs, meta };
  }
}
