import { ClientSession } from "mongoose";

export type DeleteRecordGenericOptions<IdentifierOptions> = {
  identifierOptions: IdentifierOptions;
  dbTransaction:
    | {
        useTransaction: false;
      }
    | {
        useTransaction: true;
        session: ClientSession;
      };
};
