
import entrypoints from './entrypoints.v-ast.js'

const groupEnum = {
    js: 0,
    jsx: 1,
    ts: 2,
    tsx: 3,
    vue: 4
}

const getElement = (string, parent) => {
    const name = parent.elements ? parent.elements.find(o => o.name === string || o.name === (string.split(/(?=[A-Z])/).join('-')).toLowerCase()) : null;
    return !name ? null : name;
}

const allData = []
for (const entryPoint of Object.keys(entrypoints)) {
    const json = entrypoints[entryPoint]
    json.sort((a, b) => b.size - a.size)
    const _json = {
        nodes: [],
        links: [],
        name: entryPoint
    }

    for (const parent of json) {
    
        parent.show = true
        _json.nodes.push(parent);
    
        parent.group = parent.ext ? groupEnum[parent.ext] : 5;
        
        parent.children.forEach(child => {
            const connector = child.importName?.length === 1 ? getElement(child.importName[0], parent) : null;
            if (connector) {
                connector.vBind.forEach(binding => {
                    binding.id = `${connector.id}-${binding.key}`
                    binding.parent = parent.name
                    binding.parentPath = parent.path
                    binding.parentExt = parent.ext
                    binding.child = child.name
                    binding.childPath = child.path
                    binding.childExt = child.ext
                    binding.show = true
                    _json.nodes.push(binding);
                    _json.links.push({
                        source: parent.id,
                        target: binding.id,
                        value: 1,
                        show: true
                    },
                    {
                        source: binding.id,
                        target: child.id,
                        value: 1,
                        show: true
                    })
                });
            }
            else {
                _json.links.push({
                    source: parent.id,
                    target: child.id,
                    value: 1,
                    show: true
                })
            }
        })
        if (parent.children.length) {
            console.log(parent.name)
        }
    }
    allData.push(_json)
}

const satelliteOutline = 'M317.02,48.09c-.64,.5-1.33,.95-1.9,1.52-33.17,33.15-66.32,66.32-99.48,99.48-.4,.4-.83,.76-1.34,1.23-6.15-6.21-12.21-12.34-18.19-18.38-3.66,3.75-7.14,7.33-10.7,10.97,8.72,8.65,17.75,17.61,26.88,26.66-5.47,5.31-10.62,10.31-16.05,15.58,2.79,2.6,5.07,4.82,7.48,6.9,.38,.33,1.48,.24,2-.07,9.5-5.76,19.69-8.09,30.71-6.21,2.12,.36,4.17,1.1,6.73,1.8-1.17,1.04-1.9,1.73-2.67,2.36-6.63,5.41-13.26,10.83-19.93,16.2-1.16,.93-1.77,1.9-1.49,3.45,.2,1.13,.14,2.31,.16,3.47,.03,3.38-2.7,6.35-6,5.75-4.25-.78-6.8,.96-9.2,4.13-4.44,5.84-9.15,11.48-13.75,17.2-.6,.74-1.22,1.46-2.28,2.72-.75-2.73-1.59-4.92-1.95-7.19-1.71-10.67,.47-20.61,6.1-29.79,.78-1.28,.85-2.22-.17-3.22-2.07-2.02-4.16-4.01-6.39-6.15-4.95,5.05-9.99,10.19-15.05,15.37-9.21-9.26-18.19-18.29-27.06-27.2-3.72,3.78-7.22,7.34-10.83,11,5.86,5.72,12.05,11.78,18.1,17.7-34.54,34.52-68.68,68.65-103.13,103.09-1.22-1.29-2.66-2.9-4.19-4.43-13.97-13.99-27.96-27.97-41.95-41.94-.44-.44-.97-.79-1.47-1.18,0-.13,0-.26,0-.39,9.3-9.27,18.62-18.53,27.91-27.82,21.51-21.49,43-43,64.5-64.5,3.37-3.37,6.73-6.75,10.2-10.23,5.9,5.76,11.72,11.45,17.92,17.52,3.56-3.63,6.88-7,10.49-10.68-10.99-11.12-21.71-21.96-32.56-32.93,4.04-3.87,8.06-7.73,12.16-11.65-1.44-1.65-2.47-2.86-3.52-4.05-.76-.86-.79-1.69,.05-2.53,4.96-4.96,9.92-9.92,14.87-14.9,.79-.79,1.59-.75,2.39-.09,1.23,1.03,2.43,2.09,3.94,3.38,3.85-4.05,7.69-8.09,11.72-12.33,3.53,3.56,6.71,6.84,9.95,10.04,7.2,7.1,14.44,14.16,21.62,21.28,1.11,1.1,1.87,1.15,3.01,.06,2.97-2.85,6.04-5.59,9.4-8.67-6.23-6.39-11.91-12.21-17.14-17.58C201,68.52,234.98,34.33,269.1,0c2.95,2.9,5.91,5.75,8.82,8.65,12.55,12.51,25.08,25.03,37.62,37.54,.43,.43,.98,.75,1.48,1.12v.77Zm-101.99,81.64c28.11-28.1,56.15-56.13,83.96-83.94-9.64-9.69-19.44-19.53-29.13-29.27-27.97,27.97-56.02,56.01-84.03,84.02,9.73,9.73,19.56,19.56,29.19,29.19Zm-111.76,54.94c-28.04,28.25-55.82,56.25-83.33,83.97,9.63,9.67,19.43,19.5,29.07,29.19,27.84-27.84,55.78-55.78,83.33-83.32-9.55-9.8-19.2-19.7-29.07-29.83Z'

const vm = new Vue({
    el: '#vue-app',
    data() {
        return {
            allData: allData,
            obj: null,
            selectedEntryPoint: 'all',
            nodeId: d => d,
            nodeGroup: d => d.group, // given d in nodes, returns an (ordinal) value for color
            nodeSize: d => !d.size || (d.size / 20) < 5 ? 5 : d.size / 20, // node radius, in pixels
            nodeTitle: d => {  // given d in nodes, a title string
                return d.name ? `${d.name}` : `{ ${d.key} }` // need to distinguish better
            },
            linkStrokeWidth: l => Math.sqrt(l.value), // given d in nodes, returns a unique identifier (string)
            nodeGroups: [], // an array of ordinal values representing the node groups
            nodeFill: "currentColor", // node stroke fill (if not using a group color encoding)
            nodeStroke: "#fff", // node stroke color
            nodeStrokeWidth: 1.5, // node stroke width, in pixels
            nodeStrokeOpacity: 1, // node stroke opacity
            nodeStrength: -500,
            linkSource: ({source}) => source, // given d in links, returns a node identifier string
            linkTarget: ({target}) => target, // given d in links, returns a node identifier string
            linkStroke: "#444", // link stroke color
            linkStrokeOpacity: 0.5, // link stroke opacity
            linkStrokeLinecap: "round", // link stroke linecap
            linkStrength: 1,
            colors: d3.schemeTableau10, // an array of color strings, for the node groups
            width: 1000, // outer width, in pixels
            height: 600, // outer height, in pixels
            invalidation: null, // when this promise resolves, stop the simulation
            simulation: null,
            svg: null,
            zoom: null,
            link: null,
            circleGroup: null,
            node: null, 
            text: null,
            connectorGroup: null,
            connector: null,
            serviceGroup: null,
            service: null,
            serviceName: null,
        }
    },
    computed: {

        elementBindings() {
            return this.obj.elements.filter(o => o.vBind.length && !o.isComponent)
        },
        componentBindings() {
            // ERROR occurs for planets that only have outgoing connections
            return this.obj.elements.filter(o => o.vBind.length && o.isComponent)
        },
        
        N() {return d3.map(this.compData.nodes, this.nodeId).map(this.intern)},
        LS() {return d3.map(this.compData.links, this.linkSource).map(this.intern)},
        LT() {return d3.map(this.compData.links, this.linkTarget).map(this.intern)},
        T() { return this.nodeTitle == null ? null : d3.map(this.compData.nodes, this.nodeTitle)                  },
        G() { return this.nodeGroup == null ? null : d3.map(this.compData.nodes, this.nodeGroup).map(this.intern) },
        S() { return this.nodeSize == null ? null : d3.map(this.compData.nodes, this.nodeSize)                    },
        W() { return typeof this.linkStrokeWidth !== "function" ? null : d3.map(this.compData.links, this.linkStrokeWidth)   },
        L() { return typeof this.linkStroke !== "function" ? null : d3.map(this.compData.links, this.linkStroke)             },
        compData() {
            let obj = {
                nodes: [],
                links: []
            }
            if (this.selectedEntryPoint === 'all') {
                for (const entry of this.allData) {
                    obj.nodes = obj.nodes.concat(entry.nodes.filter(o => o.show))
                    obj.links = obj.links.concat(entry.links.filter(o => o.show))
                }
            }
            else {
                obj = this.allData.find(o => o.name === this.selectedEntryPoint)
            }
            return obj
        },
        entryPoints() {
            const arr = [{
                name: 'Entire Code Galaxy',
                id: 'all'
            }]
            for (const entry of this.allData) {
                arr.push({
                    name: entry.name.replace('_', ' '),
                    id: entry.name
                })
            }
            return arr
        }
    },
    methods: {
        intern(value) {
            return value !== null && typeof value === "object" ? value.valueOf() : value;
        },
        ticked() {
            this.link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
        
            this.node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        
            this.text
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        
            this.connector
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        
            this.service
                .attr("style", d => `translate: ${d.x - 15}px ${d.y - 15}px`)
        
            this.serviceName
                .attr("x", d => d.x)
                .attr("y", d => d.y - 15);
        },
        drag(simulation) {    
            function dragstarted(event) {
                if (!event.sourceEvent.shiftKey) return;
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }
            
            function dragged(event) {
                if (!event.sourceEvent.shiftKey) return;
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }
            
            function dragended(event) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }
            
            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        },
        handleZoom(e) {
            d3.selectAll('svg > g')
                .attr('transform', e.transform);
        },
        chart() {
            if (this.svg) document.getElementsByTagName('svg')[0].remove()

            if (this.nodeTitle === undefined) this.nodeTitle = (_, i) => this.N[i];

            this.compData.nodes = d3.map(this.compData.nodes, (_, i) => this.N[i]);
            this.compData.links = d3.map(this.compData.links, (_, i) => ({source: this.LS[i], target: this.LT[i], show: true}));

            if (this.G && this.nodeGroups === undefined) this.nodeGroups = d3.sort(this.G);
            // Construct the scales.
            this.color = this.nodeGroup == null ? null : d3.scaleOrdinal(this.nodeGroups, this.colors);

            // Construct the forces.
            this.forceNode = d3.forceManyBody();
            this.forceLink = d3.forceLink(this.compData.links).id((link) => {
                const node = this.N.find(o => o.index === link.index)
                if (!node) { console.log(link); return false }
                return node.id
            });
            if (this.nodeStrength !== undefined) this.forceNode.strength(this.nodeStrength);
            if (this.linkStrength !== undefined) this.forceLink.strength(this.linkStrength);


            this.simulation = d3.forceSimulation(this.compData.nodes)
                .force("link", this.forceLink)
                .force("charge", this.forceNode)
                .force("center",  d3.forceCenter())
                .on("tick", this.ticked)
            this.svg = d3.select("#chart").append('svg')
                .attr("width", '100%')
                .attr("height", '100%')
                .attr("viewBox", [-this.width / 2, -this.height / 2, this.width, this.height])
                .attr("style", "max-width: 100%;")
            this.zoom = d3.zoom()
                .duration(2000)
                .on('zoom', this.handleZoom)
            this.link = this.svg.append("g")
                .attr("stroke", typeof this.linkStroke !== "function" ? this.linkStroke : null)
                .attr("stroke-opacity", this.linkStrokeOpacity)
                .attr("stroke-width", typeof this.linkStrokeWidth !== "function" ? this.linkStrokeWidth : null)
                .attr("stroke-linecap", this.linkStrokeLinecap)
                .attr('class', 'lines')
                .selectAll("line")
                .data(this.compData.links)
                .join("line")
            this.circleGroup = this.svg.append("g")
                .attr('class', 'circles')
                .selectAll('g')
                .data(this.compData.nodes.filter(o => o.type === 'module'))
                .enter().append('g').on('click', (e) => {
                    vm.obj = e.target.__data__;
                    this.node._groups.forEach(n => {
                        n.forEach(g => g.classList.remove('selected'))
                    })
                    e.target.classList.add('selected')

                    this.link._groups.forEach(n => {
                        n.forEach(g => g.classList.remove('selected', 'source', 'target'))
                    })
                    const arr = this.compData.links.filter(l => l.source.id === e.target.__data__.id || l.target.id === e.target.__data__.id);
                    arr.forEach(l => {
                        this.link._groups.forEach(n => {
                            n.find(o => o.__data__.index === l.index).classList.add('selected', (l.source.id === e.target.__data__.id ? 'source' : 'target'))
                        })
                    })
                })
            this.node = this.circleGroup.append('circle')
                .attr("fill", this.nodeFill)
                .attr("stroke", this.nodeStroke)
                .attr("stroke-opacity", this.nodeStrokeOpacity)
                .attr("stroke-width", this.nodeStrokeWidth)
                .attr("r", this.nodeSize)
                .call(this.drag(this.simulation))
            this.text = this.circleGroup.append('text')
                .attr('text-anchor', 'middle')
                .attr('class', 'module-name')
            this.connectorGroup = this.svg.append("g")
                .attr('class', 'connectors')
                .selectAll('g')
                .data(this.compData.nodes.filter(o => o.key))
                .enter().append('g')
            this.connector = this.connectorGroup.append('text')
                .attr('text-anchor', 'middle')
                .attr('class', 'module-name')
                .call(this.drag(this.simulation))
                .on('click', (e) => {
                    vm.obj = e.target.__data__;
                    this.node._groups.forEach(n => {
                        n.forEach(g => g.classList.remove('selected'))
                    })
                    this.link._groups.forEach(n => {
                        n.forEach(g => g.classList.remove('selected', 'source', 'target'))
                    })
                    const arr = this.compData.links.filter(l => l.source.id === e.target.__data__.id || l.target.id === e.target.__data__.id);
                    arr.forEach(l => {
                        this.link._groups.forEach(n => {
                            n[l.index].classList.add('selected', (l.source.id === e.target.__data__.id ? 'source' : 'target'))
                        })
                    })
                    e.target.classList.add('selected')
                })
            this.serviceGroup = this.svg.append("g")
                .attr('class', 'endpoints')
                .selectAll('g')
                .data(this.compData.nodes.filter(o => o.type === 'endpoint'))
                .enter().append('g')
                .on('click', (e) => {
                    vm.obj = e.target.__data__;
                    this.node._groups.forEach(n => {
                        n.forEach(g => g.classList.remove('selected'))
                    })
                    this.link._groups.forEach(n => {
                        n.forEach(g => g.classList.remove('selected', 'source', 'target'))
                    })
                    const arr = this.compData.links.filter(l => l.source.id === e.target.__data__.id || l.target.id === e.target.__data__.id);
                    arr.forEach(l => {
                        this.link._groups.forEach(n => {
                            n[l.index].classList.add('selected', (l.source.id === e.target.__data__.id ? 'source' : 'target'))
                        })
                    })
                    e.target.classList.add('selected')
                })
            this.service = this.serviceGroup.append('path')
                .attr("d", satelliteOutline)
                .attr('class', 'satellite')
                .call(this.drag(this.simulation))
            this.serviceName = this.serviceGroup.append('text')
                .attr('text-anchor', 'middle')
                .attr('class', 'module-name')

            this.setNodeValues()
            
            d3.select('svg')
                .call(this.zoom)
                .call(this.zoom.transform, d3.zoomIdentity.scale(0.13))
        },
        setNodeValues() {
            if (this.W) this.link.attr("stroke-width", ({index: i}) => this.W[i]);
            if (this.L) this.link.attr("stroke", ({index: i}) => this.L[i]);
            if (this.S) this.node.attr("r", ({index: i}) => this.S[i]);
            if (this.G) this.node.attr("fill", ({index: i}) => this.color(this.G[i]));
            if (this.T) this.text.text(({index: i}) => this.T[i]);
            if (this.T) this.connector.text(({index: i}) => this.T[i]);
            if (this.T) this.serviceName.text(({index: i}) => this.T[i]);
            if (this.invalidation != null) this.invalidation.then(() => this.simulation.stop());
        },
        updateChart() {
            this.link = this.svg.selectAll('.lines')
            .selectAll('line')
            .data(this.compData.links).join('line')
            .attr("stroke", typeof this.linkStroke !== "function" ? this.linkStroke : null)
            .attr("stroke-opacity", this.linkStrokeOpacity)
            .attr("stroke-width", typeof this.linkStrokeWidth !== "function" ? this.linkStrokeWidth : null)
            .attr("stroke-linecap", this.linkStrokeLinecap)
        
            this.connector
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        
            this.service
                .attr("style", d => `translate: ${d.x - 15}px ${d.y - 15}px`)
        
            this.serviceName
                .attr("x", d => d.x)
                .attr("y", d => d.y - 15);
           
            this.circleGroup = this.svg.selectAll('.circles').selectAll('g')
                .data(this.compData.nodes.filter(o => o.type === 'module'))
                .join(enter => {
                    const g = enter.append('g')
                    g.on('click', (e) => {
                        vm.obj = e.target.__data__;
                        this.node._groups.forEach(n => {
                            n.forEach(g => g.classList.remove('selected'))
                        })
                        e.target.classList.add('selected')
    
                        this.link._groups.forEach(n => {
                            n.forEach(g => g.classList.remove('selected', 'source', 'target'))
                        })
                        const arr = this.links.filter(l => l.source.id === e.target.__data__.id || l.target.id === e.target.__data__.id);
                        arr.forEach(l => {
                            this.link._groups.forEach(n => {
                                n[l.index].classList.add('selected', (l.source.id === e.target.__data__.id ? 'source' : 'target'))
                            })
                        })
                    })
                    g.append('circle')
                    .attr("fill", this.nodeFill)
                    .attr("stroke", this.nodeStroke)
                    .attr("stroke-opacity", this.nodeStrokeOpacity)
                    .attr("stroke-width", this.nodeStrokeWidth)
                    .attr("r", this.nodeSize)
                    .attr("fill", d => this.color(d.group))
                    .call(this.drag(this.simulation))
                    g.append('text')
                        .attr('text-anchor', 'middle')
                        .attr('class', 'module-name')
                        .text(this.nodeTitle)
                })
            this.node = this.svg.selectAll('circle')
            this.text = this.svg.selectAll('.circles').selectAll('text')
            this.ticked();
        },
        handleEntryPointChange(entryPoint) {
            this.chart()
        },
        filterOnEntryPoint(entryPoint) {
            const nodes = !entryPoint ? [] : [entryPoint]
            for (const link of this.links) {
                if (nodes.findIndex(node => node.id === link.target.id || 
                    node.id === link.source.id || 
                    node.target?.id === link.target.id || 
                    node.source?.id === link.source.id ||
                    node.source?.id === link.target.id || 
                    node.target?.id === link.source.id
                ) > -1) {
                    nodes.push(link)
                }
            }
            for (const link of this.links) {
                if (nodes.length && nodes.findIndex(node => node.id === link.target.id || 
                    node.id === link.source.id || 
                    node.target?.id === link.target.id || 
                    node.source?.id === link.source.id ||
                    node.source?.id === link.target.id || 
                    node.target?.id === link.source.id) < 0) {
                    link.show = false
                }
                else {
                    link.show = true
                }
            }
            for (const node of this.nodes) {
                if (nodes.length && nodes.findIndex(_node => _node.id === node.id || 
                    _node.target?.id === node.id || 
                    _node.source?.id === node.id) < 0) {
                    node.show = false
                }
                else {
                    node.show = true
                }
            }
            this.updateChart()
        },
        selectPlanet(e, parent) {
            if (e.ctrlKey || e.metaKey) {
                // get all ids associated with parent
                this.filterOnEntryPoint(parent)
            }
            else {
                const circle = d3.selectAll('circle').filter((d) => d.id === parent.id)
                const links = d3.selectAll('line').filter(l => l.source.id === parent.id || l.target.id === parent.id)
                d3.select('svg').transition().duration(1500).call(this.zoom.transform, d3.zoomIdentity.scale(1.5).translate(-circle.datum().x, -circle.datum().y))
                circle.transition().delay(1500).attr('class', 'selected')
                links.transition().delay(1500).attr('class', l => l.source.id === parent.id ? 'selected source' : 'selected target')
            }
            this.obj = this.nodes.find(o => o.id === parent.id)
            console.log(this.obj)
        }
    },
    mounted() {
        this.chart()
    }
})