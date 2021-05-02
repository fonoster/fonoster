import {userOperation} from "@fonos/auth";
import {User} from "./protos/usermanager_pb";
import jsonParser from "./json_parser";

export default async function (email: string): Promise<User> {
  const jsonString = await userOperation.getUserByEmail(email);
  return jsonParser(jsonString);
}
