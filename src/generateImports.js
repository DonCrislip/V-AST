/**
 * OUTCOME
 * - config file that lets the user establish aliases (can we auto this?)
 * - single entry point for all other entry points
 * -- user can select All (single entry point) or target one of its child entry points
 * --- should all files be traversed and made availabe as entry points?
 */


const fs = require('fs')
const path = require('path')
const glob = require('glob')
const config = require(`${process.cwd()}/autoDoc.config.js`).config

const basePath = config.basePath
const fileTarget = config.fileTarget

let ALL_PATHS = []

const parseJSON = (file) => {
    const fileBuffer = fs.readFileSync(file)
    const fileData = fileBuffer.toString().trim()
    const json = JSON.parse(fileData)
    return json
}

const makeRelativePath = (str, dir) => {
    if (str.includes(`dv/${dir}/`)) {
        str = str.replace(`dv/${dir}/`, './')
    }
    else if (str.includes(`dv/`)) {
        str = str.replace(`dv/`, '../')
    }
    return str
}

const getApps = (json) => {
    const apps = []
    for (const obj of json) {
        const dirPath = obj.dir === 'dv' ? './dv' : `./dv/${obj.dir}`
        const appObj = {
            importDir: obj.dir,
            dir: dirPath,
            appPaths: []
        }
        for (const page of obj.pages) {
            if (Array.isArray(page.vue_apps)) {
                for (const app of page.vue_apps) {
                    appObj.appPaths.push(`./${app.path}`)
                }
            }
            if (Array.isArray(page.page_js)) {
                for (const app of page.page_js) {
                    if (app.includes('vendor')) { continue; }
                    const globArr = glob.sync(app);
                    for (let str of globArr) {
                        str = makeRelativePath(str, obj.dir)
                        ALL_PATHS.push(str)
                        appObj.appPaths.push(`${str}`)
                    }
                }
            }
        }
        apps.push(appObj)
    }
    return apps
}

const removeDuplicatePaths = (arr) => {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[i].appPaths.length; j++) {
            const path = arr[i].appPaths[j];
            const len = ALL_PATHS.filter(p => path.includes(p)).length
            if (len > 1) {
                const index = ALL_PATHS.findIndex(p => path.includes(p))
                ALL_PATHS.splice(index, 1)
                arr[i].appPaths.splice(j, 1)
                j--
            }
        }
    }
    return arr
}

let count = 0;
const updateDuplicateNames = (str, file) => {
    if (file.includes(`import ${str} from`)) {
        count++
        return `${str + count}`
    }
    return str
}

const getImportFileName = (str) => {
    if (str.includes('.')) {
        str = str.split('.').join('')
    }
    if (str.includes('-')) {
        str = str.split('-').join('')
    }
    // console.log(str)
    return str;
}

const writeImportFile = (apps) => {
    for (const app of apps) {
        let file = '';
        for (appPath of app.appPaths) {
            const pathObj = path.parse(appPath);
            pathObj.name = updateDuplicateNames(getImportFileName(pathObj.name), file)
            file += `import ${pathObj.name} from '${appPath}'\n`
        }
        if (!fs.existsSync(`${__dirname}/${app.importDir}/`)){
            fs.mkdirSync(`${__dirname}/${app.importDir}/`, { recursive: true });
        }
        fs.writeFileSync(`${__dirname}/${app.importDir}/${app.importDir}_docImports.js`, file)
    }
}

const writeMasterImportFile = (dirCollection) => {
    let file = '';
    for (const dir of dirCollection) {
        file += `import ${dir.importDir.split('-').join('')} from './${dir.importDir}/${dir.importDir}_docImports.js'\n`
    }
    fs.writeFileSync(`${__dirname}/docImports.js`, file)
}

fs.readdir(basePath, 'utf8', (err, files) => {
    if (err) { console.log(err) }
    else {
        const dirCollection = []
        for (file of files) {
            if (file.includes(fileTarget)) {
                ALL_PATHS = []
                const json = parseJSON(file)
                const apps = removeDuplicatePaths(getApps(json))
                dirCollection.push(...apps)
                writeImportFile(apps)
            }
        }
        writeMasterImportFile(dirCollection)
    }
})