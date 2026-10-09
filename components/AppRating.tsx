interface AppRatingProps {
  average: number;
  count: number;
}

export default function AppRating({ average, count }: AppRatingProps) {
  if (count === 0) {
    return <span className="b2-r text-text-light">New</span>;
  }

  return (
    <span className="b2-r text-text tabular-nums">
      {average.toFixed(1)} ({count})
    </span>
  );
}
