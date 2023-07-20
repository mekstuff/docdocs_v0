import err from "./err.js";
/***/
export default function assert(condition, error, noExit) {
    if (!condition) {
        err(error, noExit);
    }
}
//# sourceMappingURL=assert.js.map