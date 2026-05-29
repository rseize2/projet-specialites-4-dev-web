# Backend - Projet Spé 4

API REST + WebSocket pour l'application collaborative d'édition de documents.

## Périmètre (Enzo)

Auth, gestion utilisateurs, admin, infra. Les routes `documents` et le temps réel (Socket.io) seront ajoutés par Mika dans un second temps.

## Stack

- **Node.js 20+** / **TypeScript**
- **Express 4** - framework HTTP
- **Prisma** - ORM + migrations PostgreSQL
- **Zod** - validation des entrées
- **JWT** + **bcrypt** + **otplib** (2FA TOTP)

## Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Copier la config
cp .env.example .env
# Éditer JWT_SECRET (≥ 16 caractères) si besoin

# 3. Lancer Postgres via Docker (depuis backend/)
docker compose up -d

# 4. Première migration + génération du client Prisma
npm run prisma:migrate
# (donner un nom à la migration, ex: "init")

# 5. Lancer en dev (hot reload)
npm run dev
```

## Tester l'auth (J1)

Une fois le serveur lancé :

```bash
# Healthcheck
curl http://localhost:3000/api/health

# Inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Les deux endpoints renvoient `{ "data": { "user": {...}, "token": "..." } }`.

L'API est disponible sur `http://localhost:3000/api`.
Healthcheck : `GET /api/health`.

## Structure

```
src/
├── config/         # variables d'env typées (Zod)
├── lib/            # clients (prisma, ...)
├── middlewares/    # auth, validate, error handler
├── schemas/        # schémas Zod
├── routes/         # définition des endpoints
├── controllers/    # logique HTTP (req → res)
├── services/       # logique métier
└── server.ts       # entrée
```

## Conventions

- **Routes** : `/api/<resource>/<action>`
- **Réponse succès** : `{ "data": ... }`
- **Réponse erreur** : `{ "error": { "code": "...", "message": "..." } }`
- **Branches Git** : `feat/<auteur>-<feature>`

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Lance en mode dev (tsx watch) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Lance la version compilée |
| `npm run prisma:migrate` | Crée + applique une migration |
| `npm run prisma:studio` | GUI pour browser la BDD |
| `npm test` | Tests Vitest |
