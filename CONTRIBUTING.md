# Fluxo de contribuição

## Branches

- `master` representa a versão promovida para produção.
- `dev` é a branch de integração.
- Toda alteração deve começar em uma branch curta baseada em `dev`:
  - `feature/<descricao>` para funcionalidades;
  - `fix/<descricao>` para correções;
  - `chore/<descricao>` para CI/CD, dependências ou documentação.

## Pull requests

1. Crie a branch de trabalho a partir de `dev`.
2. Faça commits pequenos e relacionados a uma única mudança.
3. Abra um Pull Request da branch de trabalho para `dev`.
4. Aguarde o CI passar e a revisão/aprovação antes do merge.
5. Depois do merge em `dev`, o workflow promove automaticamente `dev` para `master`.

Não faça push direto em `dev`. Configure a proteção dessa branch para exigir Pull Request, aprovação e os checks do CI aprovados. `master` é promovida pelo GitHub Actions; se ela também for protegida, permita que o bot do Actions faça essa promoção automática.
