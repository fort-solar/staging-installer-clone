"use client";

import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/input";

type NigeriaLocationFieldsProps = {
  state: string;
  city: string;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
};

export function NigeriaLocationFields({
  state,
  city,
  onStateChange,
  onCityChange,
}: NigeriaLocationFieldsProps) {
  const id = useId();
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/locations/nigeria", { signal: controller.signal })
      .then((response) => response.json())
      .then((payload) => setStates(payload.data ?? []))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setStates([]);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!state) return;
    const controller = new AbortController();
    fetch(`/api/locations/nigeria?state=${encodeURIComponent(state)}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((payload) => setCities(payload.data ?? []))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setCities([]);
      });
    return () => controller.abort();
  }, [state]);

  const visibleCities = state ? cities : [];

  return (
    <>
      <Input value="Nigeria" readOnly aria-label="Country" className="h-12 rounded-xl bg-muted" />
      <>
        <Input
          list={`${id}-states`}
          value={state}
          onChange={(event) => {
            onStateChange(event.target.value);
            onCityChange("");
          }}
          placeholder="Search state"
          className="h-12 rounded-xl"
        />
        <datalist id={`${id}-states`}>
          {states.map((item) => <option key={item} value={item} />)}
        </datalist>
      </>
      <>
        <Input
          list={`${id}-cities`}
          value={city}
          onChange={(event) => onCityChange(event.target.value)}
          disabled={!state}
          placeholder={state ? "Search city" : "Select a state first"}
          className="h-12 rounded-xl"
        />
        <datalist id={`${id}-cities`}>
          {visibleCities.map((item) => <option key={item} value={item} />)}
        </datalist>
      </>
    </>
  );
}
