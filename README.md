<h1 align="center">
  <img src="./assets/codedabba-banner.svg" alt="CodeDabba — Learn by building. Grow by sharing what you build." width="100%">
</h1>

<p align="center">
  A learning platform for courses, hands-on practice, mentorship, and hackathons.
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-Web_app-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js web app"></a>
  <a href="https://nestjs.com/"><img src="https://img.shields.io/badge/NestJS-API-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS API"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-Frontend_%26_backend-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"></a>
</p>

<p align="center">
  <a href="#part-1--project-setup">Project setup</a>
  &nbsp; / &nbsp;
  <a href="#part-2--for-students">For students</a>
</p>

---

## Part 1 — Project setup

<details open>
<summary><strong>Application overview</strong></summary>
<br>

| Application | Stack | Local address |
|:--|:--|:--|
| **Web app** | Next.js · React · TypeScript | [localhost:3001](http://localhost:3001) |
| **API** | NestJS · TypeScript · PostgreSQL | [localhost:3000](http://localhost:3000) |

</details>

### Requirements

| Requirement | Version / notes |
|:--|:--|
| Node.js | 20.9 or later |
| npm | Included with Node.js |
| PostgreSQL | Local instance or hosted database |

### Get the code

```bash
git clone https://github.com/Sanju562586/CodeDabba.git
cd CodeDabba
```

### Configure the backend

Create `backend/.env` and set your database connection and secrets:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/codedabba
JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-another-long-random-secret
CORS_ALLOWED_ORIGINS=http://localhost:3001
```

Create the `codedabba` database in PostgreSQL before starting the API. Use strong secrets and never commit `.env` files.

<details>
<summary><strong>Optional integrations</strong> — email, uploads, payments, and sign-in</summary>
<br>

Add credentials for any integrations you plan to use:

```env
# Email and verification messages
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM="CodeDabba <noreply@example.com>"

# Course and hackathon media uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Links in certificates and notifications
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
```

For Google sign-in, set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in the frontend environment.

</details>

### Install dependencies

Run these commands from the repository root:

```bash
cd backend
npm install
cd ../frontend
npm install
```

### Configure and start the apps

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Set this to the backend's base URL; **do not** append `/api/v1` because the frontend adds that prefix automatically.

Open two terminals from the repository root:

| Terminal 1 — API | Terminal 2 — Web app |
|:--|:--|
| `cd backend`<br>`npm run start:dev` | `cd frontend`<br>`npm run dev` |

Open the web app at [http://localhost:3001](http://localhost:3001). The API base path is [http://localhost:3000/api/v1](http://localhost:3000/api/v1).

### Build and test

Run each command from its application's directory:

| Backend | Frontend |
|:--|:--|
| `npm run build`<br>`npm test` | `npm run build`<br>`npm run lint` |

### Deploy

#### Render

The repository includes Docker-based backend and frontend services in [`render.yaml`](./render.yaml). Create or update the Render Blueprint from this file, then set the backend's required `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` values along with any integration credentials you use. Render supplies the service `PORT` automatically.

The frontend's `NEXT_PUBLIC_API_URL` is used during its Docker build. Keep it set to the backend's base URL without `/api/v1`. Set the backend's `CORS_ALLOWED_ORIGINS` to the exact frontend origins you deploy, comma-separated (for example, your Vercel domain and the Render frontend URL).

#### Vercel

Vercel deploys the Next.js frontend using its native Next.js build; it does not deploy this Dockerfile. Create a Vercel project for this repository and set its **Root Directory** to `frontend`. Add `NEXT_PUBLIC_API_URL` to the Vercel project's environment variables, using the backend's base URL without `/api/v1`, then deploy. Add the resulting Vercel domain to the backend's `CORS_ALLOWED_ORIGINS` on Render.

The frontend Dockerfile is for self-hosting or Render. To build it locally, pass the API URL as a build argument:

```bash
docker build -t codedabba-frontend --build-arg NEXT_PUBLIC_API_URL=https://your-backend.onrender.com ./frontend
docker run --rm -p 3000:3000 codedabba-frontend
```

The backend Dockerfile can be built from its app directory:

```bash
docker build -t codedabba-backend ./backend
```

Pass backend secrets as runtime environment variables when starting the container; do not copy `.env` files into an image.

---

## Part 2 — For students

### Turn what you learn into what you can do

CodeDabba brings learning, practice, and collaboration together, helping you move from studying a topic to applying it.

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>01 &nbsp; Learn with structure</h3>
      Follow courses organized into modules and lessons, and build your understanding one step at a time.
    </td>
    <td width="50%" valign="top">
      <h3>02 &nbsp; Practice by doing</h3>
      Work through hands-on tasks and submit solutions as you learn.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>03 &nbsp; See your progress</h3>
      Keep track of course progress and earn certificates for completed learning.
    </td>
    <td width="50%" valign="top">
      <h3>04 &nbsp; Build with others</h3>
      Join hackathons, form teams, and share project work.
    </td>
  </tr>
  <tr>
    <td colspan="2" valign="top">
      <h3>05 &nbsp; Learn with guidance</h3>
      Connect with mentors as you learn, practice, and build.
    </td>
  </tr>
</table>

> Whether you are just getting started or strengthening skills you already have, use CodeDabba to explore topics, practice consistently, and grow your portfolio through projects and teamwork.

### Start learning

Create a student account on the CodeDabba platform and explore the available courses and hackathons. Course availability, mentorship, and participation requirements may vary by offering.
