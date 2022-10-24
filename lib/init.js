import { mkdirSync, writeFileSync, readdirSync } from 'fs'

export default () => {
    const rootDir = import.meta.url.replace('/bin/index.js', '').replace('file://', '');
    mkdirSync('./v-ast/')
    writeFileSync(`./v-ast/v-ast.config.js`, 
`export default {
    hasEntireCodeGalaxyOption: true,
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

