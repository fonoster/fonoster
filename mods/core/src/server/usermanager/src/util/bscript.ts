import bscrypt from 'bcryptjs'
import { userOperation } from '../operations/user_operations'

function encript (password: string) {
  /*const sal: number = 10
  bscrypt.hash(password, sal, (err: Error, passwd: string) => {
    if (err) {
      console.log('Error trying to hash password')
    } else {
      return passwd
    }
  })*/
}

async function descript (userPassword: string, email: string) {
  /*try {
    let user = await userOperation.getUserByEmail(email)
    var password = user.password
  } catch (error) {
    console.error(error)
  }*/

  //return bscrypt.compare(userPassword, password)
}

export { encript, descript }
