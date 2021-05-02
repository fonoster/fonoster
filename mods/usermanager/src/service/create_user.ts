import {User} from "./protos/usermanager_pb";
import {userOperation} from "@fonos/auth";
import objectid from "objectid";

export default async function (user: User): Promise<User> {
  user.setAccessKeyId(objectid().toString());
  user.setStatus(User.Status.ACTIVE);
  user.setRole("USER");
  user.setCreateTime(new Date().toString());
  user.setUpdateTime(new Date().toString());
  await userOperation.saveUser(user.toObject());
  return user;
}
