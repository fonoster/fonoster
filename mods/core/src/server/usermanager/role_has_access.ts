import RoleController from './src/operations/role_operations'

export default async function (
  role: string,
  service: string
): Promise<boolean> {
  const controller = new RoleController()
  const roles = await controller.getRoles({
    role: role,
    access: [service]
  })

  return new Promise((resolve, reject) => {
    try {
      if (!roles || roles.length == 0) resolve(false)
      resolve(true)
    } catch (e) {
      reject(false)
    }
  })
}
