const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            processDir(fullPath);
        } else if (entry.isFile() && (entry.name === 'page.tsx' || entry.name === 'layout.tsx' || entry.name === 'route.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Check if file has 'use client'
            const hasUseClient = content.includes("'use client'") || content.includes('"use client"');
            const hasEdge = content.includes("export const runtime = 'edge';");
            
            if (hasUseClient && hasEdge) {
                // Remove the edge export
                content = content.replace("export const runtime = 'edge';\n", "");
                content = content.replace("export const runtime = 'edge';", "");
                
                // Remove existing use client
                content = content.replace("'use client'\n", "");
                content = content.replace('"use client"\n', "");
                content = content.replace("'use client'", "");
                content = content.replace('"use client"', "");
                
                // Add them back in the correct order
                content = "'use client'\nexport const runtime = 'edge';\n" + content.trimStart();
                fs.writeFileSync(fullPath, content);
                console.log(`Fixed ${fullPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, 'src', 'app'));
