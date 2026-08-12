const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, '../public/content');

// Simple JSON Schema validator without external dependencies for MVP
function validateJson(obj) {
    if (!obj.id || !obj.title || !Array.isArray(obj.contentBlocks)) {
        return false;
    }
    for (const block of obj.contentBlocks) {
        if (block.type === 'markdown' && typeof block.content !== 'string') return false;
        if (block.type === 'code-editor') {
            if (!block.config) return false;
            if (!block.config.initialCode) return false;
            if (!block.config.solutionCode) return false;
            // hints is optional but if present must be a non-empty array of strings
            if (block.config.hints !== undefined) {
                if (!Array.isArray(block.config.hints) || block.config.hints.length === 0) return false;
                if (!block.config.hints.every(h => typeof h === 'string')) return false;
            }
        }
    }
    return true;
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.json') && !file.includes('index.json')) {
            try {
                const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                if (!validateJson(data)) {
                    console.error(`❌ Schema validation failed in file: ${fullPath}`);
                    process.exit(1);
                }
            } catch (e) {
                console.error(`❌ Error parsing JSON in file: ${fullPath}`);
                process.exit(1);
            }
        }
    }
}

console.log("Validating lesson JSON schemas...");
if (fs.existsSync(contentDir)) {
    walkDir(contentDir);
    console.log("✅ All lessons valid!");
} else {
    console.warn("⚠️ Content directory not found, skipping validation.");
}
