const fs = require("fs");
const path = require("path");

const filesToUpdate = [
  path.join(__dirname, "src", "app", "page.tsx"),
  path.join(__dirname, "src", "app", "globals.css"),
  path.join(__dirname, "tailwind.config.js")
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Theme Swap
    content = content.replace(/violet/g, "amber");
    content = content.replace(/purple/g, "yellow");
    content = content.replace(/indigo/g, "orange");
    
    // Background Swap
    content = content.replace(/bg-\[#0a0a0f\]/g, "bg-zinc-950");
    content = content.replace(/bg-\[#13131a\]/g, "bg-zinc-900");
    content = content.replace(/border-\[#1f1f2e\]/g, "border-zinc-800");

    fs.writeFileSync(file, content);
    console.log(`Updated theme in ${file}`);
  }
});
