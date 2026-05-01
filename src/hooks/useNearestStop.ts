import { useEffect, useState } from "react";
import {
  STOPS,
  NEAREST_STOP_ID,
  findNearestStop,
  type Stop,
} from "@/data/stops";

export type NearestSource = "default" | "geo" | "denied" | "unsupported";

export interface NearestStopState {
  stop: Stop;
  source: NearestSource;
  loading: boolean;
}

export function useNearestStop(): NearestStopState {
  const fallback =
    STOPS.find((s) => s.id === NEAREST_STOP_ID) ?? STOPS[0];
  const [state, setState] = useState<NearestStopState>({
    stop: fallback,
    source: "default",
    loading: true,
  });

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ stop: fallback, source: "unsupported", loading: false });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const stop = findNearestStop([
          pos.coords.latitude,
          pos.coords.longitude,
        ]);
        setState({ stop, source: "geo", loading: false });
      },
      () => setState({ stop: fallback, source: "denied", loading: false }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
