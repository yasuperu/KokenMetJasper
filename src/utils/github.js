import { GITHUB } from "../config";

/*
  Kleine wrapper rond de GitHub "contents" API.
  De beheerpagina leest en schrijft hiermee bestanden in de repo;
  elke wijziging is een commit op GITHUB.branch, waarna de GitHub Action
  de site opnieuw bouwt en publiceert.
*/

const API = "https://api.github.com";

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToUtf8(b64) {
  const bytes = Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export class GitHubClient {
  constructor(token) {
    this.token = token;
  }

  async request(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      let message = `GitHub gaf fout ${res.status}`;
      try {
        const body = await res.json();
        if (body.message) message += `: ${body.message}`;
      } catch {}
      if (res.status === 401) message = "Je GitHub-token is ongeldig of verlopen.";
      if (res.status === 403) message = "Je GitHub-token mag niet schrijven in deze repo (Contents: Read and write nodig).";
      throw new Error(message);
    }
    return res.status === 204 ? true : res.json();
  }

  contentsPath(path) {
    return `/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${path}`;
  }

  /** Controleer de token; geeft de repo-info terug. */
  async verify() {
    const repo = await this.request(`/repos/${GITHUB.owner}/${GITHUB.repo}`);
    if (!repo) throw new Error("Repo niet gevonden met deze token.");
    if (repo.permissions && !repo.permissions.push) {
      throw new Error("Deze token heeft geen schrijfrechten op de repo.");
    }
    return repo;
  }

  async listDir(dir) {
    const items = await this.request(`${this.contentsPath(dir)}?ref=${GITHUB.branch}`);
    return items || [];
  }

  /** { text, sha } of null */
  async readFile(path) {
    const file = await this.request(`${this.contentsPath(path)}?ref=${GITHUB.branch}`);
    if (!file) return null;
    return { text: base64ToUtf8(file.content), sha: file.sha };
  }

  async readJSON(path) {
    const file = await this.readFile(path);
    return file ? { data: JSON.parse(file.text), sha: file.sha } : null;
  }

  async writeFile(path, { text, base64 }, message, sha) {
    const existing = sha === undefined ? await this.request(`${this.contentsPath(path)}?ref=${GITHUB.branch}`) : null;
    return this.request(this.contentsPath(path), {
      method: "PUT",
      body: JSON.stringify({
        message,
        branch: GITHUB.branch,
        content: base64 ?? utf8ToBase64(text),
        ...(sha || existing?.sha ? { sha: sha || existing.sha } : {}),
      }),
    });
  }

  async writeJSON(path, data, message, sha) {
    return this.writeFile(path, { text: JSON.stringify(data, null, 2) + "\n" }, message, sha);
  }

  async deleteFile(path, message) {
    const existing = await this.request(`${this.contentsPath(path)}?ref=${GITHUB.branch}`);
    if (!existing) return true;
    return this.request(this.contentsPath(path), {
      method: "DELETE",
      body: JSON.stringify({ message, branch: GITHUB.branch, sha: existing.sha }),
    });
  }

  /** Laatste run van de deploy-workflow, voor de status in het beheer. */
  async latestDeploy() {
    const runs = await this.request(
      `/repos/${GITHUB.owner}/${GITHUB.repo}/actions/workflows/deploy.yml/runs?branch=${GITHUB.branch}&per_page=1`
    );
    return runs?.workflow_runs?.[0] || null;
  }
}
