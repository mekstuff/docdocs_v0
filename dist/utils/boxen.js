import boxen from "boxen";
export function pbox(text, options) {
    return boxen(text, Object.assign(Object.assign({}, options), { padding: 0.5 }));
}
//# sourceMappingURL=boxen.js.map