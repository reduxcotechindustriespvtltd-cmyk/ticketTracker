import { useState, useCallback } from "react";
import GuideTip from "./GuideTip";

const TAG_OPTIONS = [
  { value: "", label: "All Tags" },
  { value: "no_show", label: "No-Show" },
  { value: "cancelled_before_dep", label: "Cancelled Before Dep" },
  { value: "active", label: "Active" },
  { value: "used", label: "Used" },
  { value: "refunded", label: "Refunded" },
  { value: "retry_48hrs", label: "Retry 48h" },
  { value: "manual_check", label: "Manual Check" },
];

function stripEmpty(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v != null));
}

export default function FilterBar({ onFilter }) {
  const [tag, setTag] = useState("");
  const [carrier, setCarrier] = useState("");
  const [search, setSearch] = useState("");
  const [departureFrom, setDepartureFrom] = useState("");
  const [departureTo, setDepartureTo] = useState("");

  const emit = useCallback(
    (overrides) => {
      const merged = {
        tag,
        carrier,
        search,
        departure_from: departureFrom,
        departure_to: departureTo,
        ...overrides,
      };
      onFilter(stripEmpty(merged));
    },
    [tag, carrier, search, departureFrom, departureTo, onFilter]
  );

  function handleTagChange(e) {
    setTag(e.target.value);
    emit({ tag: e.target.value });
  }

  function handleCarrierChange(e) {
    const val = e.target.value.toUpperCase();
    setCarrier(val);
    if (val.length === 0 || val.length === 2) emit({ carrier: val });
  }

  function handleDepFromChange(e) {
    setDepartureFrom(e.target.value);
    emit({ departure_from: e.target.value });
  }

  function handleDepToChange(e) {
    setDepartureTo(e.target.value);
    emit({ departure_to: e.target.value });
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Enter") emit({ search });
  }

  function handleApply() {
    emit({});
  }

  function handleReset() {
    setTag(""); setCarrier(""); setSearch(""); setDepartureFrom(""); setDepartureTo("");
    onFilter({});
  }

  const hasFilters = tag || carrier || search || departureFrom || departureTo;

  return (
    <div className="card p-4" data-tour="filter-bar">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">
            Search
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Name, ticket#, PNR — press Enter"
            className="input-field py-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5 flex items-center">
            Tag
            <GuideTip tip="Filter by ticket category. 'No-Show' and 'Cancelled Before Dep' are the two recoverable categories — these are the ones you want to act on." position="bottom" />
          </label>
          <select value={tag} onChange={handleTagChange} className="input-field py-2" data-tour="filter-tag">
            {TAG_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">Carrier</label>
          <input
            value={carrier}
            onChange={handleCarrierChange}
            placeholder="AI"
            maxLength={2}
            className="input-field py-2 w-20"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">Dep. From</label>
          <input
            type="date"
            value={departureFrom}
            onChange={handleDepFromChange}
            className="input-field py-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">Dep. To</label>
          <input
            type="date"
            value={departureTo}
            onChange={handleDepToChange}
            className="input-field py-2"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={handleApply} className="btn-primary py-2">Apply</button>
          {hasFilters && (
            <button onClick={handleReset} className="btn-secondary py-2">Reset</button>
          )}
        </div>
      </div>
    </div>
  );
}
