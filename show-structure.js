// show-structure.js
import fs from "fs";
import path from "path";

function showTree(dir, indent = "") {
    let output = "";

    for (const item of fs.readdirSync(dir)) {
        if (item === "node_modules") continue;

        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);

        const line = indent + (stats.isDirectory() ? "📁 " : "📄 ") + item + "\n";
        output += line;

        if (stats.isDirectory()) {
            output += showTree(fullPath, indent + "   ");
        }
    }

    return output;
}

const tree = showTree(".");

// Write (or overwrite) file
fs.writeFileSync("folder.txt", tree, "utf-8");

console.log("✅ Folder structure saved to folder.txt");