const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            processDir(fullPath);
        } else if (entry.isFile() && (entry.name === 'page.tsx' || entry.name === 'layout.tsx' || entry.name === 'route.ts' || entry.name === 'sitemap.ts' || entry.name === 'middleware.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (!content.includes("export const runtime = 'edge'")) {
                content = "export const runtime = 'edge';\n" + content;
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, 'src', 'app'));
let mwPath = path.join(__dirname, 'src', 'middleware.ts');
if (fs.existsSync(mwPath)) {
    let content = fs.readFileSync(mwPath, 'utf8');
    if (!content.includes("export const runtime = 'edge'")) {
        content = "export const runtime = 'edge';\n" + content;
        fs.writeFileSync(mwPath, content);
        console.log(`Updated ${mwPath}`);
    }
}
