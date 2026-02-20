# React + Vite

Questo template fornisce un setup minimale per far funzionare React in Vite con HMR e alcune regole ESLint.

Al momento, sono disponibili due plugin ufficiali:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) usato in [rolldown-vite](https://vite.dev/guide/rolldown)) per il Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) per il Fast Refresh

## React Compiler

Il React Compiler non è abilitato su questo template a causa del suo impatto sulle prestazioni di sviluppo e build. Per aggiungerlo, consulta [questa documentazione](https://react.dev/learn/react-compiler/installation).

## Espansione della configurazione ESLint

Se stai sviluppando un'applicazione di produzione, ti consigliamo di utilizzare TypeScript con regole di linting type-aware abilitate. Dai un'occhiata al [template TS](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) per informazioni su come integrare TypeScript e [`typescript-eslint`](https://typescript-eslint.io) nel tuo progetto.
