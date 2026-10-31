export type FsNode = {
  type: "dir" | "file";
  children?: Record<string, FsNode>;
  content?: string;
};

export type TerminalState = {
  cwd: string;
  history: string[];
  histIndex: number;
  lines: string[];
  fs: FsNode;
  user: string;
};

const HELP = `HackLab simulated shell — no host commands are executed.

pwd, ls, ls -a, cd, cat, mkdir, whoami, echo, clear, help, history
dig HOST     (lab.hacklab.internal names only)
ping HOST    (lab.hacklab.internal names only)

This terminal is an educational simulator.`;

export function defaultFilesystem(): FsNode {
  return {
    type: "dir",
    children: {
      home: {
        type: "dir",
        children: {
          cadet: {
            type: "dir",
            children: {
              "README.txt": {
                type: "file",
                content:
                  "Authorized training home. Use help to list commands. Hidden challenge files are loaded from the lab server, not this starter tree.",
              },
            },
          },
        },
      },
      etc: {
        type: "dir",
        children: {
          hostname: { type: "file", content: "hacklab-workstation" },
        },
      },
    },
  };
}

export function createTerminalState(): TerminalState {
  return {
    cwd: "/home/cadet",
    history: [],
    histIndex: -1,
    lines: [
      "HackLab Academy training terminal",
      "Type `help` to begin. Scope: this simulator only.",
    ],
    fs: defaultFilesystem(),
    user: "cadet",
  };
}

function normalize(cwd: string, input: string) {
  const raw = input.startsWith("/") ? input : `${cwd}/${input}`;
  const parts = raw.split("/").filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return "/" + stack.join("/");
}

function walk(root: FsNode, path: string): FsNode | null {
  if (path === "/") return root;
  const parts = path.split("/").filter(Boolean);
  let node: FsNode = root;
  for (const part of parts) {
    if (node.type !== "dir" || !node.children?.[part]) return null;
    node = node.children[part];
  }
  return node;
}

function ensureDir(root: FsNode, path: string) {
  const parts = path.split("/").filter(Boolean);
  let node = root;
  for (const part of parts) {
    node.children ??= {};
    node.children[part] ??= { type: "dir", children: {} };
    node = node.children[part];
    if (node.type !== "dir") return null;
  }
  return node;
}

const LAB_HOSTS: Record<string, string> = {
  "lab.hacklab.internal": "10.8.0.10",
  "shop.lab.hacklab.internal": "10.8.0.20",
  "soc.lab.hacklab.internal": "10.8.0.30",
};

export type CommandResult = {
  output: string[];
  cwd?: string;
  clear?: boolean;
  remoteCat?: string;
  remoteLs?: { path: string; all: boolean };
  remoteNet?: { cmd: "dig" | "ping"; host: string };
};

export function runLocalCommand(state: TerminalState, input: string): CommandResult {
  const trimmed = input.trim();
  if (!trimmed) return { output: [] };
  const [cmd, ...rest] = tokenize(trimmed);
  const arg = rest.join(" ");

  switch (cmd) {
    case "help":
      return { output: HELP.split("\n") };
    case "clear":
      return { output: [], clear: true };
    case "pwd":
      return { output: [state.cwd] };
    case "whoami":
      return { output: [state.user] };
    case "history":
      return { output: state.history.map((item, i) => `${i + 1}  ${item}`) };
    case "echo":
      return { output: [arg] };
    case "ls": {
      const all = rest.includes("-a") || rest.includes("-la") || rest.includes("-al");
      const pathArg = rest.find((item) => !item.startsWith("-")) ?? ".";
      const path = normalize(state.cwd, pathArg);
      return { output: [], remoteLs: { path, all } };
    }
    case "cd": {
      const path = normalize(state.cwd, arg || "/home/cadet");
      ensureDir(state.fs, path === "/" ? "/" : path);
      return { output: [], cwd: path === "" ? "/" : path };
    }
    case "cat": {
      if (!arg) return { output: ["cat: missing operand"] };
      return { output: [], remoteCat: normalize(state.cwd, arg) };
    }
    case "mkdir": {
      if (!arg) return { output: ["mkdir: missing operand"] };
      const path = normalize(state.cwd, arg);
      if (walk(state.fs, path)) return { output: [`mkdir: ${arg}: exists`] };
      ensureDir(state.fs, path);
      return { output: [] };
    }
    case "dig":
    case "ping": {
      const host = rest[0]?.toLowerCase();
      if (!host) return { output: [`${cmd}: missing host`] };
      if (!LAB_HOSTS[host] && !host.endsWith(".hacklab.internal")) {
        return {
          output: [
            `${cmd}: ${host} is outside the authorized training namespace.`,
            "Only *.lab.hacklab.internal names resolve here.",
          ],
        };
      }
      return { output: [], remoteNet: { cmd, host } };
    }
    default:
      return {
        output: [
          `${cmd}: command not found in the training simulator`,
          "Type `help` for the supported educational command set.",
        ],
      };
  }
}

function tokenize(input: string) {
  return input.match(/"[^"]+"|\S+/g)?.map((part) => part.replace(/^"|"$/g, "")) ?? [];
}

export function listingFromFiles(
  files: { path: string; is_dir: boolean }[],
  path: string,
  all: boolean,
) {
  const prefix = path === "/" ? "/" : path.replace(/\/$/, "");
  const names = new Set<string>();
  for (const file of files) {
    if (file.path === prefix) continue;
    const parent = file.path.slice(0, file.path.lastIndexOf("/") || 1) || "/";
    const normalizedParent = parent === "" ? "/" : parent;
    if (normalizedParent !== prefix && !(prefix === "/" && file.path.split("/").filter(Boolean).length === 1)) {
      const top = file.path.split("/").filter(Boolean)[0];
      if (prefix === "/" && top) {
        names.add(file.is_dir || file.path.split("/").filter(Boolean).length > 1 ? top : top);
      }
      continue;
    }
    if (normalizedParent === prefix) {
      const name = file.path.slice(prefix === "/" ? 1 : prefix.length + 1);
      if (name && !name.includes("/")) names.add(name);
    }
  }
  const list = [...names].sort();
  const visible = all ? list : list.filter((name) => !name.startsWith("."));
  return visible.length ? visible : [".", ".."];
}
