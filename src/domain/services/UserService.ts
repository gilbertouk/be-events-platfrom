import { type CreateUserInput } from "../../usecases/createUser/CreateUserInput";
import { type DeleteUserInput } from "../../usecases/deleteUser/DeleteUserInput";
import { type SelectByEmailUserInput } from "../../usecases/selectUserByEmail/SelectByEmailUserInput";
import { type IUser } from "../models/User";
import { database } from "../../infrastructure/database/";

export class UserService {
  async create(user: CreateUserInput): Promise<IUser> {
    try {
      const userModel = await database.user.create({
        data: {
          firstName: user.firstName,
          surname: user.surname,
          email: user.email.toLocaleLowerCase(),
          role: user.role,
        },
      });

      return userModel;
    } catch (error) {
      throw new Error();
    }
  }

  async delete(user: DeleteUserInput): Promise<IUser | null> {
    try {
      const userToDelete = await database.user.findUnique({
        where: { id: user.id },
      });

      if (!userToDelete) {
        return null;
      }

      const userModel = await database.user.delete({
        where: { id: user.id },
      });

      return userModel;
    } catch (error) {
      throw new Error();
    }
  }

  async selectByEmailUser(user: SelectByEmailUserInput): Promise<IUser | null> {
    try {
      const userModel = await database.user.findUnique({
        where: { email: user.email.toLocaleLowerCase() },
      });

      return userModel;
    } catch (error) {
      throw new Error();
    }
  }
}
