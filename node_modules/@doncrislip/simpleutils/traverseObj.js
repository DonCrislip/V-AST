export default (obj, func = () => {}) => {
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