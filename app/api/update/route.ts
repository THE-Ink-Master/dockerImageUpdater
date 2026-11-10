import { NextResponse } from "next/server";
import http from "node:http";
import { loadEnvFile } from "node:process";
if (process.env.NODE_ENV !== "production") {
  loadEnvFile();
}

const ignoredRepos = process.env.IGNORED ? process.env.IGNORED?.split(",") : [];

async function getHashFromGhcr(namespace: string, repo: string, tag: string) {

  const tokenResponse = await fetch(`https://ghcr.io/token?scope=repository:${namespace}/${repo}:pull`, {
    method: "GET"
  })

  const token = (await tokenResponse.json()).token;

  const packagesRes = await fetch(`https://ghcr.io/v2/${namespace}/${repo}/manifests/${tag}`, {
    method: "GET",
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': [
        'application/vnd.oci.image.index.v1+json',
        'application/vnd.oci.image.manifest.v1+json',
        'application/vnd.docker.distribution.manifest.v2+json',
        'application/vnd.docker.distribution.manifest.list.v2+json'
      ].join(',')
    }
  })
  const digest = packagesRes.headers.get('Docker-Content-Digest');

  if (!digest){
    return {
      error: "Not Found"
    }
  }
  return {
    digest: digest
  }
}

async function getHashFromDockerHub(namespace: string, repo: string, tag: string) {
  const response = await fetch(`https://hub.docker.com/v2/namespaces/${namespace}/repositories/${repo}/tags/${tag}`, {
    method: "GET"
  })

  const data = await response.json();

  let returnData;
  for (let i = 0; i < data.images.length; i++) {
    const current = data.images[i]
    if (current.architecture === "amd64") {
      returnData = current;
    }
  }
  if (!returnData) {
    return;
  } else {
    return data;
  }
}

async function checkImageHash(repo: string, hash: string, digest: string) {
  if (hash === digest) {
    console.log("No update");
    return;
  } else {
    console.log(`update for: ${repo}`);
    console.log(`Current hash: ${digest}, remote hash: ${hash}`);
    return `update for: ${repo}`;
  }
}

async function run(webhook: boolean) {
  try {
    const images = await new Promise<string>((resolve, reject) => {
      const dockerList = {
        socketPath: "/var/run/docker.sock",
        path: "/v1.56/images/json",
        method: "GET",
      };
      const req = http.request(dockerList, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(data);
          } catch (err) {
            console.error(err);
            reject(err);
          }
        });
      });
      req.on("error", (err) => console.log(`Error: ${err}`));
      req.end();
    });

    const localImages = JSON.parse(images);

    const final = [];
    for (let i = 0; i < localImages.length; i++) {
      const repo = localImages[i].RepoTags[0];
      if (ignoredRepos.includes(repo) || !repo.includes("/")){
        console.log("Ignored or invalid!")
        console.log(repo)
        continue;
      }
      let hash;
      if (repo.includes("ghcr.io")) {
        const image = repo.split("/");
        const namespace = image[1];
        const repoAndTag = image[2];
        const repository = repoAndTag.split(":")[0];
        const tag = (repoAndTag.split(":"))[1];
        const returned = await getHashFromGhcr(namespace, repository, tag);
        hash = returned.digest;
      } else {
        const image = repo.split("/");
        const namespace = image[0];
        const repoAndTag = image[1];
        const repository = (repoAndTag.split(":"))[0];
        const tag = repoAndTag.split(":")[1];
        const returned = await getHashFromDockerHub(namespace, repository, tag);
        hash = returned.digest;
      }
      const digest = localImages[i].Id;
      if (!ignoredRepos.includes(repo)) {
        const response = await checkImageHash(repo, hash, digest);
        if (response != null) {
          final.push(response);
          const url: string = process.env.WEBHOOK_URL
            ? process.env.WEBHOOK_URL
            : "http://localhost:80/api/null";
          try {
            if (webhook === true) {
              await fetch(url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  content: `An update for ${repo} is available`,
                }),
              });
            }
          } catch (err) {
            console.log("fetch FAILED");
          }
        }
      }
    }
    return final;
  } catch (err) {
    console.error(err);
  }
}

export async function GET(request: Request) {
  try {
    const final = await run(false);
    return NextResponse.json({ status: 200, final });
  } catch (err) {
    return NextResponse.json({ status: 500, err });
  }
}

export async function POST(request: Request) {
  try {
    const final = await run(true);
    return NextResponse.json({ status: 200, final });
  } catch (err) {
    return NextResponse.json({ status: 500, err });
  }
}
