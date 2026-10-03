---
name: post-instagram
description: Cria e agenda posts de Instagram (carrosséis de Física e Matemática) para @erisson.alemao.prof no padrão visual da casa. Use sempre que o usuário pedir para criar, montar, refazer ou agendar um post, carrossel, legenda ou calendário de posts do Instagram.
---

# Posts do Instagram · @erisson.alemao.prof

Público: estudantes do ensino médio e pré-vestibulandos (ENEM, vestibulares, OBMEP/OBF).
Tom: português do Brasil, informal e direto nas legendas ("pra", "tá", "comenta"); claro e correto nos slides.

## Regras fixas

- **Sempre** use o padrão de `instagram/_modelo/` (leia `README.md` e `modelo.html` antes de começar). Não invente outro visual.
- **Não mencione o site nem "link na bio"** (o site Academia das Exatas ainda não está pronto). Só volte a citar quando o usuário disser que o site está no ar.
- **Cor por tipo de post** (classe no `<body>`):
  - **Física**: `<body>` (azul-marinho + vermelho, o padrão);
  - **Matemática**: `<body class="tema-matematica">` (caderno claro + verde-azulado);
  - **Informativos** (olimpíadas, datas de prova, avisos, calendário): `<body class="tema-informativo">` (azul royal + amarelo).
  Nas ilustrações SVG use as variáveis do tema (`style="stroke:var(--paper)"`, `fill:var(--red)`), nunca cores fixas, para que funcionem nos temas claros.
- O rodapé com `@erisson.alemao.prof` e o contador de slides são automáticos (`chrome.js`). Não os escreva à mão.
- Sem emoji dentro das imagens (as fontes não têm). Emoji só na legenda.
- Texto das imagens na **norma padrão** ("Comente", "Salve", "Não deixe passar", "para o ENEM"). O tom informal ("comenta", "pra", "tá") fica só na legenda.
- Rigor conceitual: prefira a definição que os vestibulares cobram. Exemplo: refração é a **mudança de velocidade** ao trocar de meio, e o desvio só ocorre com incidência oblíqua. Evite generalizações regionais ("no inverno") e verbos imprecisos ("trocaram elétrons" → "elétrons passaram de um material para o outro").
- Ilustrações e gráficos do mesmo slide devem descrever **a mesma situação** (ex.: s × t e v × t do mesmo movimento).
- Valores aproximados levam **≈** (densidade da água, constantes, medidas do dia a dia). Nada de "quase sempre", "sempre", "nunca" sem prova.
- Em geometria, lado do quadrado/triângulo como **ℓ** (o "l" da fonte mono parece "1").
- Revise o sentido das frases de cálculo ("diferença entre cada termo e o anterior", e não "subtraia cada termo do anterior").
- Índices com `<sub>` (ex.: `v<sub>0</sub>`), nunca com os caracteres ₀ ₁ ₂.
- **Confira toda fórmula, número e resposta** antes de gerar. Nada de afirmação exagerada ou não verificável. Na dúvida, escreva de forma mais cautelosa.

## Estrutura de um carrossel (4 a 7 slides)

1. Capa: pergunta-gancho com a palavra-chave em `<em>` (vermelho) e uma ilustração SVG simples.
2. Um a três slides de explicação, diagrama ou lista.
3. Desafio estilo ENEM (alternativas A–E, "Comente a letra antes de ver a resposta").
4. Resposta com pegadinha (o erro mais comum), a não ser que o post seja só uma lista.
5. Chamada final: salvar, enviar, comentar e seguir.

Formatos que mais performam (pesquisa de concorrentes, set/2026): **pergunta curiosa do dia a dia**,
**desafio relâmpago ("Resolva em 10 segundos")** e **lista para salvar**. Num mesmo dia, alterne formatos e matérias.

## Passo a passo

1. Crie `instagram/AAAA-MM-DD/<nome>.html` copiando `instagram/_modelo/modelo.html` e mantenha só os slides usados.
2. Gere as imagens: `NODE_PATH=$(npm root -g) node instagram/_modelo/render.js instagram/AAAA-MM-DD/<nome>.html`.
   Corrija qualquer aviso de texto encostando no rodapé.
3. **Abra e confira cada JPG** (Read). Ajuste sobreposições, quebras ruins de título e espaços vazios.
4. Escreva `instagram/AAAA-MM-DD/legenda-<nome>.txt`:
   gancho com emoji, 1–2 frases de contexto ligando ao ENEM, convite para comentar, 📌 salvar, 📤 enviar,
   "Segue @erisson.alemao.prof pra mais Física e Matemática 🚀" e cerca de 12 hashtags (#fisica ou #matematica, #enem, #enem2026, #vestibular…).
5. Faça commit e push na branch atual e confirme que cada imagem responde 200 em
   `https://raw.githubusercontent.com/erissonalemao10/academia-das-exatas/<branch>/instagram/AAAA-MM-DD/<nome>-NN.jpg`.
6. Agende no Metricool:
   - Marca: `blogId` **7031464**, fuso **America/Sao_Paulo**.
   - Sem horário definido pelo usuário: use `getBestTimeToPostByNetwork` (instagram) e escolha os picos. Nas manhãs de dias úteis, 10h costuma ser o melhor. Depois vêm 12h e 18h.
   - Confira `getScheduledPosts` para não bater horário.
   - `createScheduledPost` com `providers:[{"network":"instagram"}]`, `instagramData:{"type":"POST"}`,
     `media` = URLs raw na ordem dos slides, `text` = legenda, `autoPublish:true`.
   - Publicar é público: agende só quando o usuário tiver pedido o agendamento ou confirmado o horário.
7. Responda com uma tabela (horário, tema, link `plannerUrl`) e as capas (`SendUserFile`).
