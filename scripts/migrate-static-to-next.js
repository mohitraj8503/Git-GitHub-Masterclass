const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const root = process.cwd();
const indexLines = fs.readFileSync(path.join(root, "index.html"), "utf8").split(/\r?\n/);

function lines(start, end) {
  return indexLines.slice(start - 1, end).join("\n");
}

function hasMultipleTopLevelNodes(html) {
  const trimmed = html.trim();
  let depth = 0;
  let roots = 0;
  const tagPattern = /<\/?([a-zA-Z][\w:-]*)(?:\s[^>]*)?>/g;
  let match;

  while ((match = tagPattern.exec(trimmed))) {
    const tag = match[0];
    const tagName = match[1].toLowerCase();
    const voidTag = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"].includes(tagName);
    if (tag.startsWith("</")) {
      depth -= 1;
    } else {
      if (depth === 0) roots += 1;
      if (!voidTag && !tag.endsWith("/>")) depth += 1;
    }
  }

  return roots > 1;
}

function stripArtificialWrapper(jsx) {
  const lines = jsx.split("\n");
  if (lines[0] !== "<div>" || lines[lines.length - 1] !== "</div>") return jsx;
  return lines.slice(1, -1).join("\n");
}

function jsxFromHtml(name, html) {
  html = html.replace(/style="([\s\S]*?)"/g, (_match, value) => {
    return `style="${value.replace(/\s+/g, " ").trim()}"`;
  });

  const temp = path.join(os.tmpdir(), `${name}.html`);
  fs.writeFileSync(temp, html);
  let jsx = execFileSync(path.join(root, "node_modules/.bin/htmltojsx"), [temp], {
    encoding: "utf8",
  }).trim();

  if (hasMultipleTopLevelNodes(html)) {
    jsx = stripArtificialWrapper(jsx);
  }

  jsx = jsx
    .replace(/src="images\//g, 'src="/images/')
    .replace(/srcSet="\s*images\//g, 'srcSet="/images/')
    .replace(/\n\s*images\//g, "\n                      /images/")
    .replace(/,images\//g, ",/images/")
    .replace(/url\("images\//g, 'url("/images/')
    .replace(/url\(&quot;images\//g, "url(&quot;/images/")
    .replace(/data-poster-url="images\//g, 'data-poster-url="/images/')
    .replace(/data-video-urls="images\//g, 'data-video-urls="/images/')
    .replace(/<img\b/g, "<AssetImage")
    .replace(/\salt(?=[\s/>])/g, ' alt=""')
    .replace(/<\/img>/g, "</AssetImage>");

  return jsx;
}

function component(name, html) {
  const jsx = jsxFromHtml(name, html);
  const usesImages = jsx.includes("<AssetImage");
  const imports = usesImages ? 'import AssetImage from "@/components/AssetImage";\n\n' : "";
  const wrapped = jsx.startsWith("<") && !jsx.startsWith("<>") ? `(\n    ${jsx}\n  )` : `(\n    <>\n      ${jsx}\n    </>\n  )`;
  return `${imports}export default function ${name}() {\n  return ${wrapped};\n}\n`;
}

const sections = {
  Navbar: lines(181, 289),
  Hero: lines(290, 456),
  UpcomingEvents: lines(464, 637),
  WhoWeAre: lines(638, 693),
  MissionGrid: lines(696, 827),
  AboutEvents: lines(828, 934),
  SpotlightStats: lines(935, 1044),
  Mentors: lines(1045, 1140),
  FAQAccordion: lines(1141, 1298),
  ContactSection: lines(1299, 1506),
  Footer: lines(1507, 1563),
};

fs.mkdirSync(path.join(root, "components"), { recursive: true });
for (const [name, html] of Object.entries(sections)) {
  fs.writeFileSync(path.join(root, "components", `${name}.tsx`), component(name, html));
}

function bodyFrom(file) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  return html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1]
    .replace(/<script src="js\/main\.js" type="text\/javascript"><\/script>/, "")
    .trim();
}

function servicePage(name, sourceFile) {
  const jsx = jsxFromHtml(name, bodyFrom(sourceFile));
  const usesImages = jsx.includes("<AssetImage");
  const imports = usesImages ? 'import AssetImage from "@/components/AssetImage";\n\n' : "";
  return `${imports}export default function ${name}() {\n  return (\n    <>\n      ${jsx}\n    </>\n  );\n}\n`;
}

fs.mkdirSync(path.join(root, "app", "changelog"), { recursive: true });
fs.mkdirSync(path.join(root, "app", "licenses"), { recursive: true });
fs.writeFileSync(path.join(root, "app", "changelog", "page.tsx"), servicePage("ChangelogPage", "changelog.html"));
fs.writeFileSync(path.join(root, "app", "licenses", "page.tsx"), servicePage("LicensesPage", "licenses.html"));
