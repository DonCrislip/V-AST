import { mkdirSync, writeFileSync, readdirSync, readFileSync } from 'fs'

export default (url) => {
    const rootDir = url.replace('/bin/index.js', '').replace('file://', '');
    mkdirSync(`${rootDir}/build/`)
    writeFileSync(`${rootDir}/build/v-ast.config.js`, 
`export default {
    hasEntireCodeGalaxyOption: true,
    apiLiterals: [],
    entryPoints: [
        // {
        //     name: 'App Name',
        //     path: '/absolute-path-to-entry-point',
        //     aliases: {
        //         'some-alias': '/absolute-path-for-alias'
        //     }
        // }
    ]
}`, 'utf8', () => {});

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

