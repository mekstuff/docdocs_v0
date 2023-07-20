import logUpdatePrimitive from "log-update";
import primitiveSpinners, { Spinner } from "cli-spinners";

const logupdate = (
  content?: unknown,
  spinnerType?: keyof typeof primitiveSpinners | true
) => {
  let index = 0;
  let spinner: Spinner | undefined;
  if (spinnerType !== undefined) {
    if (spinnerType === true) {
      spinner = primitiveSpinners.dots;
    } else {
      spinner = spinnerType && (primitiveSpinners[spinnerType] as Spinner);
    }
  }
  let activeInterval: NodeJS.Timer;
  if (spinner) {
    activeInterval = setInterval(() => {
      const frame = spinner!.frames[(index = ++index % spinner!.frames.length)];
      logUpdatePrimitive(`${frame} ${content}`);
    }, spinner.interval);
  } else {
    logUpdatePrimitive(content as string);
  }
  return {
    /**
     * @prop state Defaults to true.
     */
    stop: (state?: boolean) => {
      if (state === undefined) {
        state = true;
      }
      if (activeInterval) {
        logUpdatePrimitive.clear();
        console.log((state ? "✅" : "❌") + " " + content);
        clearInterval(activeInterval);
      }
    },
  };
};

logupdate.clear = () => {
  return logUpdatePrimitive.clear();
};

logupdate.done = () => {
  return logUpdatePrimitive.done();
};

export default logupdate;

/*
export default function logupdate(
  content?: unknown,
  spinnerType?: keyof typeof primitiveSpinners | true
) {
  let index = 0;
  let spinner: Spinner | undefined;
  if (spinnerType !== undefined) {
    if (spinnerType === true) {
      spinner = primitiveSpinners.dots;
    } else {
      spinner = spinnerType && (primitiveSpinners[spinnerType] as Spinner);
    }
  }
  if (spinner) {
    setInterval(() => {
      const frame = spinner!.frames[(index = ++index % spinner!.frames.length)];
      logUpdatePrimitive(`${frame} ${content}`);
    }, spinner.interval);
  } else {
    logUpdatePrimitive(content as string);
  }
}
*/
