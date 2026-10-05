// Regroupe tous les modules en un seul fichier .jsx, pour l'aperçu dans
// Claude (claude.ai) : React et lucide-react restent des imports externes,
// le JSX est conservé tel quel.
import { build } from "esbuild";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));
const out = process.argv[2] || "dist/TM_Mobile_single.jsx";

await build({
  entryPoints: ["src/App.jsx"],
  bundle: true,
  format: "esm",
  jsx: "preserve",
  external: ["react", "react-dom", "lucide-react"],
  outfile: out,
  charset: "utf8",
  legalComments: "none",
  banner: { js: "// Tennis Manager v" + pkg.version + " — fichier unique généré depuis src/ (npm run build:single). Ne pas modifier à la main." },
  logLevel: "info",
});

// Remonte et fusionne les imports externes en tête de fichier (plus lisible
// et plus sûr pour les visionneuses qui attendent les imports au début).
import { writeFileSync } from "node:fs";
let code = readFileSync(out, "utf8");
const bySource = new Map();
code = code.replace(/^import\s*\{([\s\S]*?)\}\s*from\s*"([^"]+)";\n/gm, (_, specs, src) => {
  const set = bySource.get(src) || new Set();
  specs.split(",").map(x => x.trim()).filter(Boolean).forEach(x => set.add(x));
  bySource.set(src, set);
  return "";
});
const header = [...bySource].map(([src, set]) => "import {\n  " + [...set].join(",\n  ") + "\n} from \"" + src + "\";").join("\n");
const firstNl = code.indexOf("\n");
code = code.slice(0, firstNl + 1) + header + "\n" + code.slice(firstNl + 1);
writeFileSync(out, code);
