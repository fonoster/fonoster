import { useEffect } from "react";
import { useTableContext } from "../useTableContext";

export interface User {
    id: number;
    name: string;
    email: string;
  }

  const data: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Doe', email: 'jane@example.com' },
    { id: 3, name: 'Bob Smith', email: 'bob@example.com' },
    { id: 4, name: 'Alice Johnson', email: 'alice@example.com' },
    { id: 5, name: 'David Brown', email: 'david@example.com' },
  ];

const QueryUsers = () => {
    const { setData } = useTableContext<User>();

    useEffect(() => {
        setData(data);
    }, [data]);

    return null;
};
export default QueryUsers;