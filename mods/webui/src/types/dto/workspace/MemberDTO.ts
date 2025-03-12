import { User } from "@fonoster/types";

export type MemberDTO = Omit<{
  ref: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
} & Partial<User>, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};
