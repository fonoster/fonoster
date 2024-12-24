#!/bin/bash

echo "Copying Prisma clients to dist folders"

mkdir -p mods/identity/dist/generated/@prisma 
mkdir -p mods/apiserver/dist/generated/@prisma

cp -r mods/identity/src/generated/@prisma/client mods/identity/dist/generated/@prisma
cp -r mods/apiserver/src/generated/@prisma/client mods/apiserver/dist/generated/@prisma