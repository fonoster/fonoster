export const ErrorLayout = ({ errorCode }: { errorCode: number }) => {
  const errorMessage =
    errorCode === 404 ? "Page not found" : "Something went wrong";

  return (
    <div className="error-layout">
      <code>
        <p>{errorMessage}</p>
        <p>Please try again later.</p>
      </code>
    </div>
  );
};
