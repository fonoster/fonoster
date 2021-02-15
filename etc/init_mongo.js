db.createUser({
    user: 'mongo',
    pwd: 'changeit',
    roles: [
        {
            role: 'readWrite',
            db: 'auth'
        }
    ]
})
