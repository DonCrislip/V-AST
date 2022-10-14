/**
 * V•LAC : Visual Learning & Accessing of your Code galaxy
 * Objective: see how js/vue files are interconnected via imports and methods as well as dead code
 * 
 * TODOS:
 * - map services to methods and files
 * - how to handle edge / custom import solutions
 * - provide an overall summary for the entire system
 * - show event binding connections
 * - show css file relationships
 * - list out scoped css within parent info
 * - what is getting imported but not used
 * - hide/show code planets
 */

const {writeFile, readFileSync} = require('fs');
const path = require('path');
const acorn = require('acorn');
const htmlparser2 = require('htmlparser2');
const config = require(`${process.cwd()}/autoDoc.config.js`).config
const isHtmlElement = require('z_autoDoc/allHtmlElements.js').isHtmlElement
const guidGenerator = require('z_autoDoc/guidGenerator.js').guidGenerator

const aliases = config.aliases
const baseDir = config.baseDir

const MODULE = {
    id: null,
    type: 'module',
    name: '',
    ext: null,
    importNames: [],
    path: '',
    parents: [],
    children: [],
    methods: [],
    classes: [],
    callExpressions: [],
    elements: [],
    size: 0
}
const ENDPOINT = {
    type: 'endpoint',
    id: null,
    path: '',
    api: '',
    name: '',
    params: [],
    verbs: [],
    children: [],
    size: 0
}
const ENDPOINTS = []
const METHOD = {
    type: 'method',
    id: null,
    name: '',
    implementationsCount: 0,
    size: 0,
    params: [],
}
const CALLEXPRESSION = {
    type: 'callExpression',
    id: null,
    name: '',
    implementationsCount: 0,
    size: 0,
    arguments: [],
}
const CLASSDECORATION = {
    id: null,
    name: null,
    superClass: null,
    implementations: [],
}
const API_LITERAL = ['dvsvc', 'nsvc']
const REST_VERBS = ['GET', 'POST', 'PUT', 'DELETE']
const entryPoint = {
    type: 'module',
    name: 'scouting_new_docImports',
    id: 'scouting_new',
    ext: 'js',
    importNames: [],
    path: `${__dirname}/scouting_new/`,
    parents: [],
    children: [],
    methods: [],
    elements: [],
    endPoints: [],
    size: 0
}
const promises = []

let MODULES = [entryPoint];

const getImports = (data) => {
    return data.body.filter(o => o.type === 'ImportDeclaration');
}

const getModule = (obj, parent) => {
    const module = JSON.parse(JSON.stringify(MODULE));
    const pathObj = path.parse(obj.source.value);
    module.name = pathObj.name;
    module.ext = pathObj.ext ? pathObj.ext.substring(1) : pathObj.ext; // TODO: Need to handle if extenstion doesn't exist
    module.path = getFullPath(obj.source.value, parent);
    module.id = `${module.name}-${module.path}`;
    if (!parent.name.includes('docImports')) {
        module.parents.push(getChildObj(parent))
    }
    module.importNames = obj.specifiers.map((val) => {
        return val.local.name
    });
    // console.log(module.name)
    // console.log(module.path)
    return module;
}

const getMethodsAndEndpoints = (data, parent) => {
    const methods = [];
    const callExpressions = [];
    const classes = []
    console.log('getting methods')
    data.body.forEach(obj => {
        let currentMethod = {};
        let end = 0
        let endpointFound = null;
        const arr = traverseObjForKeyVal(obj, (o, p) => {
            // CLASSES
            if (o.type === 'ClassDeclaration') {
                classes.push({
                    id: o.id.name,
                    name: o.id.name,
                    superClass: o?.superClass?.name || null
                })
            }
            // METHODS
            else if (o.type === 'MethodDefinition' || o.method) {
                const method = JSON.parse(JSON.stringify(METHOD));
                method.id = guidGenerator();
                method.name = o.key.name;
                method.params = o.value?.params.map((_o) => {
                    return {
                        name: _o.left ? _o.left.name : _o.name,
                        value: _o.right ? _o.right.value : null
                    }
                })
                // method.arguments = o.arguments
                currentMethod = method
                methods.push(method)
            }
            // CALL EXPRESSIONS
            else if (o.type === 'CallExpression' || o.type === 'NewExpression') {
                callExpressions.push(getCallExpressions(o, parent, currentMethod, end))
            }
            else if (!o.end || (o.end < end && endpointFound !== null)) {
                if (REST_VERBS.indexOf(o.value) > -1) {
                    const endpoint = ENDPOINTS.find(o => o.id === endpointFound)
                    if (endpoint.verbs.indexOf(o.value) < 0) {
                        endpoint.verbs.push(o.value)
                    }
                }
            }
            else {
                endpointFound = null
            }
        });
    });
    return {methods: methods, callExpressions: callExpressions, classes: classes}
}

const getCallExpressions = (o, parent, currentMethod, end) => {
    end = o.end
    const callExpression = JSON.parse(JSON.stringify(CALLEXPRESSION));
    if (o.callee?.name) {
        callExpression.name = o.callee?.name
    }
    else {
        callExpression.name = o.callee?.property?.name
    }
    callExpression.id = guidGenerator()
    for (arg of o.arguments) {
        if (arg.type === 'ThisExpression') {
            callExpression.arguments.push({
                key: 'this',
                value: currentMethod.name
            })
        }
        else if (arg.type === 'TemplateLiteral') {
            const params = []
            let endpoint = null;
            for (q of arg.quasis) {
                for (literal of API_LITERAL) {
                    if (q.value.raw.includes(literal)) {
                        endpoint = getEndpoint(q.value.raw, literal, parent)
                        endpointFound = endpoint.id
                        break;
                    }
                }
                if (endpoint) {
                    if (q.value.raw.includes('&')) {
                        const param = q.value.raw.split('&')[1].split('=')[0]
                        endpoint.params.push(param);
                    }
                }
                params.push({
                    key: null,
                    value: q.value.raw
                })
            }
            if (endpoint) {
                if (endpoint.id) return
                endpoint.id = guidGenerator()
                endpointFound = endpoint.id
                ENDPOINTS.push(endpoint)
            }
            for (let i = 0; i < arg.expressions.length; i++) {
                params[i].key = arg.expressions[i].type === 'MemberExpression' ? getExpressionObj(arg.expressions[i]) : arg.expressions[i].name
            }
        }
        else if (arg.type === 'Literal') {
            if (typeof arg.value === 'string') {
                let endpoint = null;
                for (literal of API_LITERAL) {
                    if (arg.value.includes(literal)) {
                        endpoint = getEndpoint(arg.value, literal, parent)
                        endpointFound = endpoint.id
                    }
                }
                if (endpoint) {
                    if (endpoint.name === 'PnPTradeModelBoard') {end}
                    if (endpoint.id) return
                    endpoint.id = guidGenerator()
                    endpointFound = endpoint.id
                    ENDPOINTS.push(endpoint)
                }
            }
            callExpression.arguments.push({
                key: typeof arg.value,
                value: arg.value
            })
        }
        else {
            callExpression.arguments.push({
                key: arg.name,
                value: arg.name
            })
        }
    }
    return callExpression
}

const getExpressionObj = (obj, arg) => {
    if (obj.object.object) {
        return `${obj.object.object.name}.${obj.object.property.name}.${obj.property.name}`
    }
    return `${obj.object.name}.${obj.property.name}`
}

const getEndpoint = (path, api, parent) => {
    const endpoint = JSON.parse(JSON.stringify(ENDPOINT));
    endpoint.path = path
    endpoint.api = api
    let splitPath = path;
    splitPath = splitPath.split(`/`)
    if (splitPath[splitPath.length - 1] === '') {
        splitPath = splitPath.filter(n => n)
    }
    if (splitPath[splitPath.length - 1].includes('?')) {
        const params = splitPath[splitPath.length - 1].split('?')
        endpoint.name = params[0]
        const args = params[1].includes('&') ? params[1].split('&') : [params[1]]
        // if (args) {
            for (const arg of args) {
                const keyVal = arg.split('=')
                endpoint.params.push(keyVal[0])
                // endpoint.params.indexOf(keyVal[0]) < 0 ? endpoint.params.push(keyVal[0]) : null
            }
        // }
    } 
    else {
        endpoint.name = splitPath[splitPath.length - 1]
    }
    const endpointIndex = ENDPOINTS.findIndex(o => o.name === endpoint.name);
    if (endpointIndex < 0) {
        // console.log(endpoint)
        endpoint.children.push({name: parent.name, id: parent.id})
        return endpoint
    }
    else {
        for (const param of endpoint.params) {
            ENDPOINTS[endpointIndex].children.push({name: parent.name, id: parent.id})
            ENDPOINTS[endpointIndex].params.indexOf(param) < 0 ? ENDPOINTS[endpointIndex].params.push(param) : null
        }
        return ENDPOINTS[endpointIndex];
    }
}

const traverseObjForKeyVal = (obj, func = () => {}) => {
    const traverse = (obj, parent, func) => {
        if (obj) {
            func(obj, parent)
            for (let key in obj) {
                if (typeof obj[key] === 'object') {
                    if (Array.isArray(obj[key])) {
                        obj[key].forEach(arrObj => {
                            traverse(arrObj, obj, func)
                        })
                    }
                    else {
                        traverse(obj[key], obj, func)
                    }
                }
            }
        }
    }
    traverse(obj, null, func);
}

const getMethodImplementationsCount = (methodName, file) => {
    return file.split(methodName).length - 2;
}

const getMethodSize = (methodName, fileStrArr) => {
    let count = 0;
    const start = fileStrArr.findIndex(o => {
        return o.indexOf(methodName) > -1 && o.indexOf('(') > -1 && o.indexOf('{') > -1 && !o.includes('this.' + methodName);
    })
    let end = 0;
    for (let i = start; i < fileStrArr.length; i++) {
        if (!fileStrArr[i]) continue
        count += (fileStrArr[i].match(/{/g) || []).length
        count -= (fileStrArr[i].match(/}/g) || []).length
        if (count === 0) {
            end = i; break;
        }
    }
    return end - start;
}

const getFullPath = (relativePath, parent) => {
    // const bool = relativePath.includes('../skeletalHelpers.js')
    let parentPath = parent.path;
    const lastIndex = relativePath.lastIndexOf('/');
    relativePath = relativePath.substring(lastIndex, 0);
    for (let alias in aliases) {
        if (relativePath.indexOf(alias) > -1) {
            return `${aliases[alias]}/`;
        }
    }
    // console.log(parent.name.includes('docImports'))
    if (parent.name.includes('_docImports')) {
        parentPath = parentPath.split(__dirname).join(`${process.cwd()}/${baseDir}`)
    }
    const relArr = relativePath.indexOf('../') > -1 ? relativePath.split('../') : relativePath.indexOf('..') > -1 ? ['', ''] : [relativePath.split('./')[1]];
    const parentArr = parentPath.split('/');
    let newPath = ''; 
    if (relArr[0] === undefined) {
        newPath = parentPath;
    } 
    else if (relArr.length > 1) {
        let str = ''
        for (let i = 0; i < parentArr.length - relArr.length; i++) {
            str += parentArr[i] + '/';
        }
        newPath = `${str}${relArr[relArr.length - 1]}/`
        // if (bool) {
        //     console.log(parentArr.length, newPath)
        // }
    } 
    else {
        newPath = `${parentPath}${relArr[0]}/`;
    }
    return newPath
}

const parseHtmlForComponentsPropsEvents = (html) => {
    const arr = [];
    let i = 0;
    const parser = new htmlparser2.Parser({
        onopentag(name, attributes) {
            const obj = {
                name: name,
                attrId: null,
                id: guidGenerator(),
                isComponent: !isHtmlElement(name),
                vEvent: [],
                vClass: [],
                vStyle: [],
                class: [],
                style: [],
                vModel: [],
                vBind: []
            }
            for (let key in attributes) {
                if (key.includes('@') || key.includes('v-on')) obj.vEvent.push({key: key, value: attributes[key]})
                else if (key === 'id' || key === ':id' || key === 'v-bind:id') obj.attrId = attributes[key]
                else if (key === ':class') obj.vClass.push({key: key, value: attributes[key]})
                else if (key === ':style') obj.vStyle.push({key: key, value: attributes[key]})
                else if (key === 'class') obj.class.push({key: key, value: attributes[key]})
                else if (key === 'style') obj.style.push({key: key, value: attributes[key]})
                else if (key === 'v-model') obj.vModel.push({key: key, value: attributes[key]})
                else if (key.includes('v-') || key.includes(':')) obj.vBind.push({key: key, value: attributes[key]})
            }
            arr.push(obj)
        }
    });
    parser.write(html);
    parser.end();
    return arr;
}

const getChildObj = (module) => {
    return { 
        name: module.name, 
        importName: module.importNames,
        path: module.path,
        ext: module.ext,
        id: module.id
    }
}

const init =  (parent) => {
    promises.push(new Promise(async (resolve, reject) => {
        try {
            if (!parent.ext || 
                parent.ext === 'scss' ||
                parent.ext === 'svg' ||
                parent.ext === 'css') {return resolve('nothing') };
            
            const fullFilePath = `${parent.path}${parent.name}${parent.ext ? '.' + parent.ext : ''}`;
            console.log(fullFilePath)
            const fileBuffer = readFileSync(fullFilePath)
            console.log('has path')
            let file = fileBuffer.toString();
            let data,
                html = '';
            const modules = [];
            let fileStrArr = file.split('\n');
            parent.size = fileStrArr.length;
            console.log('parent size', parent.size)
            if (parent.ext === 'vue') {
                const startTemplate = fileStrArr.findIndex(o => o.includes('<template>'))
                const lastIndex = fileStrArr.filter(o => o.includes('</template>'));
                const endTemplate = fileStrArr.lastIndexOf(lastIndex[lastIndex.length - 1])
                const startScript = fileStrArr.findIndex(o => o.includes('<script'))
                const endScript = fileStrArr.findIndex(o => o.includes('</script>'))
                html = fileStrArr.slice().splice(startTemplate + 1, endTemplate - 1 - startTemplate).join('\n');
                fileStrArr = fileStrArr.slice().splice(startScript + 1, endScript - 1 - startScript);
                file = fileStrArr.slice().join('\n');
                parent.elements = parseHtmlForComponentsPropsEvents(html).sort((a, b) => (a.name > b.name) - (a.name < b.name))
            }
            try {
                data = acorn.parse(file, {ecmaVersion: 'latest', sourceType: 'module'})
                console.log('acorn')
            }
            catch (error) {
                console.log(parent.ext)
                console.log(error)
            }
            if (parent.name === 'stats.viewmodel') { 
                writeFile(`./testData.json`, JSON.stringify(data), 'utf8', () => {});
            }
            const methodsAndEndpoints = getMethodsAndEndpoints(data, parent)
            parent.methods = methodsAndEndpoints.methods.sort((a, b) => (a.name > b.name) - (a.name < b.name))
            parent.callExpressions = methodsAndEndpoints.callExpressions.sort((a, b) => (a.name > b.name) - (a.name < b.name))
            parent.classes = methodsAndEndpoints.classes.sort((a, b) => (a.name > b.name) - (a.name < b.name))
            // parent.endpoints = getEndpoints(data)
            for (const method of parent.methods) {
                method.implementationsCount += getMethodImplementationsCount(method.name, html + file);
                method.size = getMethodSize(method.name, fileStrArr);
            }
            const imports = getImports(data);
            imports.forEach(o => {
                const module = getModule(o, parent);
                const existingModule = MODULES.find(o => o.id === module.id);
                if (!module.name.includes('docImports')) {
                    parent.children.push(getChildObj(module))
                }
                parent.children.sort((a, b) => (a > b) - (a < b))
                if (existingModule) {
                    existingModule.parents = existingModule.parents.concat(module.parents);
                }
                else if (!module.name.includes('docImports')) {
                    MODULES.push(module)
                }
                init(module)
            })
            parent.parents.sort((a, b) => (a > b) - (a < b));
            resolve('success!');
        }
        catch (error) {
            // console.log(error)
            resolve(error)
        }
    }))

}

init(MODULES[0]);

Promise.all(promises).then(all => {
    let count = 0
    let childCount = 0
    const classes = []
    for (const parent of MODULES) {
        if (Array.isArray(parent.classes)) {
            for (const pClass of parent.classes) {
                const allExps = []
                MODULES.forEach(module => {
                    if (!module.callExpressions || module.id === parent.id) return
                    const exps = module.callExpressions.filter(_c => _c?.name === pClass.name).map(exp => exp.id)
                    if (exps.length) {
                        console.log('children', module.children.findIndex(child => child.id === parent.id) < 0)
                        if (module.children.findIndex(child => child.id === parent.id) < 0) {
                            module.children.push(getChildObj(parent))
                            childCount++
                        }
                        console.log('parent', parent.parents.findIndex(child => child.id === module.id) < 0)
                        if (parent.parents.findIndex(child => child.id === module.id) < 0) {
                            parent.parents.push(getChildObj(module))
                            childCount++
                        }
                    }
                    allExps.push(...exps)
                })
                pClass.implementations = allExps
                !pClass.implementations.length ? count++ : classes.push(pClass)
            }
        }
    }
    console.log(count)
    console.log(childCount)
    ENDPOINTS.sort((a, b) => (a.name > b.name) - (a.name < b.name));
    // console.log(ENDPOINTS)
    writeFile(`./classes.json`, JSON.stringify(classes), 'utf8', () => {});
    writeFile(`./test.json`, JSON.stringify([...ENDPOINTS, ...MODULES]), 'utf8', () => {});
});