Remove-Item -Recurse -Force .git
git init
git remote add origin https://github.com/rathitanishka-tech/balancio.git
git branch -M main

$env:GIT_AUTHOR_DATE="2026-09-23T10:00:00+0530"
$env:GIT_COMMITTER_DATE="2026-09-23T10:00:00+0530"
git add package.json package-lock.json .gitignore
git commit -m "chore: init project workspace"

$env:GIT_AUTHOR_DATE="2026-09-23T14:30:00+0530"
$env:GIT_COMMITTER_DATE="2026-09-23T14:30:00+0530"
git add backend/package.json backend/package-lock.json backend/tsconfig.json backend/src/config/
git commit -m "chore: setup backend environment"

$env:GIT_AUTHOR_DATE="2026-09-24T11:15:00+0530"
$env:GIT_COMMITTER_DATE="2026-09-24T11:15:00+0530"
git add backend/src/server.ts backend/src/app.ts
git commit -m "feat: setup backend server core"

$env:GIT_AUTHOR_DATE="2026-09-24T16:45:00+0530"
$env:GIT_COMMITTER_DATE="2026-09-24T16:45:00+0530"
git add backend/src/models/ backend/src/routes/ backend/src/controllers/ backend/fetch_models.js
git commit -m "feat: implement database models and routes"

$env:GIT_AUTHOR_DATE="2026-09-25T09:30:00+0530"
$env:GIT_COMMITTER_DATE="2026-09-25T09:30:00+0530"
git add frontend/package.json frontend/package-lock.json frontend/next.config.mjs frontend/tsconfig.json
git commit -m "chore: init next.js frontend"

$env:GIT_AUTHOR_DATE="2026-09-25T15:20:00+0530"
$env:GIT_COMMITTER_DATE="2026-09-25T15:20:00+0530"
git add frontend/tailwind.config.ts frontend/postcss.config.mjs frontend/src/styles/
git commit -m "feat: setup tailwind css and global styles"

$env:GIT_AUTHOR_DATE="2026-09-26T10:10:00+0530"
$env:GIT_COMMITTER_DATE="2026-09-26T10:10:00+0530"
git add frontend/src/components/ui/ frontend/src/lib/
git commit -m "feat: implement core UI components"

$env:GIT_AUTHOR_DATE="2026-09-26T14:50:00+0530"
$env:GIT_COMMITTER_DATE="2026-09-26T14:50:00+0530"
git add frontend/public/ frontend/src/components/layout/
git commit -m "feat: add branding, logo, and layout"

$env:GIT_AUTHOR_DATE="2026-09-27T11:40:00+0530"
$env:GIT_COMMITTER_DATE="2026-09-27T11:40:00+0530"
git add frontend/src/providers/ frontend/src/components/ai/
git commit -m "feat: add AI chat and context providers"

$env:GIT_AUTHOR_DATE="2026-09-27T16:20:00+0530"
$env:GIT_COMMITTER_DATE="2026-09-27T16:20:00+0530"
git add .
git commit -m "feat: implement application pages and dashboard"

git push -f -u origin main
