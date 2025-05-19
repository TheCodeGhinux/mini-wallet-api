import { ClientSession } from "mongoose";

export type UpdateRecordGenericOptions<UpdateRecordOptions> = {
  identifierOptions: Record<string, any>;
  updatePayload: UpdateRecordOptions;
  dbTransaction:
    | {
        useTransaction: false;
      }
    | {
        useTransaction: true;
        session: ClientSession;
      };
};
