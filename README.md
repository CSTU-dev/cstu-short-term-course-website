CSTU Short Term Course Website

## Warning

- **DO NOT develop on the main branch**
- **Check out a new branch before developing**
- **Open a pull request for code review**
- **Merge only after code review**

## Development

Download Docker and
```bash
docker compose up -d db
```

Run on localhost:3000
```bash
npm run dev
```

## Security

Read-only security audit checklist and fix notes (no secrets in source — use `.env` only):

- [docs/security/CHECKLIST.md](./docs/security/CHECKLIST.md) — full cybersecurity checklist
- [docs/security/fixes/](./docs/security/fixes/) — areas that need remediation before public production
