"""Gera a página "Agenda manual": os posts para agendar à mão no Instagram e no YouTube,
com miniaturas, links para as imagens e vídeos em tamanho real, legendas com botão de copiar
e uma caixa "Agendado" por post.

  python3 instagram/_modelo/agenda-manual.py instagram/agenda-manual-AAAA-MM-DD.json <pasta de saída>

Saída: <pasta>/agenda-manual.html e as miniaturas em <pasta>/t/. Publique a página como
artifact com as miniaturas (`files`, caminhos `t/...`). Os links apontam para o GitHub no
commit indicado no JSON, então os arquivos precisam já estar enviados (git push).

O JSON tem: periodo, subtitulo, commit, nota (HTML), dias [[data, rótulo, observação]],
posts [[data, hora, tipo, nome]] com tipo car (carrossel), reel ou yt (YouTube Short),
e youtube {nome do reel: {ep, title, body, desafio, hashtags, tags}}.
"""
import glob, html, json, os, sys
from PIL import Image

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TIPO = {"car": ("Instagram", "carrossel"), "reel": ("Instagram", "reel"), "yt": ("YouTube", "Short")}
YT_FOOT = ("🔔 Inscreva-se para ver o próximo fenômeno explicado.\n📺 Fenômenos explicados · episódio {ep}\n"
           "Física e Matemática para o ENEM, vestibulares e olimpíadas. No Instagram: @erisson.alemao.prof")

cfg = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
os.makedirs(f"{OUT}/t", exist_ok=True)
RAW = f"https://raw.githubusercontent.com/erissonalemao10/academia-das-exatas/{cfg['commit']}/instagram/"
e = lambda s: html.escape(s, quote=True)
files = set()


def thumb(date, fname, w=240):
    key = f"t/{date}-{fname}"
    im = Image.open(f"{REPO}/instagram/{date}/{fname}").convert("RGB")
    im.thumbnail((w, w * 2))
    im.save(f"{OUT}/{key}", quality=72, optimize=True)
    files.add(key)
    return key


def copy_block(cid, label, text, extra=""):
    return (f'<div class="copy {extra}"><div class="copy-head"><span class="lbl">{e(label)}</span>'
            f'<button type="button" class="btn-copy" data-target="{cid}">Copiar</button></div>'
            f'<div class="copy-text" id="{cid}">{e(text)}</div></div>')


cards = {d[0]: [] for d in cfg["dias"]}
for i, (date, hora, tipo, nome) in enumerate(cfg["posts"]):
    pid = f"p{i:02d}"
    rede, fmt = TIPO[tipo]
    base = RAW + date + "/"
    body = []
    if tipo == "car":
        imgs = sorted(os.path.basename(p) for p in glob.glob(f"{REPO}/instagram/{date}/{nome}-[0-9][0-9].jpg"))
        cap = open(f"{REPO}/instagram/{date}/legenda-{nome}.txt").read().strip()
        titulo = cap.split("\n")[0]
        strip = "".join(
            f'<a class="th" href="{base}{f}" target="_blank" rel="noopener"><img src="{thumb(date, f)}" alt="Slide {n}" width="96" height="120" loading="lazy"><span>{n}</span></a>'
            for n, f in enumerate(imgs, 1))
        body.append(f'<p class="hint">{len(imgs)} imagens, nesta ordem. Toque numa imagem para abrir em tamanho real e salvar.</p>')
        body.append(f'<div class="strip">{strip}</div>')
        body.append(copy_block(f"{pid}-cap", "Legenda", cap))
    else:
        capa = f"{nome}-capa.jpg"
        body.append(f'<div class="media"><a class="th tall" href="{base}{capa}" target="_blank" rel="noopener"><img src="{thumb(date, capa, 200)}" alt="Capa" width="72" height="128" loading="lazy"></a>'
                    f'<div class="media-links"><a class="lnk" href="{base}{nome}.mp4" target="_blank" rel="noopener">Abrir o vídeo (.mp4)</a>'
                    f'<a class="lnk" href="{base}{capa}" target="_blank" rel="noopener">Abrir a capa</a></div></div>')
        if tipo == "reel":
            cap = open(f"{REPO}/instagram/{date}/legenda-{nome}.txt").read().strip()
            titulo = cap.split("\n")[0]
            body.append(copy_block(f"{pid}-cap", "Legenda", cap))
        else:
            v = cfg["youtube"][nome]
            titulo = v["title"]
            desc = "\n\n".join([v["body"], v["desafio"], YT_FOOT.format(ep=v["ep"]), v["hashtags"]])
            body.append(copy_block(f"{pid}-tit", "Título", v["title"], "short"))
            body.append(copy_block(f"{pid}-desc", "Descrição", desc))
            body.append(copy_block(f"{pid}-tags", "Tags", ", ".join(v["tags"]), "short"))
            body.append('<ul class="ajustes"><li>Público: <b>não é conteúdo para crianças</b></li>'
                        '<li>Categoria: <b>Educação</b></li><li>Conteúdo alterado ou sintético: <b>não</b></li>'
                        f'<li>Visibilidade: <b>Programar</b> para {e(hora)}</li></ul>')
    cards[date].append(
        f'<article class="post" id="{pid}" data-rede="{tipo}">'
        f'<header class="post-head"><span class="hora">{e(hora)}</span>'
        f'<span class="chip chip-{tipo}">{e(rede)} · {e(fmt)}</span>'
        f'<label class="done"><input type="checkbox" id="{pid}-ok" data-post="{pid}"><span>Agendado</span></label></header>'
        f'<h3 class="post-title">{e(titulo)}</h3>' + "".join(body) + "</article>")

dias = []
for d, rot, obs in cfg["dias"]:
    if not cards[d]:
        continue
    extra = f' <span class="obs">{e(obs)}</span>' if obs else ""
    dias.append(f'<section class="dia"><h2>{e(rot)}{extra}</h2>{"".join(cards[d])}</section>')

page = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "agenda-manual.html")).read()
for k, v in {"PERIODO": e(cfg["periodo"]), "SUBTITULO": e(cfg["subtitulo"]), "NOTA": cfg["nota"],
             "TOTAL": str(len(cfg["posts"])), "CHAVE": e(cfg["posts"][0][0]), "DIAS": "\n".join(dias)}.items():
    page = page.replace("{{" + k + "}}", v)
open(f"{OUT}/agenda-manual.html", "w").write(page)
print(json.dumps([{"path": k} for k in sorted(files)]))
print(f"{len(cfg['posts'])} posts, {len(files)} miniaturas", file=sys.stderr)
