// Declaration file for expo-router types
// This is needed because @types/expo-router doesn't exist in npm

declare module 'expo-router' {
  export * from 'expo-router/entry';
  export const Router: React.ComponentType<React.ComponentPropsWithoutRef<React.RootViewProps>>;
  export const useRouter: () => {
    replace: (href: string, options?: { })=> void;
    push: (href: string, options?: { })=> void;
    back: () => void;
    navigate: (name: string, params?: { })=> void;
  };
  export const useFocusEffect: (effect: React.EffectCallback) => void;
  export const Link: React.FC<React.PropsWithChildren<{}>>;
  export const Slot: React.FC<React.PropsWithChildren<{}>>;
  export const Stack: React.FC<React.PropsWithChildren<{}>>;
  export const Tabs: React.FC<React.PropsWithChildren<{}>>;
  export const Redirect: React.FC<React.PropsWithChildren<{}>>;
}

declare module 'expo-router/drawer' {
  export * from 'expo-router/drawer';
}