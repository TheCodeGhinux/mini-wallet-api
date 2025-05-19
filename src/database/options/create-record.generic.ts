import { ClientSession } from "mongoose";

export type CreateRecordOptionsGeneric<CreatePayloadOptions> = {
  createPayload?: CreatePayloadOptions;
  dbTransaction:
    | {
        useTransaction: false;
      }
    | {
        useTransaction: true;
        session: ClientSession;
      };
};
