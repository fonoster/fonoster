import { User } from '@fonoster/types';

export type MemberDTO = {
    ref: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt: string;
} & Partial<User>;