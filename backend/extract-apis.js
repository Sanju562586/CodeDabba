const fs = require('fs');
const path = require('path');

const frontendSrcPath = path.join(__dirname, '../frontend/src');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

const allFiles = getAllFiles(frontendSrcPath);
const apiCalls = new Set();
const regex = /api\.(get|post|put|patch|delete)\(['"`]([^'"`]+)['"`]/g;

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = regex.exec(content)) !== null) {
        let uri = match[2];
        // replace newlines if any
        uri = uri.replace(/\n|\r/g, "");
        apiCalls.add(`${match[1].toUpperCase()} ${uri}`);
    }
});

const sortedCalls = Array.from(apiCalls).sort();
fs.writeFileSync('apis.json', JSON.stringify(sortedCalls, null, 2));
