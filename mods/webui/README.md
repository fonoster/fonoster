# Fonoster WebUI

Fonoster WebUI is a modern and powerful user interface for the Fonoster platform, built with Next.js and Material UI. This application provides an intuitive user experience for managing Fonoster resources, with a robust authentication system and a scalable architecture.

## Main Features

- **Complete Authentication**: Support for credential and OAuth (GitHub) login
- **Session Management**: Automatic handling of JWT tokens with renewal
- **SDK Integration**: Direct connection with the Fonoster SDK
- **Modern Interface**: UI components based on Material UI
- **Responsive Experience**: Adaptive design for mobile and desktop devices
- **Storybook Development**: Documented component library

## Getting Started

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Configure environment variables:

```bash
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

## Configuration

### Environment Variables

The application uses a centralized configuration system. Configure these variables in your `.env.local`:

```env
# Frontend URL
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# OAuth Configuration
NEXT_PUBLIC_OAUTH_REDIRECT_URI=/oauth/callback
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_GITHUB_URL=https://github.com/login/oauth/authorize
NEXT_PUBLIC_GITHUB_SIGNIN_REDIRECT_URI=/workspace
NEXT_PUBLIC_GITHUB_SIGNIN_SCOPE=read:user
NEXT_PUBLIC_GITHUB_SIGNUP_REDIRECT_URI=/workspace
NEXT_PUBLIC_GITHUB_SIGNUP_SCOPE=user:email
```

## Development Tools

### Development with Storybook

To develop and test components in isolation:

```bash
npm run storybook
# or
yarn storybook
```

Open [http://localhost:6006](http://localhost:6006) to see the component library.


## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Project Structure

```
fonoster-webui/
├── .next/              # Next.js build output
├── .storybook/         # Storybook configuration
├── .vscode/           # VS Code configuration
├── docs/              # Project documentation
├── node_modules/      # Dependencies
├── public/            # Static files
├── src/
│   ├── common/        # Shared code and components
│   ├── config/        # Configuration files
│   ├── pages/         # Next.js pages
│   │   ├── signin/    # Authentication pages
│   │   ├── signup/    # Registration pages
│   │   ├── oauth/     # OAuth handling
│   │   ├── workspace/ # Main application workspace
│   │   ├── personal/  # User profile settings
│   │   ├── reset-password/ # Password reset flow
│   │   ├── forgot-password/ # Password recovery
│   │   ├── reset/     # Password reset confirmation
│   │   ├── _app.tsx   # Main application wrapper
│   │   ├── _document.tsx # Custom document component
│   │   ├── _error.tsx # Error handling page
│   │   └── 404.tsx    # Custom 404 page
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   └── middleware.ts  # Next.js middleware
├── stories/           # Storybook stories
├── theme/             # Theme configuration
├── .env              # Environment variables
├── .env.example      # Example environment variables
├── .env.local        # Local environment variables
├── next.config.ts    # Next.js configuration
├── package.json      # Project dependencies and scripts
├── postcss.config.mjs # PostCSS configuration
├── tsconfig.json     # TypeScript configuration
└── vite.config.ts    # Vite configuration
```

## Core Concepts

### Authentication System

```typescript
import { useFonosterClient } from '@/common/sdk/hooks/useFonosterClient';

function MyComponent() {
  const { 
    client, 
    isReady, 
    isAuthenticated, 
    authentication 
  } = useFonosterClient();

  // Use the client and authentication methods
}
```

Best Practices:
1. Always check `isReady` before using the client
2. Use `authentication.executeWithRefresh` for authenticated operations
3. Handle errors with try/catch blocks
4. Check `isAuthenticated` to determine if the user is logged in

### Next.js Integration

1. **File System Based Routing**:
   - Each file in `pages/` automatically becomes a route
   - Files like `pages/about.tsx` generate the `/about` route
   - Nested folders like `pages/blog/[slug].tsx` generate dynamic routes

2. **Hybrid Rendering**:
   - Static Site Generation (SSG)
   - Server-Side Rendering (SSR)
   - Client-Side Rendering
   - Incremental Static Regeneration

3. **API Routes**:
   - Serverless API endpoints in `pages/api/`
   - Ideal for creating APIs without a separate server

## Development Guides

### Form Creation Guide

This guide explains how to create forms following the project's standard structure.

#### Form Structure

```
src/pages/workspace/[workspaceId]/your-feature/
├── _components/
│   └── form/
│       └── YourFeatureForm.tsx    # Main form component
├── [id].tsx                       # Edit page
└── new.tsx                        # Create page
```

#### Available Components

1. **Layout Components** (`@/common/components/layout/pages`):
   - `PageContainer`: Main wrapper for all forms
   - `PageContainer.Header`: Page title and actions
   - `PageContainer.Subheader`: Form description
   - `PageContainer.ContentForm`: Form content wrapper

2. **Form Fields** (`@/common/hooksForm/`):
   - `InputContext`: Text input fields
   - `SelectContext`: Dropdown select fields
   - `TextAreaContext`: Multiline text fields
   - `CheckboxContext`: Checkbox fields
   - `RadioContext`: Radio button groups
   - `DatePickerContext`: Date selection fields

3. **Validation** (`@hookform/resolvers/zod`):
   - Uses Zod for schema validation
   - Located in each form component
   - Defines form field rules and types

#### Best Practices

1. **Form Organization**:
   - Keep forms in `_components/form/` directory
   - Use consistent naming conventions
   - Separate business logic from UI

2. **State Management**:
   - Track loading, error, and success states
   - Handle form submission status
   - Manage API interactions
   - Use notifications for user feedback (see Notifications System section)

3. **User Experience**:
   - Show clear validation messages
   - Provide loading indicators
   - Display success/error notifications
   - Enable form navigation

4. **Type Safety**:
   - Use TypeScript interfaces
   - Implement Zod schemas
   - Export form data types

### Notifications System

The project provides a unified way to display notifications using the `useNotification` hook.

#### Usage Example:

```typescript
import { useNotification } from "@/common/hooks/useNotification";

function YourComponent() {
  const { 
    notifySuccess, 
    notifyError, 
    notifyWarning, 
    notifyInfo,
    NotificationComponent 
  } = useNotification();

  // Show success message
  notifySuccess("Operation completed successfully");

  return (
    <>
      <NotificationComponent />
      {/* Your component content */}
    </>
  );
}
```

#### Available Methods:

1. **notifySuccess**: Green background, auto-hides after 6 seconds
2. **notifyError**: Handles error objects with code and message
3. **notifyWarning**: Yellow/orange background for alerts
4. **notifyInfo**: Blue background for general notifications

#### Customization Options:

```typescript
interface NotificationOptions {
  title?: string;              // Optional header text
  message: string;             // Main notification message
  type?: "success" | "error" | "warning" | "info";
  duration?: number;           // Time in milliseconds
  position?: {                 // Notification position
    vertical: "top" | "bottom";
    horizontal: "left" | "center" | "right";
  };
  showIcon?: boolean;          // Show/hide status icon
  autoHide?: boolean;          // Auto-dismiss notification
  customStyle?: {              // Custom styling
    backgroundColor?: string;
    color?: string;
  };
  onClose?: () => void;        // Close callback
  showCountdown?: boolean;     // Show countdown timer
  countdownDuration?: number;  // Countdown time in seconds
}
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Tutorial](https://nextjs.org/learn-pages-router)
- [Next.js Repository](https://github.com/vercel/next.js)
