import {User} from "./protos/usermanager_pb";
import {userOperation} from "@fonos/auth";

export default async function (email: string) {
  const result = await userOperation.getUserByEmail(email.toString());
  result.status = User.Status.SUSPENDED.toString();
  await userOperation.updateUserStatus(result.email.toString(), result.status);
  return "completed!";
}
