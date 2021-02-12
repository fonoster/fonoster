import RoleController from './src/operations/role_operations'
import Role from './src/models/role'

export default async function (role: string, service: string): Promise<boolean> {
    const controller = new RoleController()
    const roles = await controller.getRoles()

    return new Promise((resolve, reject) => {
        try {
            roles.forEach((r:any) => {
                if (r.access.includes(service)) resolve(true)
                resolve(false)
            })
        } catch(e) {
            reject(false)
        }
    })
}
