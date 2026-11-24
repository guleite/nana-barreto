# Chef Nana Barreto · Buffet & Consultoria Gastronômica

Proposta de layout (pitch) da Concept Agência. Site estático: HTML/CSS/JS + GSAP, ScrollTrigger e Lenis via CDN.

Rodar local: `npx http-server nana-barreto -p 5191 -c-1` (entrada "nana-barreto" no `.claude/launch.json`).

## Antes de publicar para o cliente

- `assets/js/main.js` (topo): `NANA_WHATSAPP` está como `5561000000000` (trocar pelo número real); `NANA_LEAD_ENDPOINT` vazio = só registra no console.
- `[e-mail de contato]` em `index.html` (seção Contato) e `privacidade.html`.
- Textos inferidos a confirmar: trajetória (01 "cozinha profissional", 02 P10), descrição dos projetos, lista de serviços e faixas de investimento do formulário.

## Vídeo do topo (avança com o scroll)

- `assets/seq/` (1280×720, desktop) e `assets/seq-m/` (540×960, celular): 221 quadros WebP desenhados num `<canvas>` conforme o scroll.
- Hoje é uma montagem de clipes gratuitos do Pexels (ids 39877475, 39877520, 34642220, 31750566). O ideal é trocar pelo vídeo original do evento no Mané Garrincha (reel DeNUZtIxi_D) ou por filmagem da chef.
- Para regenerar a partir de um `master.mp4` novo (quantidade de quadros = `FRAMES` em main.js):

```
ffmpeg -i master.mp4 -vf "fps=15,scale=1280:720" -c:v libwebp -quality 60 assets/seq/f%03d.webp
ffmpeg -i master.mp4 -vf "fps=15,crop=ih*9/16:ih,scale=540:960" -c:v libwebp -quality 58 assets/seq-m/f%03d.webp
```

## Fotos

Todas de @nana.barretodias (Instagram), convertidas para WebP em `assets/img/`. Selos "Dica da Chef"/Big Box foram recortados.
