// Example function
export default async (event: any, context: any) =>
  context.status(200).succeed("Hello world!");
