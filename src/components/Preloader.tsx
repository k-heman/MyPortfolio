import { useEffect, useState } from 'react';
import './Preloader.scss';

interface PreloaderProps {
  progress: number;
  statusText: string;
}

export default function Preloader({ progress, statusText }: PreloaderProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Smoothly animate the progress bar visually
  useEffect(() => {
    let animationFrame: number;
    
    const animate = () => {
      setDisplayProgress(prev => {
        if (prev < progress) {
          return Math.min(prev + 2, progress);
        }
        return prev;
      });
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [progress]);

  const barLength = 30;
  const filledBlocks = Math.floor((displayProgress / 100) * barLength);
  const emptyBlocks = barLength - filledBlocks;
  const progressBar = `[${'='.repeat(filledBlocks)}${filledBlocks > 0 && filledBlocks < barLength ? '>' : ''}${' '.repeat(Math.max(0, emptyBlocks - (filledBlocks > 0 && filledBlocks < barLength ? 1 : 0)))}]`;

  return (
    <div className="preloader">
      <div className="preloader__terminal">
        <div className="preloader__header">
          <span className="preloader__dot preloader__dot--red" />
          <span className="preloader__dot preloader__dot--yellow" />
          <span className="preloader__dot preloader__dot--green" />
          <span className="preloader__title">bash - system_boot</span>
        </div>
        <div className="preloader__body">
          <p className="preloader__line">
            <span className="preloader__prompt">root@portfolio:~$</span> ./init_system.sh
          </p>
          <p className="preloader__line preloader__line--status">
            &gt; {statusText}
          </p>
          <div className="preloader__progress">
            <span className="preloader__progress-bar">{progressBar}</span>
            <span className="preloader__progress-text">{displayProgress}%</span>
          </div>
          {displayProgress === 100 && (
            <p className="preloader__line preloader__line--success">
              [OK] All modules loaded. Handing over to UI thread...
            </p>
          )}
          <span className="preloader__cursor" />
        </div>
      </div>
    </div>
  );
}
