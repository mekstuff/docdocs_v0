/**
 * Logs time information.
 */
import chalk from "chalk";
import assert from "./assert.js";
const WaypointIds = new Map();
/***/
export default function logwaypoint(waypointid, logInfo, clearWaypoint) {
    if (waypointid) {
        const tWaypoint = WaypointIds.get(waypointid);
        if (tWaypoint) {
            const tn = tWaypoint;
            const t = Math.floor(new Date().getTime() - tn.getTime());
            if (clearWaypoint) {
                removewaypoint(waypointid);
            }
            if (logInfo) {
                let clr = chalk.green;
                if (t > 15000) {
                    clr = chalk.red;
                }
                if (typeof logInfo === "boolean") {
                    logInfo = "Completed in";
                }
                console.log(logInfo + " " + clr(t + "ms"));
            }
            return t.toString();
        }
        return "NaN";
    }
    const uid = "waypoint-" + Math.random().toString(36).slice(2, 7);
    const nt = new Date();
    WaypointIds.set(uid, nt);
    return uid;
}
/**
 * Remove a waypoint id from memory
 */
export function removewaypoint(waypointid) {
    assert(typeof waypointid == "string", `string expected for waypoint id, got ${typeof waypointid}`);
    WaypointIds.delete(waypointid);
}
//# sourceMappingURL=logwaypoint.js.map