# Guia Prático e Dicas para a Prova

Este arquivo contém todos os comandos para testar seu app (como fazer o QR Code aparecer para a câmera), os comandos de instalação e um grande resumo de todas as dicas que o professor deu em aula!

---

## 🚀 1. Comandos Essenciais

### Testar a Câmera / Mostrar o QR Code
Para rodar a aplicação, abrir o terminal e gerar o **QR Code** que você escaneia com o app do Expo Go no celular, use o comando:
```bash
npx expo start -c
```
*(A flag `-c` serve para limpar o cache e evitar erros).*

### Criação de Projeto (Se ele mandar criar do zero)
```bash
npx create-expo-app@latest nome_do_projeto
```

### Instalar o Jest para Testes (na versão certa)
```bash
npm install jest@29 @types/jest@29 -D --legacy-peer-deps
```

### Rodar os Testes
```bash
npx jest
```

---

## 🧠 2. Dicas de Ouro do Professor

1. **Frontend e Telas:** Você vai ter que saber montar as telas e as navegações em Tabs (abas). O problema que ele vai dar provavelmente envolverá consertar ou adicionar algo aqui.
2. **Entidades e Value Objects:**
   - **Value Object:** Ele citou o `Coordinates`. Você tem que saber fazer e testar a validação dele (Latitude tem que ser entre `-90` e `90` e Longitude entre `-180` e `180`).
   - **Entidade:** Precisa saber modelar uma entidade, com agregações e validações (ex: validação da foto).
3. **Casos de Uso (Use Cases):**
   - Vão cair até 2 casos de uso.
   - Eles recebem o repositório como dependência através do construtor (`constructor(private readonly repository...)`).
   - É dentro deles que você usa bibliotecas externas e executa a regra da aplicação, orquestrando as entidades.
4. **Infra e Banco de Dados (Singleton):**
   - O professor mandou usar uma "Infraestrutura na memória", ou seja, usar um Array `private observations = []` em vez de um banco de dados real.
   - Você vai criar a classe com `implements InterfaceDaEntidade` e criar os métodos de salvar e buscar nela.
   - **IMPORTANTE:** Ela DEVE ser **Singleton**. Isso significa: 
     1) `private constructor()`
     2) Uma variável `private static instance`
     3) Um método `public static getInstance()`
5. **Container (Factory):**
   - O `container.ts` é quem junta o repositório com o caso de uso.
   - Também é Singleton. Nele você define, por exemplo, que o `RegisterObservation` vai de fato utilizar o `InMemoryObservationRepository`.
6. **Lógica da Câmera:**
   - No `index.tsx` fica a câmera para tirar a foto.
   - Preste atenção aos botões: O clique que cancela a foto passa uma "arrow function" `onPress={() => setUri(null)}`, mas o botão de salvar chama uma função de verdade `onPress={savePhoto}`. Ele quer que você entenda por que cada um é usado.
   - Ao invés de salvar no celular da pessoa (galeria), você salva a string da URI da foto lá no repositório através do caso de uso.
7. **Testes Unitários:**
   - Ele vai cobrar os testes de *Value Object* e *Entidade*.
   - No `Coordinates` (Value Object), ele disse que vai ter uns 3 testes (`expects`).
   - O arquivo de testes da observação pode se chamar `Observation.tests.ts`. Pode ser útil criar uma função "helper" `makeCoords` pra facilitar.
   - Você usará o `describe("Observation Entity", () => { ... })`.

---

## ⚙️ 3. Arquivos de Configuração

Caso você precise configurar tudo do zero, aqui estão os arquivos vitais.

### `jest.config.js`
Crie este arquivo na raiz do projeto:
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', '<rootDir>/tests/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
  ]
};
```

### `tests/setup.ts`
Crie uma pasta `tests` na raiz e crie esse arquivo dentro dela:
```typescript
import '@testing-library/jest-native/extend-expect';

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
```

### `package.json`
*(Certifique-se de não apagar o seu original, apenas compare com este se der erro de dependência. Especialmente útil na parte de `devDependencies` e `scripts`)*
```json
{
  "name": "ecofield",
  "main": "expo-router/entry",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "reset-project": "node ./scripts/reset-project.js",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "expo lint"
  },
  "dependencies": {
    "@expo/vector-icons": "^15.0.3",
    "@react-navigation/bottom-tabs": "^7.4.0",
    "@react-navigation/drawer": "^7.13.8",
    "@react-navigation/elements": "^2.6.3",
    "@react-navigation/native": "^7.1.8",
    "expo": "~54.0.35",
    "expo-camera": "~17.0.10",
    "expo-constants": "~18.0.13",
    "expo-crypto": "~15.0.9",
    "expo-font": "~14.0.12",
    "expo-haptics": "~15.0.8",
    "expo-image": "~3.0.11",
    "expo-linking": "~8.0.12",
    "expo-location": "~19.0.8",
    "expo-media-library": "~18.2.1",
    "expo-router": "~6.0.24",
    "expo-splash-screen": "~31.0.13",
    "expo-status-bar": "~3.0.9",
    "expo-symbols": "~1.0.8",
    "expo-system-ui": "~6.0.9",
    "expo-web-browser": "~15.0.11",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-maps": "1.20.1",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-web": "~0.21.0",
    "react-native-worklets": "0.5.1"
  },
  "devDependencies": {
    "@testing-library/jest-native": "^5.4.3",
    "@testing-library/react-native": "^14.0.1",
    "@types/jest": "^29.5.14",
    "@types/react": "~19.1.0",
    "eslint": "^9.25.0",
    "eslint-config-expo": "~10.0.0",
    "jest": "^29.7.0",
    "jest-expo": "^57.0.4",
    "react-test-renderer": "^19.2.8",
    "test-renderer": "^1.2.0",
    "ts-jest": "^29.4.12",
    "typescript": "~5.9.2"
  },
  "private": true
}
```
