'use client';

import { useEffect, useState } from 'react';
import {
  LINE_LANES,
  LINE_STATIONS,
  LINE_VIEW,
  LineStation,
} from '@/data/msflib-line.data';
import { GLASS_CARD } from '@/styles/glass.styles';

const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export default function MsflibLine() {
  const [selectedId, setSelectedId] = useState(LINE_STATIONS[0].id);
  const [motionOk, setMotionOk] = useState(false);
  const selected =
    LINE_STATIONS.find((station) => station.id === selectedId) ??
    LINE_STATIONS[0];

  useEffect(() => {
    const media = window.matchMedia(MOTION_QUERY);
    const apply = () => setMotionOk(!media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  return (
    <div className="mt-14 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="overflow-x-auto overscroll-x-contain rounded-modal bg-ink [color-scheme:dark]">
        <p className="f1-r px-5 pt-4 text-glass/70 lg:hidden">
          Swipe sideways to follow the line.
        </p>
        <div
          className="relative min-w-[920px] lg:min-w-0"
          style={{ aspectRatio: `${LINE_VIEW.w} / ${LINE_VIEW.h}` }}
          role="group"
          aria-label="MSFLib supply line"
        >
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${LINE_VIEW.w} ${LINE_VIEW.h}`}
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <filter
                id="msflib-line-glow"
                x="-40%"
                y="-40%"
                width="180%"
                height="180%"
              >
                <feGaussianBlur stdDeviation="3.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {LINE_LANES.map((lane) => {
              const hot =
                lane.from === selectedId || lane.to === selectedId;
              return (
                <g key={lane.id}>
                  <path
                    d={lane.d}
                    fill="none"
                    stroke="var(--glass)"
                    strokeOpacity={hot ? 0.9 : 0.28}
                    strokeWidth={hot ? 7 : 5}
                    strokeLinecap="round"
                    filter="url(#msflib-line-glow)"
                  />
                  <path
                    d={lane.d}
                    fill="none"
                    stroke="var(--glass)"
                    strokeOpacity={hot ? 0.95 : 0.45}
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  {motionOk && (
                    <>
                      <circle
                        r="3.4"
                        fill="var(--glass)"
                        filter="url(#msflib-line-glow)"
                      >
                        <animateMotion
                          dur={lane.dur}
                          repeatCount="indefinite"
                          path={lane.d}
                        />
                      </circle>
                      <circle
                        r="2.2"
                        fill="var(--glass)"
                        opacity="0.7"
                        filter="url(#msflib-line-glow)"
                      >
                        <animateMotion
                          dur={lane.dur}
                          begin="1.8s"
                          repeatCount="indefinite"
                          path={lane.d}
                        />
                      </circle>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
          {LINE_STATIONS.map((station) => (
            <StationButton
              key={station.id}
              station={station}
              pressed={station.id === selectedId}
              onSelect={setSelectedId}
            />
          ))}
        </div>
      </div>
      <StationDetail station={selected} />
    </div>
  );
}

function StationButton({
  station,
  pressed,
  onSelect,
}: {
  station: LineStation;
  pressed: boolean;
  onSelect: (id: string) => void;
}) {
  const left = `${(station.x / LINE_VIEW.w) * 100}%`;
  const top = `${(station.y / LINE_VIEW.h) * 100}%`;

  return (
    <div className="absolute" style={{ left, top }}>
      <button
        type="button"
        aria-pressed={pressed}
        aria-controls="msflib-detail"
        onClick={() => onSelect(station.id)}
        className={`absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-[background-color,border-color,color] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glass ${
          pressed
            ? 'border-glass bg-glass text-ink'
            : 'border-glass/40 bg-ink text-glass hover:border-glass hover:bg-glass/15'
        }`}
      >
        <span className="sr-only">{station.title}</span>
        <span aria-hidden="true" className="size-2.5 rounded-full bg-current" />
      </button>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-8 left-0 w-max -translate-x-1/2 f1-m ${
          pressed ? 'text-glass' : 'text-glass/75'
        }`}
      >
        {station.label}
      </span>
    </div>
  );
}

function StationDetail({ station }: { station: LineStation }) {
  return (
    <article
      id="msflib-detail"
      aria-live="polite"
      className={`${GLASS_CARD} p-6 sm:p-8`}
    >
      <h3 className="h5-b text-balance text-ink">{station.title}</h3>
      <p translate="no" className="b2-m mt-2 break-words text-ink">
        {station.packageName}
      </p>
      <p className="b2-r mt-4 text-pretty text-ink/70">{station.body}</p>
      <h4 className="f1-m mt-6 text-ink">Where Helpr uses it</h4>
      <p className="b2-r mt-2 text-pretty text-ink/70">{station.where}</p>
      <h4 className="f1-m mt-6 text-ink">MSFLib surface</h4>
      <ul className="mt-2 flex flex-col gap-2">
        {station.surface.map((item) => (
          <li key={item} translate="no" className="b2-r break-words text-ink/80">
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
