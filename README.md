# Volánbusz Nyrt.

A baráti társaság hivatalos oldala – Next.js (App Router) + Tailwind CSS 4 + Framer Motion + Lenis.

## Oldalak

| Útvonal      | Tartalom                                                   |
| :----------- | :--------------------------------------------------------- |
| `/`          | Főoldal jelszókapuval, csapat, Mission Impossible          |
| `/game`      | Volán Kaland – ugrálós titkos játék                        |
| `/simulator` | Járatvezetés – pszeudo-3D busz szimulátor                  |

## Parancsok

| Parancs         | Művelet                                        |
| :-------------- | :--------------------------------------------- |
| `npm install`   | Függőségek telepítése                          |
| `npm run dev`   | Fejlesztői szerver: `http://localhost:3000`    |
| `npm run build` | Éles build a `.next/` mappába                  |
| `npm start`     | Az éles build futtatása                        |

## Szerkezet

```text
src/
├── app/              # útvonalak (layout, főoldal, /game, /simulator)
├── components/
│   ├── home/         # főoldali szekciók (kapu, hero, csapat, küldetések…)
│   ├── games/        # BusGame, BusSimulator + közös keret
│   └── ui/           # kurzor, split-flap felirat, futószalag, ikonok
└── lib/              # tartalom (tagok, küldetések), kapu-állapot, hangok
```
