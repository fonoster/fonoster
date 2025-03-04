# Fonoster WebUI

Fonoster WebUI is a modern and powerful user interface for the Fonoster platform, built with Next.js and Material UI. This application provides an intuitive user experience for managing Fonoster resources, with a robust authentication system and a scalable architecture.

## Main Features

- **Complete Authentication**: Support for credential and OAuth (GitHub) login
- **Session Management**: Automatic handling of JWT tokens with renewal
- **SDK Integration**: Direct connection with the Fonoster SDK
- **Modern Interface**: UI components based on Material UI
- **Responsive Experience**: Adaptive design for mobile and desktop devices
- **Storybook Development**: Documented component library

## Project Structure

```
fonoster-webui/
├── .storybook/         # Storybook configuration
├── public/             # Static files
├── src/
│   ├── common/         # Shared code
│   │   ├── components/ # Reusable components
│   │   ├── contexts/   # React contexts
│   │   ├── hooks/      # Custom hooks
│   │   ├── sdk/        # Fonoster SDK integration
│   │   └── utils/      # Utilities
│   ├── components/     # Application-specific components
│   ├── pages/          # Next.js pages
│   ├── stories/        # Storybook stories
│   └── types/          # Type definitions
├── theme/              # Theme configuration
└── ...
```

## OAuth Configuration

## Environment Variables

The application uses a centralized OAuth configuration system. All OAuth-related environment variables are managed through a single configuration module.

### Base OAuth Configuration
```env
# Frontend URL (used for callback construction)
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# OAuth Callback Path (used for all OAuth providers)
NEXT_PUBLIC_OAUTH_REDIRECT_URI=/oauth/callback
```

### GitHub OAuth Configuration
```env
# GitHub Client ID from OAuth App
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id_here

# GitHub OAuth Base URL
NEXT_PUBLIC_GITHUB_URL=https://github.com/login/oauth/authorize

# Sign In Configuration
NEXT_PUBLIC_GITHUB_SIGNIN_REDIRECT_URI=/workspace  # Post-signin redirect
NEXT_PUBLIC_GITHUB_SIGNIN_SCOPE=read:user         # Signin permissions

# Sign Up Configuration
NEXT_PUBLIC_GITHUB_SIGNUP_REDIRECT_URI=/workspace # Post-signup redirect
NEXT_PUBLIC_GITHUB_SIGNUP_SCOPE=user:email       # Signup permissions
```

## OAuth Implementation

The application uses a centralized OAuth configuration system located in `src/config/oauth.ts`. This provides:

- Unified configuration for all OAuth providers
- Shared base configuration
- Specific configurations for signin and signup flows
- Type-safe configuration objects

### Usage Example

```typescript
import { OAUTH_CONFIG } from '@/config/oauth';

// For signin
const signinConfig = OAUTH_CONFIG.signin;

// For signup
const signupConfig = OAUTH_CONFIG.signup;
```

### Configuration Structure

The OAuth configuration is structured as follows:

```typescript
const BASE_OAUTH_CONFIG = {
    clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
    redirectUriCallback: process.env.NEXT_PUBLIC_FRONTEND_URL! + process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI!,
    authUrl: process.env.NEXT_PUBLIC_GITHUB_URL!,
};

export const OAUTH_CONFIG = {
    signin: {
        ...BASE_OAUTH_CONFIG,
        redirectUri: process.env.NEXT_PUBLIC_GITHUB_SIGNIN_REDIRECT_URI!,
        scope: process.env.NEXT_PUBLIC_GITHUB_SIGNIN_SCOPE!,
    },
    signup: {
        ...BASE_OAUTH_CONFIG,
        redirectUri: process.env.NEXT_PUBLIC_GITHUB_SIGNUP_REDIRECT_URI!,
        scope: process.env.NEXT_PUBLIC_GITHUB_SIGNUP_SCOPE!,
    }
};
```

## OAuth Flow

1. User initiates OAuth flow (signin/signup)
2. Application redirects to provider with appropriate configuration
3. Provider redirects back to `/oauth/callback`
4. Callback handler processes authentication
5. User is redirected to appropriate destination

## Important Notes

- The callback URL (`/oauth/callback`) must be registered in your OAuth provider application
- Different scopes are used for signin and signup to request appropriate permissions
- All redirects are handled through the centralized callback handler
- Environment variables must be properly set in production

## Code Improvements

### 1. Authentication System

- **AuthClient**: Robust implementation following best practices
- **Token Management**: Automatic validation and renewal of JWT tokens
- **Cookie Handling**: Centralized system for cookie management

### 2. SDK Configuration

- **WebClient Interface**: Typed extension of the Fonoster SDK client
- **Client Initialization**: Optimized configuration
- **Error Handling**: Robust system for capturing and managing errors

### 3. Code Organization

- **Utility Modules**: Specific functions for tokens and cookies
- **Documentation**: JSDoc comments on all main methods
- **Naming Conventions**: Standardized nomenclature

### 4. Performance

- **Memoization**: Use of useCallback and useMemo for optimization
- **State Management**: Prevention of unnecessary re-renders
- **Session Verification**: Optimization of authentication checks

### 5. Type Safety

- **TypeScript**: Robust interfaces for type safety
- **Error Handling**: Type checking in errors
- **Null Safety**: Checks to prevent runtime errors

## Using the Authentication System

```tsx
import { useFonosterClient } from '@/common/sdk/hooks/useFonosterClient';

function MyComponent() {
  const { 
    client, 
    isReady, 
    isAuthenticated, 
    authentication 
  } = useFonosterClient();

  // Use the client and authentication methods
  // ...
}
```

## Best Practices

1. Always check `isReady` before using the client
2. Use `authentication.executeWithRefresh` for authenticated operations
3. Handle errors with try/catch blocks
4. Check `isAuthenticated` to determine if the user is logged in

## Next.js Basic Concepts

Next.js is a React framework that offers:

### File System Based Routing

- Each file in `pages/` automatically becomes a route
- Files like `pages/about.tsx` generate the `/about` route
- Nested folders like `pages/blog/[slug].tsx` generate dynamic routes

### Hybrid Rendering

- **Static Site Generation (SSG)**: Pages generated at build time
- **Server-Side Rendering (SSR)**: Rendering on each request
- **Client-Side Rendering**: Rendering in the browser
- **Incremental Static Regeneration**: Updating static pages

### Automatic Optimization

- **Images**: `Image` component for automatic optimization
- **Fonts**: Optimization and loading of web fonts
- **Scripts**: Optimized JavaScript loading

### API Routes

- Serverless API endpoints in `pages/api/`
- Ideal for creating APIs without needing a separate server

## Getting Started

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Configure environment variables:

```
# Copy the example file
cp .env.example .env.local

# Edit variables according to your environment
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development with Storybook

To develop and test components in isolation:

```bash
npm run storybook
# or
yarn storybook
```

Open [http://localhost:6006](http://localhost:6006) to see the component library.

## Deployment

### Deployment on Vercel

The easiest way to deploy this application is to use [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme):

1. Import your repository to Vercel
2. Configure environment variables
3. Deploy

### Manual Deployment

To build the application for production:

```bash
npm run build
# or
yarn build
```

Then, start the production server:

```bash
npm run start
# or
yarn start
```

## Next.js Resources

- [Next.js Documentation](https://nextjs.org/docs) - Features and API
- [Next.js Tutorial](https://nextjs.org/learn-pages-router) - Interactive tutorial
- [Next.js Repository](https://github.com/vercel/next.js) - Source code and contributions

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
