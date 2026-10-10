# Padrão dos posts do Instagram · @erisson.alemao.prof

Todo post segue este modelo. Para criar um novo, basta pedir ao Claude, por exemplo:
*"crie um post sobre leis de Newton para sexta às 10h"*. A skill `.claude/skills/post-instagram`
faz o resto: monta os slides neste padrão, gera as imagens e agenda no Metricool.

## Cores por tipo de post (definidas em 03/10/2026)

| Tipo | Classe no `<body>` | Fundo | Destaque |
|---|---|---|---|
| **Física** | nenhuma (padrão) | azul-marinho `#0F1E3C` | vermelho `#E8384F` |
| **Matemática** | `tema-matematica` | caderno claro `#F7F4EA` quadriculado | verde-azulado `#0E8F80` |
| **Informativos** (olimpíadas, datas de prova, avisos) | `tema-informativo` | azul royal `#1E4FA8` | amarelo `#FFC94A` |

Os três seguem o mesmo layout; só as cores mudam. Comparações em `../_teste-cores/`.

## Identidade visual (Física, o padrão)

| Item | Valor |
|---|---|
| Formato | Carrossel 1080 × 1350 px (4:5), JPG |
| Fundo | Azul-quadro `#0F1E3C` com quadriculado sutil e faixa inferior `#24314F` |
| Texto | Branco-papel `#F3F5FA` (secundário `#C9D1E3`) |
| Destaque | Vermelho `#E8384F` (a palavra-chave de cada título) |
| Apoio | Azul-claro `#6FA8C9` |
| Títulos | **Archivo Black** (900), maiúsculas |
| Texto corrido | **Inter** |
| Fórmulas, topo e rodapé | **JetBrains Mono** |
| Topo de cada slide | `// assunto` à esquerda, contador `01/07` à direita |
| Rodapé | ■ `@erisson.alemao.prof` à esquerda, `arrasta →` à direita |

## Tipos de slide (ver `modelo.html` e as prévias `modelo-01.jpg` … `modelo-07.jpg`)

1. **Capa**: pergunta-gancho com a palavra-chave em vermelho e uma ilustração.
2. **Explicação**: título, 2–3 frases e fórmula em cartão branco.
3. **Comparação e dica**: dois cartões lado a lado e uma caixa tracejada com a dica de prova.
4. **Lista de fórmulas**: até 6 por slide, para posts do tipo "salve".
5. **Desafio estilo ENEM**: enunciado, alternativas A–E e "Comenta a letra".
6. **Resposta**: cálculo, pegadinha (o erro mais comum) e bônus.
7. **Chamada final**: salvar, enviar, comentar e seguir.

## Formatos que mais funcionam (pesquisa de concorrentes, set/2026)

- **Pergunta curiosa do dia a dia**: "Por que o lápis parece quebrado na água?"
- **Desafio relâmpago**: "Resolva em 10 segundos"
- **Lista para salvar**: "As fórmulas que você precisa saber pro ENEM"

Sempre ligar o tema ao ENEM e terminar pedindo **comentário**, **salvamento** e **envio**.

## Estrutura das pastas

```
instagram/
  _modelo/              ← este padrão (CSS, fontes, rodapé automático, gerador de imagens)
  AAAA-MM-DD/           ← um diretório por dia de publicação
    nome.html           ← fonte do post (copiado de modelo.html)
    nome-01.jpg …       ← imagens geradas
    legenda-nome.txt    ← legenda com hashtags
```

## Gerar as imagens manualmente

```bash
NODE_PATH=$(npm root -g) node instagram/_modelo/render.js instagram/AAAA-MM-DD/nome.html
```

Precisa do Node com o Playwright/Chromium instalado. As fontes estão em `fonts/`, então não é preciso internet.

## Reels (série "Fenômenos explicados com IA", desde 12/10/2026)

| Item | Valor |
|---|---|
| Formato | Vídeo vertical 1080 × 1920, 30 fps, MP4 (H.264 + AAC), 45 a 60 s |
| Visual | O mesmo da Física (azul-marinho + vermelho), com a etiqueta `FENÔMENOS EXPLICADOS COM IA` no topo |
| Narração | Voz neural pt-BR (Piper "cadu", via sherpa-onnx), gerada offline |
| Legendas | Geradas da própria narração, em blocos curtos, destaque em amarelo |
| Capa | `reel-<nome>-capa.jpg`: a 1ª cena completa, sem legenda |

Arquivos: `reel.css` (layout e zonas seguras), `reel.js` (linha do tempo, animações e legendas),
`render-reel.js` (narração → quadros → MP4) e `tts.py` (síntese e mixagem da voz).
O passo a passo está na skill `.claude/skills/post-instagram`.
