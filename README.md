# Docker App

This is a [Next.js](https://nextjs.org) made to be run within docker.

![Build](https://github.com/THE-Ink-Master/dockerImageUpdater/actions/workflows/build.yml/badge.svg)
![Push to DockerHub](https://github.com/THE-Ink-Master/dockerImageUpdater/actions/workflows/docker-publish.yml/badge.svg)

![Commits since last release](https://img.shields.io/github/commits-since/THE-Ink-Master/dockerImageUpdater/latest?logo=github&amp;label=Commits%20since%20last%20release)
![Commits in the last month](https://img.shields.io/github/commit-activity/m/THE-Ink-Master/dockerImageUpdater?logo=github&amp;label=Commits%20since%20last%20month)
![Last commit](https://img.shields.io/github/last-commit/THE-Ink-Master/dockerImageUpdater?logo=github&amp;label=Last%20commit)
![Repo Size](https://img.shields.io/github/repo-size/THE-Ink-Master/dockerImageUpdater?logo=github&amp;label=Repo%20size)
![Github release version](https://img.shields.io/github/v/release/THE-Ink-Master/dockerImageUpdater?logo=github&amp;label=Release)
![License](https://img.shields.io/github/license/THE-Ink-Master/dockerImageUpdater?logo=github&amp;label=License)
![Downloads](https://img.shields.io/github/downloads/THE-Ink-Master/dockerImageUpdater/total?logo=github&amp;label=GitHub%20Downloads)

![Docker Pulls](https://img.shields.io/docker/pulls/inkytheinkmaster/dockerImageUpdater?logo=docker&amp;label=Docker%20pulls)
![Docker stars](https://img.shields.io/docker/stars/inkytheinkmaster/dockerImageUpdater?logo=docker&amp;label=Docker%20stars)
![Docker image size](https://img.shields.io/docker/image-size/inkytheinkmaster/dockerImageUpdater/latest?logo=docker&amp;label=Docker%20image%20size)
![Version](https://img.shields.io/docker/v/inkytheinkmaster/dockerImageUpdater/latest?logo=docker&amp;label=Docker%20image%20version)

## Getting Started

### Running in Docker

To run this project within docker, make a docker-compose.yml file:

```bash
services:
  updater:
    image: inkytheinkmaster/dockerImageUpdater:latest
    container_name: imageupdater
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - TZ: Australia/Canberra
      - TIME: 8 # Optional, allows you to set a custom time (hour) when the daily cron job runs
      - IGNORED:"example/example:latest,docker/docker:latest"
      - WEBHOOK_URL: "" # The webhook url that receives a POST request with the repo in the body when an update is avaliable
    restart: unless-stopped
```

Or run the docker run command:

```bash
docker run -d -e IGNORED="example/example:latest,docker/docker:latest" -e TZ=Australia/Canberra -e WEBHOOK_URL="" -e TIME=8 -v /var/run/docker.sock:/var/run/docker.sock --name image-update-checker --restart=always inkytheinkmaster/dockerImageUpdater:latest
```

### Running with development server

First, download the repository and install all packages:

```bash
git clone https://github.com/THE-Ink-Master/dockerImageUpdater.git
```

```bash
cd ./dockerImageUpdater
```

```bash
pnpm install
```

Then run the development server:

```bash
pnpm dev
```

or if you don't want the cron job active:

```bash
pnpm nextDev
```

Open [http://localhost:80](http://localhost:80) with your browser to see the result.

## Next.js

This project uses Next.js

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
