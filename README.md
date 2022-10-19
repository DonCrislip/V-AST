# V•LAC
## V•LAC: Visual Learning & Auditing of your Code galaxy
### Getting Started

Install the **v•lac cli** package globally.

    npm i -g @doncrislip/v-lac

Then, you need to create a **v-lac.config.js** file.

    v-lac init

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

If you use aliases in your bundling, you will want to include them in this config file. You also need to define what entry points to use so V•LAC knows which files to parse.

Once you have this done, all you need to do is run:

    v-lac

A json file will be created for each entry point inside the dir of the entry point. This json file will have the name of the entry point along with **.v-lac.json** appended to it. See the example below:

    src/
        someEntryPoint.js
        someEntryPoint.v-lac.json
