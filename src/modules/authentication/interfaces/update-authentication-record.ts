import { UpdateRecordGenericOptions } from "@database/options/update-record.generic";
import { Authentication } from "./authentication.interface";

type UpdateAuthenticationRecord = Partial<Authentication>;

type UpdateAuthenticationRecordOptions =
  UpdateRecordGenericOptions<UpdateAuthenticationRecord>;

export default UpdateAuthenticationRecordOptions;
