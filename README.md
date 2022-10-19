# V•AST
## V•AST: Visualizing the Abstract Syntax Tree of your code galaxy
### Getting Started

Install the **V•AST cli** package globally.

    npm i -g @doncrislip/v-ast

Then, you need to create a **v-ast.config.js** file.

    v-ast init

This will create a config file in your project's root dir. The config will look like this:

    Object.defineProperty(exports, '__esModule', { value: true });

    module.exports = {
        aliases: {
            // 'alias': './'
        },
        entryPoints: [
            // {
            //     name: 'App Name',
            //     path: './path-to-entry-point'
            // }
        ]
    }

If you use aliases in your bundling, you will want to include them in this config file. You also need to define what entry points to use so V•AST knows which files to parse.

Once you have this done, all you need to do is run:

    v-ast

A json file will be created for each entry point inside the dir of the entry point. This json file will have the name of the entry point along with **.v-ast.json** appended to it. See the example below:

    src/
        someEntryPoint.js
        someEntryPoint.v-ast.json
