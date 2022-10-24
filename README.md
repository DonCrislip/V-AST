# V•AST
## V•AST: Visualizing the Abstract Syntax Tree of your code galaxy
### Getting Started

Install the **V•AST cli** package globally.

    npm i -g @doncrislip/v-ast

Next, you will need to initialize your V•AST application. Go to whichever directory you would like to run it in - it doesn't matter where :)

    cd desktop/some-dir

Then run:

    v-ast init

This will create a new project directory with the following files:

    v-ast/
        - favicon.ico
        - index.html
        - index.js
        - package.json
        - server.js
        - v-ast.config.js

Change into this directory:

    cd v-ast

Now, in your favorite text editor, open the **v-ast.config.js**. This is where you will define the entry points to all of the projects you would like to visualize. The config file will look something like this: 

    export default {
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
    }

If you use aliases in your bundling, you will want to include them in this config file. Otherwise, keep the aliases as an empty object.

    aliases: {}

> The **hasEntireCodeGalaxyOption** is set to true by default, but if you have a lot of entry points with a lot of code, you may want to switch this to **false** for performance reasons. 


Once you have your entry points set up, you need to build the files V•AST will use:

    v-ast build

A json file will be created for each entry point inside the v-ast dir. These json files will have the name of the entry point along with **.v-ast.json** appended to it. This command will also create a master entry point file. See the example below:

    v-ast/
        ...
        - entrypoints.v-ast.js
        - someProjectEntryPoint.v-ast.json
        - anotherProjectEntryPoint.v-ast.json

Now that is all left to do is run the project:

    v-ast run

This will initialize a server on port :8080

    http://localhost:8080/

Have fun!