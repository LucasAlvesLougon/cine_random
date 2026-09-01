# Cine Random - Frontend 🎬

O **Cine Random** é uma aplicação web moderna que permite a usuários criar, compartilhar e gerenciar listas de filmes para assistir, com direito a um sorteador estilo "roleta" animado.

Este é o frontend da aplicação, desenvolvido em **React** e **Vite**, com estilos focados em **CSS Modules** e animações usando **Framer Motion**. Inicialmente a persistência era feita via Firebase, mas agora o projeto migrou 100% para se comunicar com uma API própria via **Axios** e **WebSockets**.

## Tecnologias Principais
- **React 19** + **Vite**
- **CSS Modules** (Estilos super isolados e modernos)
- **Framer Motion** (Animação do sorteio e modais)
- **Axios** (Integração otimizada com a API Backend)
- **WebSockets** (Para sincronização em tempo real das listas compartilhadas)
- **Google OAuth** (`@react-oauth/google`) para login social moderno e sem fricções

## Funcionalidades
- Criação e personalização de listas de filmes compartilháveis (através de códigos exclusivos).
- Busca e adição de filmes utilizando dados ricos em tempo real vindos do **TMDB** (The Movie Database).
- Indicação das plataformas de streaming onde o filme sorteado está disponível (Netflix, Prime, Max, etc).
- Sorteador de filmes interativo.
- Atualização em tempo real da lista: Se seu amigo riscar um filme da lista na casa dele, sua tela se atualiza sozinha no mesmo instante!

## Como Executar

```bash
# 1. Instale as dependências do projeto
npm install

# 2. Inicie o servidor de desenvolvimento
npm run dev
```

Lembre-se de configurar as variáveis de ambiente necessárias (`VITE_API_URL` caso o backend não esteja no `localhost`).
