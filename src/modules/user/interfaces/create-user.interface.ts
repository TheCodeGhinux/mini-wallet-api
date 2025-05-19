import { CreateRecordOptionsGeneric } from "@database/options/create-record.generic";
import { UserInterface } from "./user.interface";

type CreateUserRecord = Pick<UserInterface, "email" | "password" | "name">;

type CreateUserRecordOptions = CreateRecordOptionsGeneric<CreateUserRecord>;
export default CreateUserRecordOptions;
