// Stub for @react-router/dev to prevent conflicts in Storybook
export default {};
export const reactRouter = () => ({
  name: 'react-router-stub',
  configResolved() {},
  buildStart() {},
  buildEnd() {}
});

