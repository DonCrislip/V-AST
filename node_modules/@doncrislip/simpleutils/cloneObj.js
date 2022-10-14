export default (source) => {
    function clone(obj) {
        if (typeof obj !== 'object' || obj === null) return obj;
        const _obj = obj.length >= 0 ? [] : {};
        if (obj.length >= 0) {
            for (let i = 0; i < obj.length; i++) {
                _obj.push(clone(obj[i]));
            }
        }
        else {
            Object.keys(obj).forEach(key => {
                if (typeof obj[key] === 'object') {
                    _obj[key] = clone(obj[key]);
                }
                else {
                    _obj[key] = obj[key];
                }
            })
        }
        return _obj;
    }
	return clone(source);
};
