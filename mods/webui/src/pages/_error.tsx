import { NextPage } from "next";

interface ErrorProps {
  statusCode?: number;
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <p>
      {statusCode
        ? `Un error ${statusCode} ocurrió en el servidor`
        : "Un error ocurrió en el cliente"}
    </p>
  );
};

export default Error;
