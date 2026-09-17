// Type declarations for expo-router (SDK 57 npm package lacks generated .d.ts files)
declare module 'expo-router' {
  import React from 'react';

  export const Stack: React.ComponentType<any> & { Screen: React.ComponentType<any> };
  export const Tabs: React.ComponentType<any> & { Screen: React.ComponentType<any> };
  export const Slot: React.ComponentType<any>;
  export const Link: React.ComponentType<any>;
  export const Redirect: React.ComponentType<any>;

  export interface Router {
    push: (href: any) => void;
    replace: (href: any) => void;
    back: () => void;
    canGoBack: () => boolean;
    setParams: (params: any) => void;
    navigate: (href: any) => void;
    dismiss: (count?: number) => void;
    dismissAll: () => void;
  }

  export const router: Router;
  export const useRouter: () => Router;
  export const useLocalSearchParams: <T = any>() => T;
  export const useGlobalSearchParams: <T = any>() => T;
  export const usePathname: () => string;
  export const useSegments: () => string[];
  export const useNavigation: () => any;
  export const useFocusEffect: (effect: () => void | (() => void)) => void;
  export const ErrorBoundary: React.ComponentType<any>;
}

declare module 'expo-router/drawer' {
  import React from 'react';
  export const Drawer: React.ComponentType<any> & { Screen: React.ComponentType<any> };
}