import { User } from "../protos/usermanager_pb";
import jsonParser from "./json_parser";
import { userOperation } from "./src/operations/user_operations";

export default async function (email: string): Promise<User> {
  const jsonString = await userOperation.getUserByEmail(email);
  const user: User = jsonParser(jsonString);
  return jsonParser(jsonString);
}
