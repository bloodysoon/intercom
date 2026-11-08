/**
 * Simulated camera picture used in demo mode or when the camera is unavailable.
 * A dim palace doorway at night with a figure in frame, sensor noise and slow
 * exposure drift — believable as a low-light security camera, never an error screen.
 */
export function DemoFeed({ subject = true }: { subject?: boolean }) {
  return (
    <div className="demo-feed" aria-hidden>
      <div className="demo-feed__scene" />
      <div className="demo-feed__arch" />
      <div className="demo-feed__lamp demo-feed__lamp--l" />
      <div className="demo-feed__lamp demo-feed__lamp--r" />
      {subject && (
        <div className="demo-feed__subject">
          <div className="demo-feed__crown" />
          <div className="demo-feed__head" />
          <div className="demo-feed__body" />
        </div>
      )}
      <div className="demo-feed__noise" />
      <div className="demo-feed__vignette" />
    </div>
  );
}
