import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { loadEnvFile } from "node:process";
if (process.env.NODE_ENV !== "production") {
  loadEnvFile();
}

const ignoredRepos = process.env.IGNORED ? process.env.IGNORED?.split(",") : [];

async function checkImageHash(repo: string, tag: string, digest: string) {
  console.log("running")
  const dockerImages = await new Promise<string>((resolve, reject) => {
    const dockerImage = spawn(
      "docker",
      [
        "buildx",
        "imagetools",
        "inspect",
        "--raw",
        // "{{json .Manifest}}",
        `${repo}:${tag}`,
      ],
      // {
      //   shell: false,
      // },
    );

    let output = "";
    let errorOutput = "";

    dockerImage.stdout.on("data", (data) => {
      output += data.toString();
    });

    dockerImage.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    dockerImage.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(`Docker process exited with code ${code}: ${errorOutput}`),
        );
      } else {
        console.log(output.trim())
        resolve(JSON.parse(output.trim()).digest);
      }
    });
  });

  // console.log(dockerImages);
  // console.log(digest);
  if (JSON.parse(dockerImages).Manifest === digest) {
    console.log("No update");
    return;
  } else {
    console.log(`update for: ${repo}:${tag}`);
    return `update for: ${repo}:${tag}`;
  }
}

async function run(webhook: boolean) {
  try {
    console.log("we trying?")
    const imagesJsonString = await new Promise<string>((resolve, reject) => {
      console.log("spawning?")
      const dockerImages = spawn(
        // "docker image ls --digests --format json",
        // [],
        "docker",
        ["image", "ls", "--all","--format", "json", "--digests"],
        // ["image", "ls", "--digests"],
        // {
        //   shell: true,
        // },
      );

      let output = "";
      let errorOutput = "";

      dockerImages.stdout.on("data", (data) => {
        output += data.toString();
      });

      dockerImages.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      dockerImages.on("close", (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `Docker process exited with code ${code}: ${errorOutput}`,
            ),
          );
        } else {
          console.log(output)
          resolve(output);
        }
      });
    });

    const localImages = imagesJsonString
      .trim()
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line));

    const final = [];
    // console.log(localImages)
    for (let i = 0; i < localImages.length; i++) {
      // console.log(localImages[i]);
      const repo = localImages[i].Repository;
      const tag = localImages[i].Tag;
      const digest = localImages[i].Digest;
      console.log(repo, tag, digest);
      console.log(ignoredRepos.includes(repo));
      if (!ignoredRepos.includes(repo)) {
        const response = await checkImageHash(repo, tag, digest);
        if (response != null) {
          console.log(response);
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
                  content: `An update for ${repo}:${tag} is available`,
                }),
              });
            }
          } catch (err) {
            console.log("fetch FAILED");
          }
        }
      }
    }
    console.log(final)
    return final
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
