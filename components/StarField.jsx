/**
 * components/StarField.jsx
 * A deterministic (SSR-safe) ambient night sky: fixed aurora glow + twinkling
 * stars. Star positions are derived from the index, so server and client
 * render the exact same tree and hydration never mismatches.
 */

function seededRandom(seed) {
  const x = Math.sin(seed * 997.3) * 10000;
  return x - Math.floor(x);
}

export default function StarField({ starCount = 34 }) {
  const stars = Array.from({ length: starCount }, (_, i) => {
    const left = seededRandom(i + 1) * 100;
    const top = seededRandom(i + 101) * 62;
    const size = 1 + seededRandom(i + 201) * 2;
    const delay = seededRandom(i + 301) * 3.4;
    const duration = 2.6 + seededRandom(i + 401) * 2.6;
    return { left, top, size, delay, duration, key: i };
  });

  return (
    <>
      <div aria-hidden="true" className="aurora" />
      <div aria-hidden="true">
        {stars.map((star) => (
          <span
            key={star.key}
            className="star"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}
