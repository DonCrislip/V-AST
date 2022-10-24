#! /usr/bin/env node

/**
 * TODOS:
 * - map services to methods and files
 * - how to handle edge / custom import solutions
 * - provide an overall summary for the entire system
 * - show event binding connections
 * - show css file relationships
 * - list out scoped css within parent info
 * - what is getting imported but not used
 * - hide/show code planets
 * - handle NextJS routing as well as NuxtJS routing
 */

import {writeFileSync, mkdirSync, readFileSync, lstatSync, readdirSync} from 'fs'
import child_process from 'child_process'
import babelParser from '@babel/parser'
import path from "path";
import * as htmlparser2 from 'htmlparser2'
import { guidGenerator, traverseObj } from '@doncrislip/simpleutils'
import isHtmlElement from '../utils/allHtmlElements.js'

if (process.argv[2] === 'init') {
    const rootDir = import.meta.url.replace('/bin/index.js', '').replace('file://', '');
    mkdirSync('./v-ast/')
    writeFileSync(`./v-ast/v-ast.config.js`, 
`export default {
    entryPoints: [
        // {
        //     name: 'App Name',
        //     path: '/absolute-path-to-entry-point',
        //     aliases: {
        //         'some-alias': '/absolute-path-for-alias'
        //     }
        // }
    ]
}
`, 'utf8', () => {});
    try {
        const dir = readdirSync(`${rootDir}/src/`);
        for (const file of dir) {
            const fileCopy = readFileSync(`${rootDir}/src/${file}`)
            writeFileSync(`./v-ast/${file}`, fileCopy)
        }
    } catch (err) {
        console.error(err);
    }
}

else if (process.argv[2] === 'run') {
    child_process.fork('./server.js')
}

else if (process.argv[2] === 'build') {
        
    const typeKind = {
        ImportDeclaration: 'ImportDeclaration',
        ClassDeclaration: 'ClassDeclaration',
        MethodDefinition: 'MethodDefinition',
        CallExpression: 'CallExpression',
        NewExpression: 'NewExpression',
        ThisExpression: 'ThisExpression',
        TemplateLiteral: 'TemplateLiteral'
    }
    const __dirname = process.cwd();

    import(`${__dirname}/v-ast.config.js`).then((module) => {
        const CONFIG = module.default

        let allModules = []
        let allEndpoints = []
        let promises = []
        let entryPoint = {}
        let aliases = []

        const ALL_IMPORTS = []
        const MODULE = {
            id: null,
            type: 'module',
            displayName: '',
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



        const getImports = (data) => {
            return data.filter(o => o.type === typeKind.ImportDeclaration);
        }

        const getModule = (obj, parent) => {
            const module = JSON.parse(JSON.stringify(MODULE));
            const pathObj = path.parse(obj.source.value);
            module.name = pathObj.name;
            module.ext = pathObj.ext === '' ? parent.ext : pathObj.ext
            module.path = getFullPath(obj.source.value, parent);
            module.id = `${module.name}-${module.path}`;
            console.log(module)
            if (!parent.name.includes('docImports')) {
                module.parents.push(getChildObj(parent))
            }
            module.importNames = obj.specifiers.map((val) => {
                return val.local.name
            });
            return module;
        }

        const getMethodsAndEndpoints = (data, parent) => {
            const methods = [];
            const callExpressions = [];
            const classes = []
            
            data.forEach(obj => {
                let currentMethod = {};
                let end = 0
                let endpointFound = null;
                const arr = traverseObj(obj, (o, p) => {
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
                            const endpoint = allEndpoints.find(o => o.id === endpointFound)
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
            let endpointFound = null
            end = o.end
            const callExpression = JSON.parse(JSON.stringify(CALLEXPRESSION));
            if (o.callee?.name) {
                callExpression.name = o.callee?.name
            }
            else {
                callExpression.name = o.callee?.property?.name
            }
            callExpression.id = guidGenerator()
            for (const arg of o.arguments) {
                if (arg.type === 'ThisExpression') {
                    callExpression.arguments.push({
                        key: 'this',
                        value: currentMethod.name
                    })
                }
                else if (arg.type === 'TemplateLiteral') {
                    const params = []
                    let endpoint = null;
                    for (const q of arg.quasis) {
                        for (const literal of API_LITERAL) {
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
                        allEndpoints.push(endpoint)
                    }
                    for (let i = 0; i < arg.expressions.length; i++) {
                        params[i].key = arg.expressions[i].type === 'MemberExpression' ? getExpressionObj(arg.expressions[i]) : arg.expressions[i].name
                    }
                }
                else if (arg.type === 'Literal') {
                    if (typeof arg.value === 'string') {
                        let endpoint = null;
                        for (const literal of API_LITERAL) {
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
                            allEndpoints.push(endpoint)
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
            const endpointIndex = allEndpoints.findIndex(o => o.name === endpoint.name);
            if (endpointIndex < 0) {
                // console.log(endpoint)
                endpoint.children.push({name: parent.name, id: parent.id})
                return endpoint
            }
            else {
                for (const param of endpoint.params) {
                    allEndpoints[endpointIndex].children.push({name: parent.name, id: parent.id})
                    allEndpoints[endpointIndex].params.indexOf(param) < 0 ? allEndpoints[endpointIndex].params.push(param) : null
                }
                return allEndpoints[endpointIndex];
            }
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
            const lastIndex = relativePath.lastIndexOf('/');
            relativePath = relativePath.substring(lastIndex, 0);

            for (let alias in aliases) {
                if (relativePath.indexOf(alias) > -1) {
                    return relativePath.replace(alias, aliases[alias]);
                }
            }
            
            if (!relativePath.includes('.')) return relativePath
            return path.resolve(parent.path, relativePath)
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

        /**
         * Parse and return ts as AST
         * @param {*} data 
         * @returns 
         */
        const parseCode = (file) => {
            try {
                const data = babelParser.parse(file, {
                    sourceType: "module",
                    plugins: [
                        'jsx',
                        'typescript'
                    ]
                })
                return data.program.body
            }
            catch (error) {
                // console.log('parse', file)
            }
        }

        const init = async (parent) => {
            if (parent.path === '') return
            
            await new Promise(async (resolve, reject) => {
                let fullFilePath = `${parent.path}/${parent.name}${parent.ext}`;
                const pathObj = path.parse(fullFilePath)
                // console.log(fullFilePath)
                
                try{
                    if (lstatSync(fullFilePath).isDirectory()) {
                        const contents = readdirSync(fullFilePath)
                        fullFilePath = `${fullFilePath}/${contents[0]}`
                    }
                    else if (pathObj.ext === '') {
                        fullFilePath = `${fullFilePath}${parent.ext}`
                    }
                }
                catch(error){
                    // console.log(error)
                }
                
                try {
                    if (parent.ext === '.scss' ||
                        parent.ext === '.svg' ||
                        parent.ext === '.css') {return resolve('nothing') };
                    
                    const fileBuffer = readFileSync(fullFilePath)
                    let file = fileBuffer.toString(),
                        data,
                        html = '',
                        fileStrArr = file.split('\n');

                    parent.size = fileStrArr.length;
                    if (parent.ext === '.vue') {
                        const startTemplate = fileStrArr.findIndex(o => o.includes('<template>'))
                        const lastIndex = fileStrArr.filter(o => o.includes('</template>'));
                        const endTemplate = fileStrArr.lastIndexOf(lastIndex[lastIndex.length - 1])
                        const startScript = fileStrArr.findIndex(o => o.includes('<script ') || o.includes('<script>'))
                        const endScript = fileStrArr.findIndex(o => o.includes('</script>'))

                        html = fileStrArr.slice().splice(startTemplate + 1, endTemplate - 1 - startTemplate).join('\n');
                        fileStrArr = fileStrArr.slice().splice(startScript + 1, endScript - 1 - startScript);
                        file = fileStrArr.slice().join('\n');
                        parent.elements = parseHtmlForComponentsPropsEvents(html).sort((a, b) => (a.name > b.name) - (a.name < b.name))
                    }
                    data = parseCode(file)
                    let methodsAndEndpoints = {}
                    try {
                        methodsAndEndpoints = getMethodsAndEndpoints(data, parent)
                    }
                    catch (error) {
                        console.log(error)
                    }

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
                        const existingModule = allModules.find(o => o.id === module.id);
                        parent.children.push(getChildObj(module))
                        parent.children.sort((a, b) => (a > b) - (a < b))
                        if (existingModule) {
                            existingModule.parents = existingModule.parents.concat(module.parents);
                        }
                        allModules.push(module)
                        init(module)
                    })
                    parent.parents.sort((a, b) => (a > b) - (a < b));
                    resolve('success!');
                }
                catch (error) {
                    // console.log(error)
                    resolve(error)
                }
            })

        }
        
        CONFIG.entryPoints.forEach(async entry => {
            const pathData = path.parse(entry.path)
            entryPoint = JSON.parse(JSON.stringify(MODULE))
            entryPoint.displayName = entry.name
            entryPoint.name = pathData.name
            entryPoint.id = pathData.dir + pathData.base
            entryPoint.ext = pathData.ext
            entryPoint.path = pathData.dir
            allModules = [entryPoint]
            promises = []
            allEndpoints = []
            aliases = entry.aliases

            init(allModules[0]);

            let count = 0
            let childCount = 0
            const classes = []
            
            for (const parent of allModules) {
                if (Array.isArray(parent.classes)) {
                    for (const pClass of parent.classes) {
                        const allExps = []
                        
                        allModules.forEach(module => {
                            if (!module.callExpressions || module.id === parent.id) return
                            const exps = module.callExpressions.filter(_c => _c?.name === pClass.name).map(exp => exp.id)
                            if (exps.length) {
                                if (module.children.findIndex(child => child.id === parent.id) < 0) {
                                    module.children.push(getChildObj(parent))
                                    childCount++
                                }
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
            allEndpoints.sort((a, b) => (a.name > b.name) - (a.name < b.name));
            const importName = entryPoint.displayName.replace(' ', '_')
            writeFileSync(`./${importName}.v-ast.json`, JSON.stringify([...allEndpoints, ...allModules]), 'utf8', () => {});
            console.log(`finished writing ${entryPoint.path}/${importName}.v-ast.json`)
            ALL_IMPORTS.push({
                name: importName,
                import: `import ${importName} from './${importName}.v-ast.json' assert { type: "json" }\n`
            })
        })
        let entrypointsFile = ''
        for (const importObj of ALL_IMPORTS) {
            entrypointsFile += importObj.import
        }
        entrypointsFile += 'export default {'
        for (let i = 0; i < ALL_IMPORTS.length; i++) {
            entrypointsFile += i === ALL_IMPORTS.length - 1 ? ALL_IMPORTS[i].name : ALL_IMPORTS[i].name + ','
        }
        entrypointsFile += '}'
        writeFileSync(`./entrypoints.v-ast.js`, entrypointsFile, 'utf8', () => {});
        console.log('FINISHED ALL FILES')
    })
}

