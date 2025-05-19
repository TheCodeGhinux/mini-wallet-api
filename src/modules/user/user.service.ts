import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcrypt";
import { BaseModelAction } from "@database/base.model.action";
import { User, UserDocument } from "./user.schema";
import { UpdateUserDto } from "./dto/update-user.dto";
import { DBModel } from "@/types/db.model";
import { USER } from "@database/schemas";
import CreateUserRecordOptions from "./interfaces/create-user.interface";
import { ClientSession } from "mongoose";

@Injectable()
export class UserService extends BaseModelAction<UserDocument> {
  constructor(@InjectModel(USER) userModel: DBModel<UserDocument>) {
    super(userModel);
  }

  async createUser(
    createUserOptions: CreateUserRecordOptions,
  ): Promise<UserDocument> {
    return this.create(createUserOptions);
  }

  async findUserByEmail(
    email: string,
    relations?: string[],
  ): Promise<UserDocument | null> {
    return this.get({ queryOptions: { email }, relations });
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const data: Partial<User> = { ...updateUserDto };
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.update({
      identifierOptions: { _id: id },
      updatePayload: data,
      dbTransaction: { useTransaction: false },
    });
  }

  async incrementXp(
    userId: string,
    delta: number,
    session?: ClientSession,
  ): Promise<UserDocument> {
    return this.model
      .findOneAndUpdate(
        { _id: userId },
        { $inc: { xp: delta } },
        {
          session,
          returnDocument: "after",
        },
      )
      .lean();
  }

  async deleteUser(id: string): Promise<UserDocument> {
    return this.delete({
      identifierOptions: { _id: id },
      dbTransaction: { useTransaction: false },
    });
  }

  async validatePassword(
    user: UserDocument,
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}
