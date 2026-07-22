"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { ComboboxField } from "@/components/ui/combobox-field";

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
      <ComboboxField value={state} onValueChange={(value) => { onStateChange(value); onCityChange(""); }} options={states.map((value) => ({ value, label: value }))} placeholder="Search state" className="h-12 rounded-xl" />
      <ComboboxField value={city} onValueChange={onCityChange} options={visibleCities.map((value) => ({ value, label: value }))} disabled={!state} placeholder={state ? "Search city" : "Select a state first"} className="h-12 rounded-xl" />
    </>
  );
}
