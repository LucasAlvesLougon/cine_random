# Cine Random - Frontend 🎬

[![React 19](https://img.shields.io/badge/React-19.2.8-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2.2-646CFF?logo=vite)](https://vitejs.dev/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-13.1.1-black?logo=framer)](https://www.framer.com/motion/)
[![Vitest](https://img.shields.io/badge/Vitest-31%2F31_Passed-green?logo=vitest)](https://vitest.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple?logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

O **Cine Random** é uma aplicação web moderna e **Progressive Web App (PWA)** voltada para cinéfilos e grupos de amigos. Permite criar, gerenciar e compartilhar listas colaborativas de filmes em tempo real, realizar sorteios interativos na roleta, jogar o *Match da Galera* (estilo Tinder de filmes), gerar convites de cinema para WhatsApp e acompanhar o histórico de sessões.

A interface segue uma estética sofisticada inspirada em plataformas de streaming (Apple TV / Netflix) com Glassmorphism, microinterações a 60 FPS com Framer Motion e estilos modulares com CSS Modules.

---

## 🚀 Tecnologias & Bibliotecas

* **React 19 + Vite:** Renderização fluida, concorrência moderna e build ultrarrápido.
* **PWA (Progressive Web App):** Manifesto web, *Service Worker* com cache da casca da aplicação e modal nativo de instalação no Android, iOS e Desktop.
* **Framer Motion:** Animações físicas e transições de layout suaves na roleta caça-níqueis e no swipe de votação.
* **CSS Modules:** Estilização encapsulada por componente, sem vazamento de escopo global.
* **Axios & Interceptors:** Centralização de chamadas HTTP com injeção automática de token Bearer JWT e renovação.
* **WebSockets Autenticados:** Sincronização multi-player instantânea com passagem de token JWT no handshake.
* **Google OAuth 2.0 (`@react-oauth/google`):** Login social rápido e seguro com Google Identity Services.
* **Vitest + React Testing Library:** Suíte completa de testes automatizados com **31/31 testes aprovados**.

---

## 📁 Estrutura de Diretórios

```
cine_random/src/
├── __tests__/           # Testes unitários e de componentes com Vitest e RTL
├── assets/              # Ícones SVG, logotipos e ilustrações
├── components/          # Componentes visuais organizados por domínio
│   ├── Header.jsx       # Cabeçalho com logo, status e atalho PWA
│   ├── Layout.jsx       # Layout responsivo e casca da aplicação
│   ├── Loading.jsx      # Shimmer / Spinners de carregamento
│   ├── Modal/           # Modais (InfoModal, DrawModal, MatchModal, HistoryModal, etc.)
│   ├── Movies/          # Componentes de Catálogo (MovieList, MovieCard, AddMovieForm)
│   └── Navigation/      # Menu lateral retrátil (SidebarDrawer)
├── contexts/            # Provedores de Estado Global React
│   ├── AuthContext.jsx  # Sessão do usuário, JWT e login Google
│   ├── MoviesContext.jsx# Estado da lista ativa, CRUD de filmes e WebSocket
│   └── ToastContext.jsx # Notificações flutuantes customizadas
├── hooks/               # Custom hooks reutilizáveis (usePwaInstall)
├── services/            # Clientes de comunicação externa
│   ├── api.js           # Instância Axios configurada para a API FastAPI
│   └── tmdb.js          # Integração The Movie Database (busca, trailers, casting)
└── utils/               # Utilitários puros (notificações do navegador, formatações)
```

---

## ✨ Funcionalidades Principais

| Recurso | Descrição |
| :--- | :--- |
| **Multi-Listas Colaborativas** | Crie várias listas ou entre em listas existentes com códigos alfanuméricos (`PIP01`, `VIP01`). |
| **Catálogo com TMDB & JustWatch** | Pôsteres em alta definição, sinopse, trailers embutidos e badges de provedores de streaming. |
| **Ordenação Flexível** | Ordene por **Adição** (Recentes / Antigos), **Lançamento** (Novos / Clássicos) e **Nota TMDB** (Melhores / Piores). |
| **Ficha Técnica & Casting** | Exibição de Diretor e carrossel de elenco principal (Top 8 atores com fotos e personagens). |
| **Roleta Sorteador & Modo Descoberta** | Sorteie filmes da lista ou descubra novos títulos filtrando por gênero, época e streaming. |
| **Modo Match da Galera (Group Swipe)** | Votação estilo Tinder com detecção instantânea de consenso unânime. |
| **Convite Sessão Pipoca** | Cartão estilizado com pôster e botão para compartilhar convite formatado no WhatsApp. |
| **Histórico & Limpeza (+7 dias)** | Registro completo de sorteios anteriores com botão de expurgo de sessões antigas. |
| **Painel de Membros** | Listagem de participantes em tempo real com destaque para o `👑 Criador da Lista`. |
| **PWA Instalável** | Instale diretamente na tela inicial do celular ou desktop com acesso offline. |

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do frontend com as seguintes chaves:

```env
# URL base da API FastAPI (local ou produção)
VITE_API_URL=http://localhost:8000

# Client ID do Google OAuth 2.0 (Google Cloud Console)
VITE_GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com

# Chave de API do TMDB (The Movie Database)
VITE_TMDB_API_KEY=sua_chave_tmdb
```

---

## 🛠️ Comandos do Projeto

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (Vite na porta 5173)
npm run dev

# Executar a suíte de testes automatizados com Vitest
npm test

# Executar o linter (ESLint)
npm run lint

# Gerar build otimizado de produção
npm run build

# Visualizar o build de produção localmente
npm run preview
```


