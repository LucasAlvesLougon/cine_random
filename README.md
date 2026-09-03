# Cine Random - Frontend 🎬

O **Cine Random** é uma aplicação web moderna e PWA (*Progressive Web App*) que permite a usuários e grupos de amigos criar, compartilhar e gerenciar listas de filmes colaborativas, sortear títulos com roleta animada, jogar o *Match da Galera* e gerar convites estilizados de cinema.

Desenvolvido em **React 19** com **Vite**, o frontend possui visual inspirado nas melhores plataformas de streaming (estilo Apple TV / Netflix com Glassmorphism), microinterações com **Framer Motion**, estilos modulares com **CSS Modules** e comunicação em tempo real via **WebSockets autenticados**.

---

## 🚀 Tecnologias Principais

* **React 19** + **Vite**: Performance ultrarrápida e renderização fluida.
* **PWA (Progressive Web App)**: Service Worker com suporte offline e instalação nativa no Android, iOS e Desktop.
* **Framer Motion**: Animações de layout, modal, roleta caça-níqueis a 60 FPS e swipe estilo Tinder no Match.
* **CSS Modules**: Estilização 100% modular, sem vazamento de seletores.
* **Axios & Interceptors**: Injeção automática de token JWT Bearer e tratamento global de erros.
* **WebSockets Autenticados**: Conexão em tempo real vinculada ao token do usuário para sincronização multi-player instantânea.
* **Google OAuth 2.0 (`@react-oauth/google`)**: Autenticação social moderna em 1 clique.
* **Vitest & React Testing Library**: Suíte completa de testes automatizados unitários e de integração (**31/31 testes verdes**).

---

## ✨ Principais Funcionalidades

1. **Multi-Listas Colaborativas:** Crie múltiplas listas ou entre na lista de amigos através de códigos alfanuméricos exclusivos.
2. **Catálogo Inteligente com TMDB & JustWatch:** Busca instantânea com pôsteres em alta resolução, sinopse, trailers embutidos e badges de provedores de streaming (Netflix, Prime Video, Max, Disney+, etc.).
3. **Ordenação Avançada do Catálogo:** Ordene seus filmes por **Adição** (Recentes / Antigos), **Data de Lançamento** (Novos / Clássicos) e **Avaliação TMDB** (Melhores / Piores).
4. **Casting & Ficha Técnica Completa:** Visualização do Diretor e carrossel de elenco principal (Top 8 atores com fotos, nomes e personagens).
5. **Roleta Sorteador & Modo Descoberta:** Sorteie filmes da sua lista ou descubra novos títulos filtrando por gênero, década e streamings.
6. **Modo Match da Galera (Group Swipe):** Jogo de votação rápida estilo Tinder com Framer Motion e detecção instantânea de consenso.
7. **Cartão Visual de Sessão Pipoca:** Gere convites estilizados com pôster, data, local e botão para compartilhamento direto no WhatsApp ou Web Share API.
8. **Histórico de Sorteios & Limpeza:** Registro de todas as sessões anteriores (Roleta e Match) com botão de limpeza de sorteios antigos (+7 dias).
9. **Painel de Membros:** Veja quem está na sala com identificação especial do criador da lista (`👑 Criador da Lista`).
10. **Menu Lateral Retrátil (`SidebarDrawer`):** Acesso rápido a todas as funções, listas e botão de instalação do App.

---

## 🛠️ Como Executar Localmente

```bash
# 1. Instale as dependências
npm install

# 2. Configure o arquivo .env (opcional se rodando com backend local):
# VITE_API_URL=http://localhost:8000
# VITE_GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com

# 3. Inicie o servidor de desenvolvimento
npm run dev

# 4. Executar a suíte de testes automatizados
npm test
```

