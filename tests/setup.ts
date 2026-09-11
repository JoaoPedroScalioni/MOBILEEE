import '@testing-library/jest-native/extend-expect';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock @expo/vector-icons para evitar warnings de act(...) por carregamento assíncrono de fontes nos testes
jest.mock('@expo/vector-icons', () => {
    const React = require('react');
    const { Text } = require('react-native');
    const MockIcon = (props: any) => React.createElement(Text, props, props.name);

    return {
        Ionicons: MockIcon,
        MaterialIcons: MockIcon,
        FontAwesome: MockIcon,
        Feather: MockIcon,
        AntDesign: MockIcon,
        Entypo: MockIcon,
    };
});

// Mock expo-crypto para testes unitários dos use cases
jest.mock('expo-crypto', () => ({
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2, 9),
}));

// Mock expo-secure-store: armazenamento cifrado em memória (comportamento idêntico ao Keychain/Keystore no teste)
jest.mock('expo-secure-store', () => {
    const store = new Map<string, string>();
    return {
        setItemAsync: jest.fn(async (key: string, value: string) => { store.set(key, value); }),
        getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
        deleteItemAsync: jest.fn(async (key: string) => { store.delete(key); }),
    };
});

// Mock react-native-safe-area-context para os testes de tela
jest.mock('react-native-safe-area-context', () => {
    const React = require('react');
    const { View } = require('react-native');
    const MockSafeAreaView = (props: any) => React.createElement(View, props);
    return {
        SafeAreaView: MockSafeAreaView,
        SafeAreaProvider: ({ children }: any) => children,
        useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
        initialWindowMetrics: { frame: { x: 0, y: 0, width: 400, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } },
    };
});

// Mock expo-router para os testes de tela (navegação não é exercitada de verdade)
jest.mock('expo-router', () => ({
    router: {
        replace: jest.fn(),
        push: jest.fn(),
        back: jest.fn(),
        navigate: jest.fn(),
    },
    useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn(), navigate: jest.fn() }),
    useFocusEffect: (callback: () => void) => callback(),
    Link: (props: any) => props.children,
    Slot: ({ children }: any) => children,
    Stack: ({ children }: any) => children,
    Tabs: ({ children }: any) => children,
    Redirect: () => null,
}));