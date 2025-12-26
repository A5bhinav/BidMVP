// components/ui/ProgressIndicator.js
// Circular progress indicator component matching design.json specifications
// Props:
//   - progress: number (0-100) - progress percentage
//   - size: number (optional, default: 80) - diameter in pixels
//   - className: string (optional) - additional classes
//   - showText: boolean (default: true) - show percentage text

'use client'

export default function ProgressIndicator({ progress = 0, size = 80, className = '', showText = true, ...props }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} {...props}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#DC2626"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-bodySmall font-semibold text-primary-accent">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  )
}

