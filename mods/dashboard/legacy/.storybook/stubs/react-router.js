// Stub for React Router to prevent conflicts in Storybook
export default {};

export const useNavigate = () => () => {};
export const useLocation = () => ({ 
  pathname: '/', 
  search: '', 
  hash: '', 
  state: null, 
  key: 'default' 
});
export const useSearchParams = () => [new URLSearchParams(), () => {}];
export const useSubmit = () => () => {};
export const Outlet = () => null;
export const Links = () => null;
export const Meta = () => null;
export const Scripts = () => null;
export const ScrollRestoration = () => null;
export const useMatches = () => [];
export const useRouteError = () => null;
export const isRouteErrorResponse = () => false;
export const useParams = () => ({ workspaceId: 'storybook-workspace-id' });

