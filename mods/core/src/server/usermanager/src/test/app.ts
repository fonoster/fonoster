import express from 'express'
import connect from '../util/database'
import { userOperation } from '../operations/UserOperation'
import user from '../models/user'

import { roleController } from '../operations/RoleOperation'
import role from '../models/role'

import deleteUser from '../../delete_user'
import createUser from '../../create_user'
import jsonParse from '../../json_parser'

import { reset } from 'sinon'
import { User } from '../../../protos/usermanager_pb'

import listUsers from '../../list_user'
import { list } from 'tar'

import { encript, descript } from '../util/bscript'

const db = 'mongodb://localhost:27017/db'

async function main () {
  const app = express()
  connect({ db })

  app.listen(3000)
  console.log('Server on port', 3000)
  const pp = descript('qwerwwty04', 'wardner@fonoster.com')
  console.log(pp)
}

// const obj =
//   {
//     firstname : "Richard",
//     lastname : "Hernandez",
//     username : "rihernandez",
//     email :  "rhc921005gmail.com",
//     password : "qwert03",
//     roles : "6021ab12ae5c760faad90b91",
//     create_time : "2020202",
//     update_time : "2020202",
//     status : "ACTIVE"
// }

// createUser(jsonParse(JSON.stringify(obj)));

//userController.getUsers();
//userOperation.getUserByEmail("rhc221004@gmail.com");
//userController.updateUser();
//userController.updateUserByEmail();
//userController.deleteUser();
//userController.deleteUserByEmail();
//userOperation.saveUser(obj);
//userController.deleteUser("rihernandez@gmail.com");
//roleController.createRole({role:"USER_ROLE", description:"normal"});

//deleteUser("rh204gmail.com");

//userOperation.getUserByEmail("rh204gmail.com");

/*
export const listServices = () => {
  var res = consul.agent.service.list((err, result) => {
    if (err) throw err;
    return result;
  });

  console.log(res);
  return res
}

let res : any
export const listServices = () => {
  res = consul.agent.service.list((err, result) => {
    if (err) throw err;
    return result;
  });

  console.log(res);
  return res
}





*/

// encript("Qwerty04");
main()
